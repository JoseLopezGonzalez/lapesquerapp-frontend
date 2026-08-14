'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/helpers/formats/dates/formatDates';
import { useMaquilaReturnDetail } from '@/hooks/tollClientReturns/useMaquilaReturnDetail';
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

interface MaquilaReturnDetailViewProps {
  returnId: number | string;
}

export function MaquilaReturnDetailView({ returnId }: MaquilaReturnDetailViewProps) {
  const router = useRouter();
  const { data: tollClientReturn, isLoading, error } = useMaquilaReturnDetail(returnId);
  const [selectedPalletId, setSelectedPalletId] = useState<number | null>(null);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex flex-shrink-0 items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/external/maquila/devoluciones')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="truncate text-xl font-semibold">
          {isLoading ? (
            <Skeleton className="h-6 w-40" />
          ) : tollClientReturn ? (
            `Devolución ${formatDate(tollClientReturn.date)}`
          ) : (
            `Devolución #${returnId}`
          )}
        </h1>
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {error && !isLoading && <p className="text-destructive text-sm">{error}</p>}

      {tollClientReturn && !isLoading && (
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto">
          <div className="divide-border divide-y">
            <InfoRow label="Fecha" value={formatDate(tollClientReturn.date)} />
            <InfoRow label="Referencia" value={tollClientReturn.documentReference ?? '—'} />
            <InfoRow label="Motivo" value={tollClientReturn.reason ?? '—'} />
            <InfoRow label="Transporte" value={tollClientReturn.transport?.name ?? '—'} />
          </div>

          {tollClientReturn.notes && (
            <div>
              <p className="text-muted-foreground mb-1.5 text-[10px] font-medium tracking-wider uppercase">
                Notas
              </p>
              <p className="text-sm leading-relaxed">{tollClientReturn.notes}</p>
            </div>
          )}

          <div>
            <p className="text-muted-foreground mb-2 text-[10px] font-medium tracking-wider uppercase">
              Palets devueltos ({tollClientReturn.pallets.length})
            </p>
            {tollClientReturn.pallets.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-sm">
                Sin palets asociados.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {tollClientReturn.pallets.map((pallet) => (
                  <MaquilaPalletCard
                    key={pallet.id}
                    pallet={pallet}
                    onClick={() => setSelectedPalletId(pallet.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <MaquilaPalletDetailSheet
        palletId={selectedPalletId}
        onOpenChange={(open) => !open && setSelectedPalletId(null)}
      />
    </div>
  );
}
