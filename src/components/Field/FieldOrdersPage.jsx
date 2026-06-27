'use client';

import { useRouter } from 'next/navigation';
import { Loader2, MoreVertical, PackageOpen, Printer } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/Utilities/EmptyState';
import { useFieldOrder, useFieldOrders } from '@/hooks/useFieldOrders';
import { getFieldStatusLabel } from '@/components/Field/labels';
import { formatDate } from '@/helpers/formats/dates/formatDates';
import StatusBadge from '@/components/Admin/OrdersManager/StatusBadge';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { usePrintElement } from '@/hooks/usePrintElement';
import AutoventaTicketPrint from '@/components/Comercial/Autoventa/AutoventaTicketPrint';
import { mapPlannedProductDetailsToTicketItems } from '@/lib/field/fieldOrderTicket';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useMemo, useState } from 'react';

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
  const loadDateOnly = new Date(
    loadDateObj.getFullYear(),
    loadDateObj.getMonth(),
    loadDateObj.getDate()
  );

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
  if (normalized === 'incident' || normalized === 'cancelled' || normalized === 'canceled')
    return 'red';
  return 'orange';
}

function FieldOrdersListSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="space-y-1">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="py-0">
              <div className="flex w-full min-w-0 grow items-center gap-3 pt-3 pb-3 pr-1">
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-5 w-44" />
                  <Skeleton className="h-4 w-56" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function FieldOrderCard({ order, onClick, onQuickPrint }) {
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
        'hover:bg-accent/30 cursor-pointer transition-colors',
        'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
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
      <CardContent className="relative py-0">
        <div className="absolute top-2 right-2 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-11 w-11 touch-manipulation"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                aria-label="Acciones del pedido"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
            >
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onQuickPrint?.(order?.id);
                }}
              >
                <Printer className="h-4 w-4" />
                Imprimir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {isMobile ? (
          <div className="flex w-full min-w-0 grow items-center gap-3 pt-2 pr-1">
            <div className="min-w-0 flex-1 space-y-1">
              <p className="truncate text-base leading-tight font-medium" title={customerName}>
                {customerName}
              </p>
              <p className="text-muted-foreground text-sm tabular-nums">
                #{orderId} · {formattedDate} · {totalBoxes} cajas · {totalNetWeight} kg
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                    statusColor === 'orange' &&
                      'bg-orange-500/15 text-orange-700 dark:text-orange-300',
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
                  <span className="inline-flex items-center rounded-full border border-neutral-400/50 bg-neutral-500/15 px-2 py-0.5 text-[11px] font-medium text-neutral-700 dark:border-neutral-500/50 dark:text-neutral-300">
                    Autoventa
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1 pt-2" />
          </div>
        ) : (
          <div className="w-full max-w-xs grow space-y-2 sm:space-y-2 xl:max-w-none">
            <div
              className={cn(
                'flex flex-wrap items-center gap-2',
                relativeLabel && 'justify-between'
              )}
            >
              <StatusBadge color={statusColor} label={statusLabel} />
              {relativeLabel ? (
                <span
                  className="text-muted-foreground text-xs font-medium tabular-nums"
                  title={formattedDate}
                >
                  {relativeLabel}
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-medium">#{orderId}</h3>
              {order?.orderType === 'autoventa' ? (
                <span className="inline-flex items-center rounded-full border border-neutral-400/50 bg-neutral-500/15 px-2 py-0.5 text-[11px] font-medium text-neutral-700 dark:border-neutral-500/50 dark:text-neutral-300">
                  Autoventa
                </span>
              ) : null}
            </div>
            <div>
              <p className="truncate text-base font-medium" title={customerName}>
                {customerName}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <p className="text-muted-foreground mb-1 text-xs">Fecha de Carga</p>
                <p className="text-sm font-medium">{formattedDate}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-xs">Cajas</p>
                <p className="text-sm font-medium">{totalBoxes}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-xs">Peso neto</p>
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
  const { data, isLoading, errorMessage } = useFieldOrders({ perPage: 20, active: true });
  const orders = data?.items ?? [];
  const [printOrderId, setPrintOrderId] = useState(null);
  const [printOpen, setPrintOpen] = useState(false);
  const {
    data: printOrder,
    isLoading: printLoading,
    errorMessage: printError,
  } = useFieldOrder(printOrderId, { enabled: printOpen });
  const printId = useMemo(
    () => `field-order-ticket-print-${printOrderId ?? 'unknown'}`,
    [printOrderId]
  );
  const { onPrint } = usePrintElement({ id: printId, freeSize: true });

  const ticketData = useMemo(() => {
    if (!printOrder) return null;
    const items = mapPlannedProductDetailsToTicketItems(printOrder);
    return {
      entryDate: printOrder?.entryDate ?? '',
      customerName: printOrder?.customer?.name ?? '',
      invoiceRequired: Boolean(printOrder?.invoiceRequired ?? false),
      observations: printOrder?.observations ?? '',
      items,
    };
  }, [printOrder]);

  if (isLoading) {
    return <FieldOrdersListSkeleton />;
  }

  if (errorMessage) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <EmptyState
          icon={<PackageOpen className="text-primary h-10 w-10" />}
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
          icon={<PackageOpen className="text-primary h-10 w-10" />}
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
        <p className="text-muted-foreground text-sm">
          Abre un pedido prefijado y ajusta el contenido real servido.
        </p>
      </div>

      <div className="grid gap-4">
        {orders.map((order) => (
          <FieldOrderCard
            key={order.id}
            order={order}
            onClick={() => router.push(`/field/pedidos/${order.id}`)}
            onQuickPrint={(id) => {
              setPrintOrderId(id);
              setPrintOpen(true);
            }}
          />
        ))}
      </div>

      <Dialog open={printOpen} onOpenChange={setPrintOpen}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Imprimir ticket</DialogTitle>
            <DialogDescription>
              {printOrderId
                ? `Pedido #${String(printOrderId).padStart(5, '0')}`
                : 'Selecciona un pedido'}
            </DialogDescription>
          </DialogHeader>

          {printLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : printError ? (
            <EmptyState
              icon={<PackageOpen className="text-primary h-10 w-10" />}
              title="No se pudo cargar el pedido"
              description={printError}
            />
          ) : ticketData ? (
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">
                Cliente:{' '}
                <span className="text-foreground">{ticketData.customerName || 'Sin cliente'}</span>
              </p>
              <p className="text-muted-foreground text-sm">
                Fecha:{' '}
                <span className="text-foreground">{ticketData.entryDate || 'Sin fecha'}</span>
              </p>
            </div>
          ) : null}

          <DialogFooter className="sm:justify-center">
            <Button
              type="button"
              variant="default"
              size="sm"
              className="min-h-[40px] w-full touch-manipulation gap-2 text-sm transition-transform active:scale-[0.98] sm:w-auto sm:min-w-[200px]"
              onClick={onPrint}
              disabled={!ticketData || printLoading}
            >
              <Printer className="h-4 w-4 shrink-0" />
              Imprimir
            </Button>
          </DialogFooter>

          {ticketData ? (
            <AutoventaTicketPrint
              order={ticketData}
              state={ticketData}
              printId={printId}
              title="Ticket"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
