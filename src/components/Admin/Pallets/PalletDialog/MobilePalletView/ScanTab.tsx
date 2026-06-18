'use client';

import { type ChangeEvent, useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { ChevronDown, ChevronUp, Package, Plus, RotateCcw, Scan, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/Shadcn/Combobox';
import { formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';
import { parseGs1128Line } from '@/lib/gs1128Parser';
import type { BoxCreationData, PalletBox, PalletState, ProductOption } from '@/hooks/pallets/palletHelpers';
import type { QrValidateResult, ScannerBackend } from '@/components/Shared/QrScannerWidget';

const QrScannerWidget = dynamic(
  () => import('@/components/Shared/QrScannerWidget').then((m) => ({ default: m.QrScannerWidget })),
  { ssr: false }
);

interface ScanTabProps {
  temporalPallet: PalletState;
  productsOptions: ProductOption[];
  productsLoading: boolean;
  boxCreationData: BoxCreationData;
  boxCreationDataChange: (field: string, value: unknown) => void;
  onAddNewBox: (params: { method: string }) => void;
  onResetBoxCreationData: () => void;
  onDeleteBox: (boxId: number | string) => void;
  isReadOnly: boolean;
  canEditCost: boolean;
}

export default function ScanTab({
  temporalPallet,
  productsOptions,
  productsLoading,
  boxCreationData,
  boxCreationDataChange,
  onAddNewBox,
  onResetBoxCreationData,
  onDeleteBox,
  isReadOnly,
  canEditCost,
}: ScanTabProps) {
  const [scannerBackend, setScannerBackend] = useState<ScannerBackend | null>(null);
  const [manualOpen, setManualOpen] = useState(false);

  const validateGs1128 = useCallback(
    (rawValue: string): QrValidateResult => {
      const parsed = parseGs1128Line(rawValue, productsOptions as { value: unknown; label: unknown; boxGtin: unknown }[]);
      return parsed ? { ok: true } : { ok: false, message: 'Código GS1-128 no reconocido' };
    },
    [productsOptions],
  );

  const handleScannedCode = (rawValue: string) => {
    const code = String(rawValue ?? '').trim();
    if (!code) return;
    boxCreationDataChange('scannedCode', code);
  };

  const boxes: PalletBox[] = temporalPallet.boxes ?? [];
  const displayBoxes = [...boxes].reverse();

  return (
    <div className="flex flex-col gap-4">
      {/* Hero scan buttons — one per backend */}
      <div className="flex w-full gap-2">
        <button
          type="button"
          onClick={() => setScannerBackend('barcode-detector')}
          disabled={isReadOnly || productsLoading}
          className="flex h-16 flex-1 items-center justify-center gap-2.5 rounded-xl text-base font-semibold text-white shadow-lg transition-transform active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.82) 100%)',
            boxShadow: '0 4px 20px hsl(var(--primary) / 0.35), 0 0 0 1px hsl(var(--primary) / 0.2)',
          }}
        >
          <Scan className="h-5 w-5" />
          Escanear (ZXing)
        </button>
        <button
          type="button"
          onClick={() => setScannerBackend('zbar')}
          disabled={isReadOnly || productsLoading}
          className="flex h-16 flex-1 items-center justify-center gap-2.5 rounded-xl border border-primary/30 bg-primary/8 text-base font-semibold text-primary shadow-sm transition-transform active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
        >
          <Scan className="h-5 w-5" />
          Escanear (ZBar)
        </button>
      </div>

      {/* Manual entry */}
      {!isReadOnly && (
        <Collapsible open={manualOpen} onOpenChange={setManualOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between" disabled={productsLoading}>
              <span className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Añadir manualmente
              </span>
              {manualOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-3 rounded-lg border p-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Artículo</Label>
              <Combobox
                options={productsOptions}
                placeholder="Seleccionar artículo"
                searchPlaceholder="Buscar artículo..."
                notFoundMessage="No se encontraron artículos"
                value={boxCreationData.productId}
                onChange={(value) => boxCreationDataChange('productId', value)}
                disabled={isReadOnly}
                loading={productsLoading}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Lote</Label>
                <Input
                  type="text"
                  placeholder="Lote"
                  value={boxCreationData.lot}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => boxCreationDataChange('lot', e.target.value)}
                  disabled={isReadOnly}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Peso neto (kg)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={boxCreationData.netWeight}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => boxCreationDataChange('netWeight', e.target.value)}
                  className="text-right"
                  disabled={isReadOnly}
                />
              </div>
            </div>
            {canEditCost && (
              <div className="space-y-1.5">
                <Label className="text-xs">Coste manual (€/kg)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Opcional"
                  value={boxCreationData.manualCostPerKg}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => boxCreationDataChange('manualCostPerKg', e.target.value)}
                  className="text-right"
                  disabled={isReadOnly}
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onResetBoxCreationData}>
                <RotateCcw className="mr-2 h-3.5 w-3.5" />
                Limpiar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => onAddNewBox({ method: 'manual' })}
                disabled={productsLoading}
              >
                <Plus className="mr-2 h-3.5 w-3.5" />
                Añadir
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Box list header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          {boxes.length === 0
            ? 'Ninguna caja añadida'
            : boxes.length === 1
              ? '1 caja en el palet'
              : `${boxes.length} cajas en el palet`}
        </span>
      </div>

      {/* Box list */}
      {boxes.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed py-10">
          <div className="rounded-full bg-muted p-4">
            <Package className="h-10 w-10 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <p className="max-w-[220px] text-center text-sm text-muted-foreground">
            Escanea un código QR o añade una caja manualmente para comenzar.
          </p>
        </div>
      ) : (
        <ul className="overflow-hidden rounded-lg border divide-y">
          {displayBoxes.map((box) => (
            <li key={box.id} className="flex items-center gap-3 px-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {(box.product as { name?: string } | null)?.name ?? '—'}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {box.lot ? `Lote: ${box.lot} · ` : ''}
                  {formatDecimalWeight(box.netWeight)} kg
                </p>
              </div>
              {!isReadOnly && box.isAvailable !== false && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => onDeleteBox(box.id)}
                  aria-label="Eliminar caja"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Fullscreen camera scanner */}
      {scannerBackend && (
        <QrScannerWidget
          backend={scannerBackend}
          onScan={handleScannedCode}
          onClose={() => setScannerBackend(null)}
          onError={() => setScannerBackend(null)}
          validate={validateGs1128}
          statusText="Apunta al código GS1-128 de la caja"
          successText="Caja registrada"
        />
      )}
    </div>
  );
}
