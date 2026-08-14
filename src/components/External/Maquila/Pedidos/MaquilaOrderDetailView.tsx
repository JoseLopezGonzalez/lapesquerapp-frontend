'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatDate } from '@/helpers/formats/dates/formatDates';
import { useMaquilaOrderDetail } from '@/hooks/orders/useMaquilaOrderDetail';
import { useMaquilaOrderIncident } from '@/hooks/orders/useMaquilaOrderIncident';
import { MaquilaOrderFormSheet } from './MaquilaOrderFormSheet';
import type { MaquilaOrderStatus } from '@/types/maquilaOrder';

const STATUS_BADGE_VARIANT: Record<MaquilaOrderStatus, 'info' | 'destructive' | 'success'> = {
  pending: 'info',
  incident: 'destructive',
  finished: 'success',
};

const STATUS_LABEL: Record<MaquilaOrderStatus, string> = {
  pending: 'Pendiente',
  incident: 'Incidencia',
  finished: 'Finalizado',
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="min-w-0 truncate text-sm font-medium">{value}</span>
    </div>
  );
}

interface MaquilaOrderDetailViewProps {
  orderId: number | string;
}

export function MaquilaOrderDetailView({ orderId }: MaquilaOrderDetailViewProps) {
  const router = useRouter();
  const { data: order, isLoading, error } = useMaquilaOrderDetail(orderId);
  const { incident } = useMaquilaOrderIncident(orderId);
  const [editOpen, setEditOpen] = useState(false);

  const customerName = order?.customerDisplayName ?? order?.adhocCustomerName ?? '—';

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex flex-shrink-0 items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/external/maquila/pedidos')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold">
            {isLoading ? (
              <Skeleton className="h-6 w-40" />
            ) : (
              (order?.buyerReference ?? `Pedido #${orderId}`)
            )}
          </h1>
        </div>
        {order && (
          <>
            <Badge variant={STATUS_BADGE_VARIANT[order.status]}>{STATUS_LABEL[order.status]}</Badge>
            {order.status !== 'finished' && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </Button>
            )}
          </>
        )}
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {error && !isLoading && <p className="text-destructive text-sm">{error}</p>}

      {order && !isLoading && (
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto">
          {incident && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>
                Incidencia {incident.status === 'open' ? 'abierta' : 'resuelta'}
              </AlertTitle>
              <AlertDescription>{incident.description}</AlertDescription>
            </Alert>
          )}

          <div className="divide-border divide-y">
            <InfoRow label="Cliente" value={customerName} />
            {order.adhocCustomerAddress && (
              <InfoRow label="Dirección" value={order.adhocCustomerAddress} />
            )}
            <InfoRow
              label="Fecha de entrada"
              value={order.entryDate ? formatDate(order.entryDate) : '—'}
            />
            <InfoRow
              label="Fecha de carga"
              value={order.loadDate ? formatDate(order.loadDate) : '—'}
            />
            <InfoRow label="Transporte" value={order.transport?.name ?? '—'} />
            {(order.truckPlate || order.trailerPlate) && (
              <InfoRow
                label="Matrículas"
                value={[order.truckPlate, order.trailerPlate].filter(Boolean).join(' / ') || '—'}
              />
            )}
            {order.temperature != null && (
              <InfoRow label="Temperatura" value={`${order.temperature} °C`} />
            )}
            {order.incoterm && <InfoRow label="Incoterm" value={order.incoterm.name} />}
            {order.pallets != null && <InfoRow label="Palets" value={order.pallets} />}
            {order.totalBoxes != null && <InfoRow label="Cajas" value={order.totalBoxes} />}
          </div>

          {order.transportationNotes && (
            <div>
              <p className="text-muted-foreground mb-1.5 text-[10px] font-medium tracking-wider uppercase">
                Notas de transporte
              </p>
              <p className="text-sm leading-relaxed">{order.transportationNotes}</p>
            </div>
          )}

          {(order.emails.length > 0 || order.ccEmails.length > 0) && (
            <div>
              <p className="text-muted-foreground mb-1.5 text-[10px] font-medium tracking-wider uppercase">
                Correos de aviso
              </p>
              <div className="flex flex-wrap gap-1.5">
                {order.emails.map((email) => (
                  <Badge key={email} variant="outline" className="text-xs">
                    {email}
                  </Badge>
                ))}
                {order.ccEmails.map((email) => (
                  <Badge key={email} variant="secondary" className="text-xs">
                    {email} (cc)
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {order && <MaquilaOrderFormSheet open={editOpen} onOpenChange={setEditOpen} order={order} />}
    </div>
  );
}
