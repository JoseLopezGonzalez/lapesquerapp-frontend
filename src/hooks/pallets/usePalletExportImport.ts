'use client';

import { notify } from '@/lib/notifications';
import { downloadJsonFile } from '@/lib/utils/downloadJsonFile';
import { PalletBox, PalletState, ProductOption } from './palletHelpers';

export interface PalletExportFieldOptions {
  includeGs1: boolean;
  includeGrossWeight: boolean;
  includeManualCost: boolean;
  includeObservations: boolean;
}

interface PalletExportBox {
  product: { id: number | string; name: string } | null;
  lot: string;
  netWeight: number;
  gs1128?: string;
  grossWeight?: number;
  manualCostPerKg?: number | null;
}

interface PalletExportPayload {
  version: 1;
  exportedAt: string;
  palletId: number | string | null;
  boxCount: number;
  observations?: string;
  boxes: PalletExportBox[];
}

export interface PalletImportParsedBox {
  gs1128?: string;
  product?: { id: number | string; name: string } | null;
  lot?: string;
  netWeight?: number;
  grossWeight?: number;
  manualCostPerKg?: number | null;
}

export interface PalletImportPreview {
  boxesWithGs1: number;
  boxesWithoutGs1: number;
  invalidBoxes: number;
  observations: string | null;
  raw: PalletImportParsedBox[];
}

interface UsePalletExportImportParams {
  temporalPallet: PalletState | null;
  productsOptions: ProductOption[];
  addBox: (
    box: Partial<PalletBox> & {
      product: { id: number | string; name: string } | null;
      lot: string;
      netWeight: unknown;
    }
  ) => void;
  addBoxesFromGs1Lines: (gs1codes: string) => boolean;
  editObservations: (observations: string) => void;
}

// Mismo esquema de nombre de fichero que buildPdfDownloadName en src/services/palletService.ts,
// pero esa función no está exportada (es privada del módulo) — se replica aquí en pequeño.
function buildExportFileName(palletId: number | string | null): string {
  const now = new Date();
  const formattedDate = now.toLocaleDateString().replace(/\//g, '-');
  const formattedTime = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  return `palet-${palletId ?? 'nuevo'}__${formattedDate}__${formattedTime}.json`;
}

export function usePalletExportImport({
  temporalPallet,
  productsOptions,
  addBox,
  addBoxesFromGs1Lines,
  editObservations,
}: UsePalletExportImportParams) {
  const exportBoxes = (boxIds: (number | string)[], fields: PalletExportFieldOptions) => {
    if (!temporalPallet) return;
    const boxesToExport = temporalPallet.boxes.filter((box) => boxIds.includes(box.id));

    if (boxesToExport.length === 0) {
      notify.error({
        title: 'Sin cajas seleccionadas',
        description: 'Selecciona al menos una caja para exportar.',
      });
      return;
    }

    const boxes: PalletExportBox[] = boxesToExport.map((box) => {
      const exportedBox: PalletExportBox = {
        product: box.product,
        lot: box.lot,
        netWeight: box.netWeight,
      };
      if (fields.includeGs1 && box.gs1128) exportedBox.gs1128 = box.gs1128;
      if (fields.includeGrossWeight && box.grossWeight !== undefined) {
        exportedBox.grossWeight = box.grossWeight;
      }
      if (fields.includeManualCost) exportedBox.manualCostPerKg = box.manualCostPerKg ?? null;
      return exportedBox;
    });

    const payload: PalletExportPayload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      palletId: temporalPallet.id,
      boxCount: boxes.length,
      boxes,
    };
    if (fields.includeObservations && temporalPallet.observations) {
      payload.observations = temporalPallet.observations;
    }

    downloadJsonFile(payload, buildExportFileName(temporalPallet.id));
    notify.success({
      title: 'Palet exportado',
      description: `Se ha descargado el JSON con ${boxes.length} ${boxes.length === 1 ? 'caja' : 'cajas'}.`,
    });
  };

  const parseImportFile = async (file: File): Promise<PalletImportPreview | null> => {
    let parsed: unknown;
    try {
      const text = await file.text();
      parsed = JSON.parse(text);
    } catch {
      notify.error({
        title: 'Archivo no válido',
        description: 'El archivo seleccionado no es un JSON válido.',
      });
      return null;
    }

    const boxesRaw = (parsed as { boxes?: unknown })?.boxes;
    if (!Array.isArray(boxesRaw) || boxesRaw.length === 0) {
      notify.error({
        title: 'Formato no reconocido',
        description: 'El JSON debe tener un array "boxes" con al menos una caja.',
      });
      return null;
    }

    const raw: PalletImportParsedBox[] = [];
    let invalidBoxes = 0;
    boxesRaw.forEach((entry) => {
      if (!entry || typeof entry !== 'object') {
        invalidBoxes++;
        return;
      }
      const box = entry as Record<string, unknown>;
      const gs1128 = typeof box.gs1128 === 'string' ? box.gs1128 : undefined;
      const product = box.product as { id?: unknown; name?: unknown } | null;
      const hasManualFallback =
        product?.id !== undefined &&
        typeof box.lot === 'string' &&
        typeof box.netWeight === 'number';

      if (!gs1128 && !hasManualFallback) {
        invalidBoxes++;
        return;
      }
      raw.push({
        gs1128,
        product: product
          ? { id: product.id as number | string, name: String(product.name ?? '') }
          : null,
        lot: typeof box.lot === 'string' ? box.lot : undefined,
        netWeight: typeof box.netWeight === 'number' ? box.netWeight : undefined,
        grossWeight: typeof box.grossWeight === 'number' ? box.grossWeight : undefined,
        manualCostPerKg:
          typeof box.manualCostPerKg === 'number' || box.manualCostPerKg === null
            ? (box.manualCostPerKg as number | null)
            : undefined,
      });
    });

    const observations =
      typeof (parsed as { observations?: unknown }).observations === 'string'
        ? ((parsed as { observations: string }).observations as string)
        : null;

    return {
      boxesWithGs1: raw.filter((b) => !!b.gs1128).length,
      boxesWithoutGs1: raw.filter((b) => !b.gs1128).length,
      invalidBoxes,
      observations,
      raw,
    };
  };

  const importBoxes = (preview: PalletImportPreview, applyObservations: boolean) => {
    if (!temporalPallet) return;

    // box.gs1128 se guarda siempre en formato "bonito" con paréntesis por AI —
    // (01)GTIN(3102)PESO(10)LOTE, ver getGs1128 en usePalletBoxOperations.ts — pero
    // parseGs1128Line espera el formato crudo de escáner, sin paréntesis (dígitos
    // contiguos). Se quitan aquí antes de reenviarlo al mismo parser que usa el
    // formulario de alta manual por GS1-128.
    const gs1Lines = preview.raw
      .filter((b) => b.gs1128)
      .map((b) => (b.gs1128 as string).replace(/[()]/g, ''));
    let manualAdded = 0;
    let manualSkipped = 0;

    preview.raw
      .filter((b) => !b.gs1128)
      .forEach((b) => {
        const productExists = productsOptions.some((p) => p.value === b.product?.id);
        if (!productExists || !b.product || !b.lot || b.netWeight === undefined) {
          manualSkipped++;
          return;
        }
        addBox({
          product: b.product,
          lot: b.lot,
          netWeight: b.netWeight,
          grossWeight: b.grossWeight,
          manualCostPerKg: b.manualCostPerKg ?? undefined,
        });
        manualAdded++;
      });

    if (gs1Lines.length > 0) {
      addBoxesFromGs1Lines(gs1Lines.join('\n'));
    }

    if (applyObservations && preview.observations) {
      editObservations(preview.observations);
    }

    if (manualSkipped > 0) {
      notify.warning({
        title: 'Algunas cajas no se importaron',
        description: `${manualSkipped} ${manualSkipped === 1 ? 'caja no tenía' : 'cajas no tenían'} un producto reconocido en este palet.`,
      });
    }
    if (gs1Lines.length === 0 && manualAdded === 0) {
      notify.error({
        title: 'Nada que importar',
        description: 'No se pudo añadir ninguna caja desde el archivo.',
      });
    }
  };

  return { exportBoxes, parseImportFile, importBoxes };
}
