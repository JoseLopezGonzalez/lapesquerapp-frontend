'use client';

import { useRouter } from 'next/navigation';
import { ChevronRight, PackageOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/Utilities/EmptyState';
import Loader from '@/components/Utilities/Loader';
import { useFieldOrders } from '@/hooks/useFieldOrders';
import { getFieldStatusLabel } from '@/components/Field/labels';
import { formatDate } from '@/helpers/formats/dates/formatDates';
import StatusBadge from '@/components/Admin/OrdersManager/StatusBadge';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

function getDateMeta(loadDate) {
  if (!loadDate) {
    return {
      formattedDate: 'Sin fecha',
      relativeLabel: null,
    };
  }

  const loadDateObj = new Date(loadDate);
  const formattedDate = formatDate(loadDate);

  if (Number.isNaN(loadDateObj.getTime())) {
    return { formattedDate: 'Sin fecha', relativeLabel: null };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const loadDateOnly = new Date(loadDateObj.getFullYear(), loadDateObj.getMonth(), loadDateObj.getDate());

  const relativeLabel =
    loadDateOnly.getTime() === today.getTime()
      ? 'Hoy'
      : loadDateOnly.getTime() === tomorrow.getTime()
        ? 'Mañana'
        : null;

  return { formattedDate, relativeLabel };
}

function getStatusColor(status) {
  const normalized = typeof status === 'string' ? status.trim().toLowerCase() : status;
  if (normalized === 'finished' || normalized === 'completed') return 'green';
  if (normalized === 'incident' || normalized === 'cancelled' || normalized === 'canceled') return 'red';
  return 'orange';
}

function FieldOrderCard({ order, onClick }) {
  const isMobile = useIsMobile();
  const orderId = String(order.id ?? '').padStart(5, '0');
  const customerName = order.customer?.name || 'Sin cliente';
  const { formattedDate, relativeLabel } = getDateMeta(order.loadDate);
  const statusLabel = getFieldStatusLabel(order.status || 'pending');
  const statusColor = getStatusColor(order.status);
  const totalBoxes = order.totalBoxes ?? 0;
  const totalNetWeight = Number(order.totalNetWeight ?? 0).toFixed(2);

  return (
    <Card
      className={cn(
        'cursor-pointer transition-colors hover:bg-accent/30',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        statusColor === 'orange' && 'focus-visible:ring-orange-500',
        statusColor === 'green' && 'focus-visible:ring-green-500',
        statusColor === 'red' && 'focus-visible:ring-red-500'
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Pedido ${orderId} - ${customerName}`}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
    >
      <CardContent className="py-0">
        {isMobile ? (
          <div className="grow w-full min-w-0 flex items-center gap-3 pr-1">
            <div className="flex-1 min-w-0 space-y-1">
              <p className="font-medium text-base truncate leading-tight" title={customerName}>
                {customerName}
              </p>
              <p className="text-sm text-muted-foreground tabular-nums">
                #{orderId} · {formattedDate} · {totalBoxes} cajas · {totalNetWeight} kg
              </p>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                    statusColor === 'orange' && 'bg-orange-500/15 text-orange-700 dark:text-orange-300',
                    statusColor === 'green' && 'bg-green-500/15 text-green-700 dark:text-green-300',
                    statusColor === 'red' && 'bg-red-500/15 text-red-700 dark:text-red-300'
                  )}
                >
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      statusColor === 'orange' && 'bg-orange-500',
                      statusColor === 'green' && 'bg-green-500',
                      statusColor === 'red' && 'bg-red-500'
                    )}
                  />
                  {statusLabel}
                </span>
                {order?.orderType === 'autoventa' ? (
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-neutral-500/15 text-neutral-700 dark:text-neutral-300 border border-neutral-400/50 dark:border-neutral-500/50">
                    Autoventa
                  </span>
                ) : null}
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" aria-hidden />
          </div>
        ) : (
          <div className="grow w-full max-w-xs xl:max-w-none space-y-2 sm:space-y-2">
            <div className={cn('flex items-center gap-2 flex-wrap', relativeLabel && 'justify-between')}>
              <StatusBadge color={statusColor} label={statusLabel} />
              {relativeLabel ? (
                <span className="text-xs font-medium text-muted-foreground tabular-nums" title={formattedDate}>
                  {relativeLabel}
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-medium">#{orderId}</h3>
              {order?.orderType === 'autoventa' ? (
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-neutral-500/15 text-neutral-700 dark:text-neutral-300 border border-neutral-400/50 dark:border-neutral-500/50">
                  Autoventa
                </span>
              ) : null}
            </div>
            <div>
              <p className="font-medium text-base truncate" title={customerName}>
                {customerName}
              </p>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <p className="text-muted-foreground mb-1 text-xs">Fecha de Carga</p>
                <p className="text-sm font-medium">{formattedDate}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Cajas</p>
                <p className="text-sm font-medium">{totalBoxes}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Peso neto</p>
                <p className="text-sm font-medium">{totalNetWeight} kg</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function FieldOrdersPage() {
  const router = useRouter();
  const { data, isLoading, errorMessage } = useFieldOrders({ perPage: 20 });
  const orders = data?.items ?? [];

  if (isLoading) {
    return <div className="flex flex-1 items-center justify-center"><Loader /></div>;
  }

  if (errorMessage) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <EmptyState
          icon={<PackageOpen className="h-10 w-10 text-primary" />}
          title="No se pudieron cargar los pedidos"
          description={errorMessage}
        />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <EmptyState
          icon={<PackageOpen className="h-10 w-10 text-primary" />}
          title="Sin pedidos operativos"
          description="Cuando tengas pedidos asignados aparecerán aquí."
        />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Pedidos operativos</h1>
        <p className="text-sm text-muted-foreground">Abre un pedido prefijado y ajusta el contenido real servido.</p>
      </div>

      <div className="grid gap-4">
        {orders.map((order) => (
          <FieldOrderCard
            key={order.id}
            order={order}
            onClick={() => router.push(`/field/pedidos/${order.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
