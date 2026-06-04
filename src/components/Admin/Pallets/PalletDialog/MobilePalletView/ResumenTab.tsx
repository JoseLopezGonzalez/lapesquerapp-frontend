'use client';

import { formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';
import type { PalletState } from '@/hooks/pallets/palletHelpers';

interface ResumenTabProps {
  temporalPallet: PalletState;
}

export default function ResumenTab({ temporalPallet }: ResumenTabProps) {
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

  const productNames = [
    ...new Set(
      boxes
        .map((b) => (b.product as { name?: string } | null)?.name)
        .filter((n): n is string => Boolean(n))
    ),
  ];

  const lotNames = [...new Set(boxes.map((b) => b.lot).filter(Boolean))] as string[];

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1 rounded-lg bg-muted/50 p-3">
          <span className="text-xs text-muted-foreground">Cajas</span>
          <span className="text-2xl font-semibold">{boxes.length}</span>
        </div>
        <div className="flex flex-col gap-1 rounded-lg bg-muted/50 p-3">
          <span className="text-xs text-muted-foreground">Peso neto</span>
          <span className="text-2xl font-semibold">{formatDecimalWeight(totalWeight)}</span>
          <span className="text-xs text-muted-foreground">kg</span>
        </div>
        <div className="flex flex-col gap-1 rounded-lg bg-muted/50 p-3">
          <span className="text-xs text-muted-foreground">Tara palet</span>
          <span className="text-2xl font-semibold">
            {hasPalletTareWeight ? formatDecimalWeight(palletTareWeight) : '-'}
          </span>
          <span className="text-xs text-muted-foreground">kg</span>
        </div>
        <div className="flex flex-col gap-1 rounded-lg bg-muted/50 p-3">
          <span className="text-xs text-muted-foreground">Productos</span>
          <span className="text-2xl font-semibold">{uniqueProducts}</span>
        </div>
        <div className="flex flex-col gap-1 rounded-lg bg-muted/50 p-3">
          <span className="text-xs text-muted-foreground">Lotes</span>
          <span className="text-2xl font-semibold">{uniqueLots}</span>
        </div>
      </div>

      {productNames.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Productos
          </p>
          <ul className="space-y-1">
            {productNames.map((name) => (
              <li key={name} className="rounded-md bg-muted/40 px-3 py-2 text-sm">
                {name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {lotNames.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Lotes
          </p>
          <div className="flex flex-wrap gap-2">
            {lotNames.map((lot) => (
              <span
                key={lot}
                className="rounded-full bg-muted px-3 py-1 text-xs font-medium"
              >
                {lot}
              </span>
            ))}
          </div>
        </div>
      )}

      {boxes.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Añade cajas para ver el resumen.
        </p>
      )}
    </div>
  );
}
