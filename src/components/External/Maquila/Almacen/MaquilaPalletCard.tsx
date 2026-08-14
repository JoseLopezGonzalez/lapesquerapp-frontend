'use client';

import { Layers, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PalletImageStrip } from '@/components/Admin/Pallets/PalletAttachments/PalletImageStrip';
import { formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';
import {
  getAvailableBoxes,
  getAvailableBoxesCount,
  getAvailableNetWeight,
} from '@/helpers/pallet/boxAvailability';
import type { MaquilaPallet } from '@/types/pallet';

const STATE_BADGE_VARIANT: Record<MaquilaPallet['state']['id'], 'default' | 'info' | 'success'> = {
  registered: 'default',
  stored: 'info',
  shipped: 'success',
  processed: 'success',
};

interface MaquilaPalletCardProps {
  pallet: MaquilaPallet;
  onClick: () => void;
}

/**
 * Card presentacional de solo lectura para el almacén interactivo del portal de maquila —
 * variante sin useStoreContext (a diferencia de la card del admin), sin flip ni acciones:
 * el cliente de maquila nunca puede editar/mover/imprimir/duplicar un palet (403 fail-closed
 * en backend, ver docs/maquila/frontend/02-almacen-interactivo.md).
 */
export function MaquilaPalletCard({ pallet, onClick }: MaquilaPalletCardProps) {
  const availableBoxCount = getAvailableBoxesCount(pallet);
  const availableNetWeight = getAvailableNetWeight(pallet);
  const availableBoxes = getAvailableBoxes(pallet.boxes || []) as {
    product?: { id: string | number; name: string };
    netWeight: string | number;
  }[];

  const productsSummary = availableBoxes.reduce(
    (acc: Record<string | number, { name: string; netWeight: number; boxCount: number }>, box) => {
      const product = box.product;
      if (!product?.id) return acc;
      if (!acc[product.id]) {
        acc[product.id] = { name: product.name || '', netWeight: 0, boxCount: 0 };
      }
      acc[product.id].netWeight += Number(box.netWeight || 0);
      acc[product.id].boxCount += 1;
      return acc;
    },
    {}
  );
  const productsSummaryArray =
    Object.values(productsSummary).length > 0
      ? Object.values(productsSummary)
      : pallet.productsNames.map((name) => ({ name, netWeight: 0, boxCount: 0 }));
  const hasMultipleProducts = productsSummaryArray.length > 1;

  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-card border-border w-full cursor-pointer overflow-hidden rounded-2xl border text-left shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Header */}
      <div className="bg-muted/40 flex items-start justify-between gap-2 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <div className="bg-foreground flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg">
            <Layers className="text-background h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-foreground text-base leading-tight font-medium">
              Palet #{pallet.id}
            </p>
            {pallet.position && (
              <div className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{pallet.position}</span>
              </div>
            )}
          </div>
        </div>
        <Badge variant={STATE_BADGE_VARIANT[pallet.state.id]} className="flex-shrink-0 text-xs">
          {pallet.state.name}
        </Badge>
      </div>

      {/* Body */}
      <div className="space-y-3 px-4 py-3">
        <div>
          <p className="text-muted-foreground mb-1.5 text-[10px] font-medium tracking-wider uppercase">
            Productos
          </p>
          <div className="space-y-1.5">
            {productsSummaryArray.map((product, i) => (
              <div key={i} className="flex min-w-0 items-start gap-2">
                <div className="bg-foreground/8 mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 overflow-hidden">
                  <p className="line-clamp-2 text-sm leading-tight font-medium">{product.name}</p>
                  {hasMultipleProducts && product.boxCount > 0 && (
                    <p className="text-muted-foreground mt-0.5 truncate text-xs">
                      {formatDecimalWeight(product.netWeight)}
                      <span className="mx-1 opacity-40">·</span>
                      {product.boxCount} {product.boxCount === 1 ? 'caja' : 'cajas'}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {pallet.lots?.length > 0 && (
          <div>
            <p className="text-muted-foreground mb-1.5 text-[10px] font-medium tracking-wider uppercase">
              Lotes
            </p>
            <div className="flex flex-wrap gap-1">
              {pallet.lots.map((lot) => (
                <Badge
                  key={lot}
                  variant="outline"
                  className="bg-accent/60 text-accent-foreground border-border/60 max-w-full truncate text-xs"
                  title={lot}
                >
                  {lot}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {pallet.observations && (
          <div>
            <p className="text-muted-foreground mb-1 text-[10px] font-medium tracking-wider uppercase">
              Obs.
            </p>
            <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
              {pallet.observations}
            </p>
          </div>
        )}
      </div>

      <PalletImageStrip palletId={pallet.id} canInteract={false} />

      {/* Stats footer */}
      <div className="grid grid-cols-2 divide-x border-t">
        <div className="flex min-w-0 items-center justify-center gap-1.5 py-2.5">
          <span className="truncate text-sm font-medium tabular-nums">{availableBoxCount}</span>
          <span className="text-muted-foreground shrink-0 text-xs">
            {availableBoxCount === 1 ? 'caja' : 'cajas'}
          </span>
        </div>
        <div className="flex min-w-0 items-center justify-center gap-1.5 py-2.5">
          <span className="truncate text-sm font-medium tabular-nums">
            {formatDecimalWeight(availableNetWeight)}
          </span>
        </div>
      </div>
    </button>
  );
}
