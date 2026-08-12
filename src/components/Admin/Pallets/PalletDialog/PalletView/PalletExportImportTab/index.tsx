'use client';

import { useMemo, useRef, useState } from 'react';
import { Download, FileJson, FileUp, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { EmptyState } from '@/components/Utilities/EmptyState';
import { cn } from '@/lib/utils';

import type { PalletBox, PalletState, ProductOption } from '@/hooks/pallets/palletHelpers';
import {
  usePalletExportImport,
  type PalletImportPreview,
} from '@/hooks/pallets/usePalletExportImport';

export interface PalletExportImportTabProps {
  pallet: PalletState | null;
  productsOptions: ProductOption[];
  addBox: (
    box: Partial<PalletBox> & {
      product: { id: number | string; name: string } | null;
      lot: string;
      netWeight: unknown;
    }
  ) => void;
  editObservations: (observations: string) => void;
  isReadOnly: boolean;
  canEditCost: boolean;
}

export default function PalletExportImportTab({
  pallet,
  productsOptions,
  addBox,
  editObservations,
  isReadOnly,
  canEditCost,
}: PalletExportImportTabProps) {
  const { exportBoxes, parseImportFile, importBoxes } = usePalletExportImport({
    temporalPallet: pallet,
    productsOptions,
    addBox,
    editObservations,
  });

  const availableBoxes = useMemo(
    () => (pallet?.boxes ?? []).filter((box) => box.isAvailable !== false),
    [pallet?.boxes]
  );

  const [deselectedIds, setDeselectedIds] = useState<Set<number | string>>(new Set());
  const selectedIds = useMemo(
    () => availableBoxes.filter((box) => !deselectedIds.has(box.id)).map((box) => box.id),
    [availableBoxes, deselectedIds]
  );
  const allSelected = availableBoxes.length > 0 && deselectedIds.size === 0;

  const [includeGs1, setIncludeGs1] = useState(true);
  const [includeGrossWeight, setIncludeGrossWeight] = useState(false);
  const [includeManualCost, setIncludeManualCost] = useState(false);
  const [includeObservations, setIncludeObservations] = useState(false);

  const handleToggleBox = (boxId: number | string) => {
    setDeselectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(boxId)) next.delete(boxId);
      else next.add(boxId);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    setDeselectedIds(allSelected ? new Set(availableBoxes.map((box) => box.id)) : new Set());
  };

  const handleExport = () => {
    exportBoxes(selectedIds, {
      includeGs1,
      includeGrossWeight,
      includeManualCost: canEditCost && includeManualCost,
      includeObservations,
    });
  };

  // --- Import ---
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PalletImportPreview | null>(null);
  const [applyObservations, setApplyObservations] = useState(false);
  const [parsing, setParsing] = useState(false);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setPendingFile(file);
    setParsing(true);
    const result = await parseImportFile(file);
    setParsing(false);
    setPreview(result);
    setApplyObservations(false);
  };

  const clearImport = () => {
    setPendingFile(null);
    setPreview(null);
    setApplyObservations(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleConfirmImport = () => {
    if (!preview) return;
    importBoxes(preview, applyObservations);
    clearImport();
  };

  if (!pallet) return null;

  return (
    <div className="grid h-full min-h-0 grid-cols-2 gap-6">
      {/* Exportar */}
      <Card className="border-muted bg-foreground-50 flex h-full min-h-0 flex-col border-2">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Download className="text-primary h-5 w-5" />
            Exportar palet
          </CardTitle>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
          {availableBoxes.length === 0 ? (
            <EmptyState
              title="Sin cajas"
              description="Este palet todavía no tiene cajas disponibles para exportar."
            />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleToggleSelectAll}
                    aria-label="Seleccionar todas las cajas"
                  />
                  <Label className="text-sm font-normal">
                    Seleccionar todo ({selectedIds.length}/{availableBoxes.length})
                  </Label>
                </div>
              </div>

              <div className="max-h-56 min-h-0 flex-1 space-y-1 overflow-y-auto rounded-md border p-2">
                {availableBoxes.map((box) => (
                  <label
                    key={box.id}
                    className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm"
                  >
                    <Checkbox
                      checked={!deselectedIds.has(box.id)}
                      onCheckedChange={() => handleToggleBox(box.id)}
                    />
                    <span className="min-w-0 flex-1 truncate">
                      {box.product?.name ?? 'Sin producto'} · Lote {box.lot} · {box.netWeight} kg
                    </span>
                  </label>
                ))}
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Datos a incluir
                </p>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={includeGs1} onCheckedChange={(v) => setIncludeGs1(!!v)} />
                  Código GS1-128
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={includeGrossWeight}
                    onCheckedChange={(v) => setIncludeGrossWeight(!!v)}
                  />
                  Peso bruto
                </label>
                {canEditCost && (
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={includeManualCost}
                      onCheckedChange={(v) => setIncludeManualCost(!!v)}
                    />
                    Coste manual (€/kg)
                  </label>
                )}
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={includeObservations}
                    onCheckedChange={(v) => setIncludeObservations(!!v)}
                  />
                  Observaciones del palet
                </label>
              </div>

              <Button onClick={handleExport} disabled={selectedIds.length === 0}>
                <Download className="h-4 w-4" />
                Descargar JSON ({selectedIds.length})
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Importar */}
      <Card className="border-muted bg-foreground-50 flex h-full min-h-0 flex-col border-2">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileUp className="text-primary h-5 w-5" />
            Importar cajas
          </CardTitle>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
          {!pendingFile ? (
            <div
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors',
                dragging
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-muted/30',
                isReadOnly ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
              )}
              onDragOver={(e) => {
                if (isReadOnly) return;
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                if (isReadOnly) return;
                handleFile(e.dataTransfer.files?.[0] ?? null);
              }}
              onClick={() => !isReadOnly && inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                disabled={isReadOnly}
              />
              <FileJson className="text-muted-foreground h-8 w-8" />
              <p className="text-sm font-medium">Arrastra un JSON aquí o haz clic para elegir</p>
              <p className="text-muted-foreground text-xs">
                Debe tener la misma estructura que un JSON exportado desde este editor.
              </p>
            </div>
          ) : (
            <div className="flex flex-1 flex-col gap-4">
              <div className="flex items-center justify-between rounded-md border p-2">
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {pendingFile.name}
                </span>
                <Button variant="ghost" size="icon-sm" onClick={clearImport}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {parsing ? (
                <p className="text-muted-foreground text-sm">Leyendo archivo…</p>
              ) : preview ? (
                <div className="space-y-3">
                  <ul className="text-muted-foreground space-y-1 text-sm">
                    <li>{preview.boxesWithGs1} cajas con código GS1-128</li>
                    <li>
                      {preview.boxesWithoutGs1} cajas sin código GS1 (se usarán sus datos crudos)
                    </li>
                    {preview.invalidBoxes > 0 && (
                      <li className="text-destructive">
                        {preview.invalidBoxes} entradas descartadas por datos incompletos
                      </li>
                    )}
                  </ul>

                  {preview.observations && (
                    <label className="flex items-start gap-2 text-sm">
                      <Checkbox
                        checked={applyObservations}
                        onCheckedChange={(v) => setApplyObservations(!!v)}
                        className="mt-0.5"
                      />
                      <span>
                        Aplicar también las observaciones importadas:{' '}
                        <span className="text-muted-foreground italic">
                          &quot;{preview.observations}&quot;
                        </span>
                      </span>
                    </label>
                  )}

                  <Button
                    onClick={handleConfirmImport}
                    disabled={isReadOnly || preview.raw.length === 0}
                    className="w-full"
                  >
                    <FileUp className="h-4 w-4" />
                    Importar cajas al palet
                  </Button>
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
