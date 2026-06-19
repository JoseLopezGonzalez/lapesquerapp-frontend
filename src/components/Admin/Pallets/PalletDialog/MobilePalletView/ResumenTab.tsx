'use client';

import { formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';
import type { PalletState } from '@/hooks/pallets/palletHelpers';
import { MobilePalletScreenHeader } from './MobilePalletScreenHeader';

interface ResumenTabProps {
  temporalPallet: PalletState;
  onBack?: () => void;
}

export default function ResumenTab({ temporalPallet, onBack }: ResumenTabProps) {
  const boxes = temporalPallet.boxes ?? [];
  const totalWeight = boxes.reduce((sum, box) => sum + parseFloat(String(box.netWeight ?? 0)), 0);
  const uniqueProducts = new Set(
    boxes
      .map((b) => (b.product as { name?: string } | null)?.name)
      .filter((n): n is string => Boolean(n))
  ).size;
  const uniqueLots = new Set(boxes.map((b) => b.lot).filter(Boolean)).size;

  const palletTareWeight = Number(temporalPallet.palletTareWeightKg);
  const hasPalletTareWeight =
    temporalPallet.palletTareWeightKg !== null &&
    temporalPallet.palletTareWeightKg !== undefined &&
    temporalPallet.palletTareWeightKg !== '' &&
    Number.isFinite(palletTareWeight);

  const grossWeight = hasPalletTareWeight ? totalWeight + palletTareWeight : null;

  const productNames = [
    ...new Set(
      boxes
        .map((b) => (b.product as { name?: string } | null)?.name)
        .filter((n): n is string => Boolean(n))
    ),
  ];

  const lotNames = [...new Set(boxes.map((b) => b.lot).filter(Boolean))] as string[];

  return (
    <div className="flex h-full flex-col">
      {onBack && <MobilePalletScreenHeader title="Resumen" onBack={onBack} />}

      <div className="min-h-0 flex-1 overflow-auto px-3 py-4 pb-6">
        {boxes.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Añade cajas para ver el resumen.
          </p>
        ) : (
          <div className="flex flex-col gap-5">
            {/* Metrics grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1 rounded-lg border bg-card p-3">
                <span className="text-xs text-muted-foreground">Cajas</span>
                <span className="text-2xl font-semibold">{boxes.length}</span>
              </div>
              <div className="flex flex-col gap-1 rounded-lg border bg-card p-3">
                <span className="text-xs text-muted-foreground">Peso neto</span>
                <span className="text-2xl font-semibold">{formatDecimalWeight(totalWeight)}</span>
                <span className="text-xs text-muted-foreground">kg</span>
              </div>
              <div className="flex flex-col gap-1 rounded-lg border bg-card p-3">
                <span className="text-xs text-muted-foreground">Tara palet</span>
                <span className="text-2xl font-semibold">
                  {hasPalletTareWeight ? formatDecimalWeight(palletTareWeight) : '—'}
                </span>
                {hasPalletTareWeight && (
                  <span className="text-xs text-muted-foreground">kg</span>
                )}
              </div>
              <div className="flex flex-col gap-1 rounded-lg border bg-card p-3">
                <span className="text-xs text-muted-foreground">Productos</span>
                <span className="text-2xl font-semibold">{uniqueProducts}</span>
              </div>
              <div className="flex flex-col gap-1 rounded-lg border bg-card p-3">
                <span className="text-xs text-muted-foreground">Lotes</span>
                <span className="text-2xl font-semibold">{uniqueLots}</span>
              </div>

              {/* Gross weight — only when tare is set */}
              {grossWeight !== null && (
                <div className="col-span-2 flex flex-col gap-1 rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <span className="text-xs text-muted-foreground">Peso bruto estimado</span>
                  <span className="text-2xl font-semibold text-primary">
                    {formatDecimalWeight(grossWeight)}
                  </span>
                  <span className="text-xs text-muted-foreground">kg (neto + tara)</span>
                </div>
              )}
            </div>

            {productNames.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Productos
                </p>
                <ul className="space-y-1">
                  {productNames.map((name) => (
                    <li key={name} className="text-sm text-foreground">
                      · {name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {lotNames.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Lotes
                </p>
                <div className="flex flex-wrap gap-2">
                  {lotNames.map((lot) => (
                    <span
                      key={lot}
                      className="rounded-full border bg-card px-3 py-1 text-xs font-medium"
                    >
                      {lot}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
