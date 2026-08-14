'use client';

import { useEffect, useState } from 'react';
import { MapPin, Package } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';
import { usePalletAttachments } from '@/hooks/pallets/usePalletAttachments';
import { useMaquilaPalletDetail } from '@/hooks/pallets/useMaquilaPalletDetail';
import { getThumbnailBlobUrlCached } from '@/services/domain/pallets/palletAttachmentService';
import { MaquilaPalletImageViewer } from './MaquilaPalletImageViewer';
import type { MaquilaPallet } from '@/types/pallet';

const STATE_BADGE_VARIANT: Record<MaquilaPallet['state']['id'], 'default' | 'info' | 'success'> = {
  registered: 'default',
  stored: 'info',
  shipped: 'success',
  processed: 'success',
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="min-w-0 truncate text-sm font-medium">{value}</span>
    </div>
  );
}

function DetailImageGrid({ palletId }: { palletId: number | string }) {
  const { attachments, isLoading } = usePalletAttachments(palletId, { perPage: 20 });
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-md" />
        ))}
      </div>
    );
  }

  if (attachments.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {attachments.map((att, i) => (
          <button
            key={att.id}
            type="button"
            className="aspect-square overflow-hidden rounded-md"
            onClick={() => {
              setViewerIndex(i);
              setViewerOpen(true);
            }}
          >
            <ThumbImg palletId={palletId} attachmentId={att.id} />
          </button>
        ))}
      </div>
      <MaquilaPalletImageViewer
        palletId={palletId}
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        initialIndex={viewerIndex}
      />
    </>
  );
}

function ThumbImg({ palletId, attachmentId }: { palletId: number | string; attachmentId: number }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    getThumbnailBlobUrlCached(palletId, attachmentId)
      .then((url) => {
        if (!cancelled) setSrc(url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [palletId, attachmentId]);
  if (!src) return <Skeleton className="h-full w-full" />;
  return <img src={src} alt="" className="h-full w-full object-cover" draggable={false} />;
}

interface MaquilaPalletDetailSheetProps {
  palletId: number | string | null;
  onOpenChange: (open: boolean) => void;
}

/** Detalle de solo lectura de un palet propio — GET /pallets/{id} */
export function MaquilaPalletDetailSheet({
  palletId,
  onOpenChange,
}: MaquilaPalletDetailSheetProps) {
  const { data: pallet, isLoading, error } = useMaquilaPalletDetail(palletId ?? undefined);

  return (
    <Sheet open={palletId != null} onOpenChange={(open) => !open && onOpenChange(false)}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{pallet ? `Palet #${pallet.id}` : 'Palet'}</SheetTitle>
          <SheetDescription className="sr-only">Detalle del palet propio</SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-4 pb-6">
          {isLoading && (
            <div className="space-y-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}

          {error && <p className="text-destructive text-sm">{error}</p>}

          {pallet && (
            <>
              <div className="flex items-center justify-between">
                <Badge variant={STATE_BADGE_VARIANT[pallet.state.id]}>{pallet.state.name}</Badge>
                {pallet.position && (
                  <span className="text-muted-foreground flex items-center gap-1 text-xs">
                    <MapPin className="h-3 w-3" />
                    {pallet.position}
                  </span>
                )}
              </div>

              <div>
                <p className="text-muted-foreground mb-2 text-[10px] font-medium tracking-wider uppercase">
                  Resumen
                </p>
                <div className="divide-border divide-y">
                  <InfoRow label="Productos" value={pallet.productsNames.join(', ') || '—'} />
                  <InfoRow label="Nº de cajas" value={pallet.numberOfBoxes} />
                  <InfoRow
                    label="Cajas disponibles"
                    value={`${pallet.availableBoxesCount} (${formatDecimalWeight(pallet.totalAvailableWeight)})`}
                  />
                  {pallet.usedBoxesCount > 0 && (
                    <InfoRow
                      label="Cajas usadas"
                      value={`${pallet.usedBoxesCount} (${formatDecimalWeight(pallet.totalUsedWeight)})`}
                    />
                  )}
                  <InfoRow label="Peso neto total" value={formatDecimalWeight(pallet.netWeight)} />
                  {pallet.palletTareWeightKg != null && (
                    <InfoRow label="Tara" value={`${pallet.palletTareWeightKg} kg`} />
                  )}
                  {pallet.receptionId && (
                    <InfoRow label="Recepción" value={`#${pallet.receptionId}`} />
                  )}
                </div>
              </div>

              {pallet.lots.length > 0 && (
                <div>
                  <p className="text-muted-foreground mb-2 text-[10px] font-medium tracking-wider uppercase">
                    Lotes
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {pallet.lots.map((lot) => (
                      <Badge key={lot} variant="outline" className="text-xs">
                        {lot}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {pallet.observations && (
                <div>
                  <p className="text-muted-foreground mb-1.5 text-[10px] font-medium tracking-wider uppercase">
                    Observaciones
                  </p>
                  <p className="text-sm leading-relaxed">{pallet.observations}</p>
                </div>
              )}

              <div>
                <p className="text-muted-foreground mb-2 flex items-center gap-1.5 text-[10px] font-medium tracking-wider uppercase">
                  <Package className="h-3 w-3" />
                  Imágenes
                </p>
                <DetailImageGrid palletId={pallet.id} />
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
