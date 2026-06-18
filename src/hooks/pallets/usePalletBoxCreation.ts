'use client';

import { notify } from '@/lib/notifications';
import { parseGs1128Line, normalizeScannedCodeToGs1128 } from '@/lib/gs1128Parser';
import { canManagePalletCostFields } from '@/lib/auth/actor';
import {
  PalletBox,
  PalletState,
  BoxCreationData,
  ProductOption,
  recalculatePalletStats,
  roundToTwoDecimals,
  resetBoxCreationDataPreservingDiscounts,
  saveDiscountPreferences,
} from './palletHelpers';

interface UsePalletBoxCreationParams {
  temporalPallet: PalletState | null;
  setTemporalPallet: React.Dispatch<React.SetStateAction<PalletState | null>>;
  productsOptions: ProductOption[];
  addBox: (
    box: Partial<PalletBox> & {
      product: { id: number | string; name: string } | null;
      lot: string;
      netWeight: unknown;
    }
  ) => void;
  boxCreationData: BoxCreationData;
  setBoxCreationData: React.Dispatch<React.SetStateAction<BoxCreationData>>;
  session: { user?: unknown } | null;
}

export interface UsePalletBoxCreationResult {
  boxCreationDataChange: (field: string, value: unknown) => void;
  onAddNewBox: (params: { method: string }) => void;
  onDeleteScannedCode: () => void;
  onResetBoxCreationData: () => void;
}

export function usePalletBoxCreation({
  temporalPallet,
  setTemporalPallet,
  productsOptions,
  addBox,
  boxCreationData,
  setBoxCreationData,
  session,
}: UsePalletBoxCreationParams): UsePalletBoxCreationResult {
  const getProductById = (productId: number | string) => {
    const product = productsOptions.find((p) => p.value === productId);
    if (!product) return null;
    return { id: product.value, name: String(product.label) };
  };

  const boxCreationDataChange = (field: string, value: unknown) => {
    setBoxCreationData((prev) => ({ ...prev, [field]: value }));
  };

  const onAddNewBox = ({ method }: { method: string }) => {
    if (!temporalPallet) return;
    const {
      productId,
      lot,
      netWeight,
      weights,
      totalWeight,
      numberOfBoxes,
      palletWeight,
      boxTare,
      scannedCode,
      manualCostPerKg,
    } = boxCreationData;

    if (method === 'manual') {
      if (!productId || !lot || !netWeight) {
        notify.error({
          title: 'Campos requeridos',
          description: 'Por favor, completa producto, lote y peso para crear la caja.',
        });
        return;
      }
      const product = getProductById(productId as number | string);
      const parsedCost = manualCostPerKg ? parseFloat(manualCostPerKg) : null;
      const canCost = canManagePalletCostFields(
        session?.user as Parameters<typeof canManagePalletCostFields>[0]
      );
      const newBox: Parameters<typeof addBox>[0] = {
        product,
        lot,
        netWeight: roundToTwoDecimals(netWeight),
        scannedCode,
      };
      if (canCost && parsedCost !== null && !isNaN(parsedCost)) {
        (newBox as Record<string, unknown>).manualCostPerKg = parsedCost;
      }
      addBox(newBox);
      notify.success({
        title: 'Caja creada',
        description: 'Se ha añadido una caja al palet con el producto y peso indicados.',
      });
    } else if (method === 'average') {
      if (!productId || !totalWeight || !numberOfBoxes) {
        notify.error({
          title: 'Campos requeridos',
          description: 'Por favor, completa producto, peso total y número de cajas.',
        });
        return;
      }

      saveDiscountPreferences(boxCreationData);

      const palletWeightValue = palletWeight ? parseFloat(palletWeight) : 0;
      const boxTareValue = boxTare ? parseFloat(boxTare) : 0;
      const totalBoxTare = boxTareValue * parseFloat(numberOfBoxes);
      const netTotalWeight = parseFloat(totalWeight) - palletWeightValue - totalBoxTare;
      const numberOfBoxesInt = parseInt(numberOfBoxes);
      const averageNetWeight = netTotalWeight / numberOfBoxesInt;
      const standardWeight = roundToTwoDecimals(averageNetWeight);
      let accumulatedWeight = 0;

      for (let i = 0; i < numberOfBoxesInt; i++) {
        const product = getProductById(productId as number | string);
        let boxWeight: number;
        if (i === numberOfBoxesInt - 1) {
          boxWeight = roundToTwoDecimals(netTotalWeight - accumulatedWeight);
        } else {
          boxWeight = standardWeight;
          accumulatedWeight += boxWeight;
        }
        addBox({ product, lot, netWeight: boxWeight, scannedCode });
      }

      notify.success({
        title: 'Cajas creadas',
        description: `Se han creado ${numberOfBoxesInt} cajas con peso medio calculado a partir del total y la tara.`,
      });
    } else if (method === 'bulk') {
      if (!productId || !weights) {
        notify.error({
          title: 'Campos requeridos',
          description: 'Por favor, completa producto, lote y la lista de pesos (uno por línea).',
        });
        return;
      }

      const weightsLines = weights
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line !== '');

      let hasError = false;
      const weightsArray: number[] = [];

      weightsLines.forEach((line) => {
        const cleanLine = line.replace(',', '.');
        if (!/^\d*\.?\d+$/.test(cleanLine)) {
          hasError = true;
          return;
        }
        const weight = parseFloat(cleanLine);
        if (isNaN(weight) || weight <= 0) {
          hasError = true;
          return;
        }
        weightsArray.push(weight);
      });

      if (hasError) {
        notify.error({
          title: 'Datos no válidos',
          description:
            'Algunas líneas tienen símbolos no permitidos o pesos negativos. Usa solo números y punto decimal, uno por línea.',
        });
        return;
      }

      if (weightsArray.length === 0) {
        notify.error({
          title: 'Sin pesos',
          description: 'Por favor, ingresa al menos un peso válido (número positivo) por línea.',
        });
        return;
      }

      weightsArray.forEach((weight) => {
        const product = getProductById(productId as number | string);
        addBox({ product, lot, netWeight: roundToTwoDecimals(weight), scannedCode });
      });

      notify.success({
        title: 'Cajas agregadas',
        description: `Se han añadido ${weightsArray.length} cajas al palet con los pesos indicados.`,
      });
    } else if (method === 'lector') {
      if (!scannedCode) {
        notify.error({
          title: 'Código vacío',
          description: 'Por favor, escanea un código GS1-128 válido.',
        });
        return;
      }

      const parsed = (
        parseGs1128Line as (
          code: string,
          options: ProductOption[]
        ) => Record<string, unknown> | null
      )(scannedCode, productsOptions);
      if (!parsed) {
        const match =
          scannedCode.match(/01(\d{14})3100(\d{6})10(.+)/) ||
          scannedCode.match(/01(\d{14})3200(\d{6})10(.+)/);
        if (!match) {
          notify.error({
            title: 'Código no válido',
            description:
              'Se espera formato GS1-128 con 3100 (kg) o 3200 (libras). Revisa el código escaneado.',
          });
        } else {
          const [, gtin] = match;
          notify.error({
            title: 'Producto no encontrado',
            description: `No hay ningún producto con GTIN ${gtin}. Comprueba que el código corresponda a un producto dado de alta.`,
          });
        }
        return;
      }

      addBox({
        product: { id: parsed.productId as number | string, name: parsed.productName as string },
        lot: parsed.lot as string,
        netWeight: parsed.netWeight as number,
        scannedCode: parsed.gs1128 as string,
        isPounds: parsed.isPounds as boolean,
        originalWeightInPounds: (parsed.originalWeightInPounds as number | undefined) ?? null,
      });
    } else if (method === 'gs1') {
      const { gs1codes } = boxCreationData;

      if (!gs1codes) {
        notify.error({
          title: 'Códigos requeridos',
          description: 'Por favor, pega los códigos GS1-128, uno por línea.',
        });
        return;
      }

      const lines = gs1codes
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      const parsedBoxes: Parameters<typeof addBox>[0][] = [];
      const failedLines: string[] = [];

      for (const line of lines) {
        const parsed = (
          parseGs1128Line as (
            code: string,
            options: ProductOption[]
          ) => Record<string, unknown> | null
        )(line, productsOptions);
        if (!parsed) {
          failedLines.push(line);
          continue;
        }
        parsedBoxes.push({
          product: { id: parsed.productId as number | string, name: parsed.productName as string },
          lot: parsed.lot as string,
          netWeight: parsed.netWeight as number,
          scannedCode: parsed.gs1128 as string,
          isPounds: parsed.isPounds as boolean,
          originalWeightInPounds: (parsed.originalWeightInPounds as number | undefined) ?? null,
        });
      }

      if (parsedBoxes.length === 0) {
        notify.error({
          title: 'Códigos no procesados',
          description:
            'Ninguno de los códigos pudo ser procesado. Verifica que tengan formato 01(GTIN)3100/3200(peso)10(lote) y que los productos existan.',
        });
        return;
      }

      parsedBoxes.forEach(addBox);

      if (failedLines.length > 0) {
        notify.error({
          title: 'Algunos códigos no reconocidos',
          description: `${failedLines.length} ${failedLines.length === 1 ? 'código no' : 'códigos no'} fueron reconocidos. Revisa el formato (01+GTIN+3100/3200+peso+10+lote) y que los productos existan.`,
        });
        console.warn('Códigos fallidos:', failedLines);
      } else {
        notify.success({
          title: 'Cajas agregadas',
          description: `Se han añadido ${parsedBoxes.length} cajas al palet desde los códigos GS1-128.`,
        });
      }

      setBoxCreationData((prev) => resetBoxCreationDataPreservingDiscounts(prev));
    }

    setBoxCreationData((prev) => resetBoxCreationDataPreservingDiscounts(prev));
  };

  const onDeleteScannedCode = () => {
    if (!temporalPallet) return;

    const scannedCode = boxCreationData.deleteScannedCode.trim();
    if (!scannedCode) {
      notify.error({
        title: 'Código vacío',
        description: 'Por favor, escanea el código de la caja que quieres eliminar.',
      });
      return;
    }

    const gs1128Code = (normalizeScannedCodeToGs1128 as (code: string) => string | null)(
      scannedCode
    );
    if (!gs1128Code) {
      notify.error({
        title: 'Código no válido',
        description:
          'El formato del código escaneado no es válido para eliminar. Usa un código GS1-128 de una caja del palet.',
      });
      return;
    }

    const boxToDelete = temporalPallet.boxes.find((box) => box.gs1128 === gs1128Code);
    if (!boxToDelete) {
      notify.error({
        title: 'Caja no encontrada',
        description: 'No hay ninguna caja en este palet que coincida con el código escaneado.',
      });
      return;
    }

    setTemporalPallet((prev) =>
      prev
        ? recalculatePalletStats({
            ...prev,
            boxes: prev.boxes.filter((box) => box.id !== boxToDelete.id),
          })
        : prev
    );

    notify.success({
      title: 'Caja eliminada',
      description: 'La caja se ha eliminado del palet tras escanear su código.',
    });
    setBoxCreationData((prev) => ({ ...prev, deleteScannedCode: '' }));
  };

  const onResetBoxCreationData = () => {
    setBoxCreationData((prev) => {
      const reset = {
        productId: '' as const,
        lot: '',
        netWeight: '' as const,
        weights: '',
        totalWeight: '',
        numberOfBoxes: '',
        palletWeight: prev.palletWeight || '',
        showPalletWeight: prev.showPalletWeight !== undefined ? prev.showPalletWeight : false,
        boxTare: prev.boxTare || '',
        showBoxTare: prev.showBoxTare !== undefined ? prev.showBoxTare : false,
        scannedCode: '',
        deleteScannedCode: '',
        gs1codes: '',
        manualCostPerKg: '',
      };
      return reset;
    });
  };

  return { boxCreationDataChange, onAddNewBox, onDeleteScannedCode, onResetBoxCreationData };
}
