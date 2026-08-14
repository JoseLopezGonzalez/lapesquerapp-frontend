'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate } from '@/helpers/formats/dates/formatDates';
import { formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';
import { useMaquilaReceptionDetail } from '@/hooks/receptions/useMaquilaReceptionDetail';
import { useReceptionAttachments } from '@/hooks/receptions/useReceptionAttachments';
import {
  getReceptionBlobUrlCached,
  getReceptionThumbnailBlobUrlCached,
} from '@/services/domain/receptions/receptionAttachmentService';
import { MaquilaAttachmentsGrid } from '../Shared/MaquilaAttachmentsGrid';
import { MaquilaPalletCard } from '../Almacen/MaquilaPalletCard';
import { MaquilaPalletDetailSheet } from '../Almacen/MaquilaPalletDetailSheet';

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="min-w-0 truncate text-sm font-medium">{value}</span>
    </div>
  );
}

interface MaquilaReceptionDetailViewProps {
  receptionId: number | string;
}

export function MaquilaReceptionDetailView({ receptionId }: MaquilaReceptionDetailViewProps) {
  const router = useRouter();
  const { data: reception, isLoading, error } = useMaquilaReceptionDetail(receptionId);
  const { attachments, isLoading: attachmentsLoading } = useReceptionAttachments(receptionId);
  const [selectedPalletId, setSelectedPalletId] = useState<number | null>(null);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex flex-shrink-0 items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/external/maquila/recepciones')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold">
            {isLoading ? (
              <Skeleton className="h-6 w-40" />
            ) : reception ? (
              `Recepción ${formatDate(reception.date)}`
            ) : (
              `Recepción #${receptionId}`
            )}
          </h1>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {error && !isLoading && <p className="text-destructive text-sm">{error}</p>}

      {reception && !isLoading && (
        <Tabs defaultValue="resumen" className="min-h-0 flex-1">
          <TabsList>
            <TabsTrigger value="resumen">Resumen</TabsTrigger>
            <TabsTrigger value="palets">Palets ({reception.pallets.length})</TabsTrigger>
            <TabsTrigger value="adjuntos">Adjuntos</TabsTrigger>
          </TabsList>

          <TabsContent value="resumen" className="space-y-5 overflow-y-auto">
            <div className="divide-border divide-y">
              <InfoRow label="Fecha" value={formatDate(reception.date)} />
              <InfoRow label="Especies" value={reception.species.join(', ') || '—'} />
              <InfoRow
                label="Peso declarado"
                value={formatDecimalWeight(reception.declaredTotalNetWeight)}
              />
              <InfoRow label="Peso real" value={formatDecimalWeight(reception.netWeight)} />
            </div>

            {reception.notes && (
              <div>
                <p className="text-muted-foreground mb-1.5 text-[10px] font-medium tracking-wider uppercase">
                  Notas
                </p>
                <p className="text-sm leading-relaxed">{reception.notes}</p>
              </div>
            )}

            {reception.details.length > 0 && (
              <div>
                <p className="text-muted-foreground mb-2 text-[10px] font-medium tracking-wider uppercase">
                  Detalle por producto
                </p>
                <div className="divide-border divide-y">
                  {reception.details.map((detail, i) => {
                    const productName =
                      typeof detail.productName === 'string' ? detail.productName : null;
                    const netWeight =
                      typeof detail.netWeight === 'number' ? detail.netWeight : null;
                    return (
                      <div key={i} className="flex items-center justify-between gap-3 py-1.5">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {productName ?? `Producto #${detail.productId}`}
                          </p>
                          {detail.lot && (
                            <p className="text-muted-foreground text-xs">Lote {detail.lot}</p>
                          )}
                        </div>
                        {netWeight != null && (
                          <span className="flex-shrink-0 text-sm tabular-nums">
                            {formatDecimalWeight(netWeight)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="palets" className="overflow-y-auto">
            {reception.pallets.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                Esta recepción no tiene palets asociados.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {reception.pallets.map((pallet) => (
                  <MaquilaPalletCard
                    key={pallet.id}
                    pallet={pallet}
                    onClick={() => setSelectedPalletId(pallet.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="adjuntos" className="overflow-y-auto">
            <MaquilaAttachmentsGrid
              attachments={attachments}
              isLoading={attachmentsLoading}
              getThumbnailUrl={(attachmentId) =>
                getReceptionThumbnailBlobUrlCached(receptionId, attachmentId)
              }
              getBlobUrl={(attachmentId) => getReceptionBlobUrlCached(receptionId, attachmentId)}
              emptyTitle="Sin adjuntos"
              emptyDescription="Esta recepción no tiene fotos ni documentos adjuntos."
            />
          </TabsContent>
        </Tabs>
      )}

      <MaquilaPalletDetailSheet
        palletId={selectedPalletId}
        onOpenChange={(open) => !open && setSelectedPalletId(null)}
      />
    </div>
  );
}
