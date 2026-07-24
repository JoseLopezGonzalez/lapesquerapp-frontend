'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Printer, Bookmark } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import StatusBadge from '../../StatusBadge';
import { formatDate } from '@/helpers/formats/dates/formatDates';
import OrderEditSheet from '../OrderEditSheet';
import OrderStatusDropdown from './OrderStatusDropdown';
import OrderTemperatureDropdown from './OrderTemperatureDropdown';
import type { Order, OrderStatus } from '@/services/orderService';

const STATUS_COLORS: Record<OrderStatus, 'orange' | 'green' | 'red'> = {
  pending: 'orange',
  finished: 'green',
  incident: 'red',
};
const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'En producción',
  finished: 'Terminado',
  incident: 'Incidencia',
};

interface OrderHeaderDesktopProps {
  order: Order;
  transportImage: string;
  onStatusChange: (status: OrderStatus) => void;
  onTemperatureChange: (temperature: number) => void;
  onInvoicedChange: (invoiced: boolean) => void;
  onPrint: () => void;
  readOnly?: boolean;
}

/**
 * Header desktop: estado, id, cliente, fecha, temperatura; botones Editar/Imprimir/⋮; imagen transporte
 */
export default function OrderHeaderDesktop({
  order,
  transportImage,
  onStatusChange,
  onTemperatureChange,
  onInvoicedChange,
  onPrint,
  readOnly = false,
}: OrderHeaderDesktopProps) {
  const status = order.status as OrderStatus;
  const customer = order.customer as { id?: number | string; name?: string } | undefined;
  const transport = order.transport as { name?: string } | undefined;
  const invoiced = Boolean(order.invoiced);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
      <div className="flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          {readOnly ? (
            <StatusBadge
              color={STATUS_COLORS[status] ?? 'green'}
              label={STATUS_LABELS[status] ?? status}
            />
          ) : (
            <OrderStatusDropdown status={status} onStatusChange={onStatusChange} />
          )}
          {(order?.orderType ?? order?.order_type) === 'autoventa' && (
            <Badge variant="outline" aria-label="Tipo de pedido: Autoventa">
              Autoventa
              <Bookmark data-icon="inline-end" />
            </Badge>
          )}
        </div>
        <h3 className="text-base font-medium">#{order.id}</h3>
        <div>
          <p>
            <span className="text-base font-medium">{customer?.name ?? '—'}</span>
            <br />
            <span className="text-muted-foreground text-sm">Cliente Nº {customer?.id ?? '—'}</span>
            {order?.buyerReference ? (
              <>
                <br />
                <span className="text-muted-foreground text-sm">
                  Ref. cliente: {order.buyerReference as string}
                </span>
              </>
            ) : null}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Fecha de Carga</p>
          <p className="text-sm font-medium">{formatDate(order.loadDate)}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Temperatura</p>
          {readOnly ? (
            <p className="text-sm font-medium">
              {(order.temperature as string | number | undefined) ?? '-'}
            </p>
          ) : (
            <OrderTemperatureDropdown
              temperature={order.temperature as number | string | undefined}
              onTemperatureChange={onTemperatureChange}
            />
          )}
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Facturado</p>
          {readOnly ? (
            <p
              className={cn(
                'text-sm font-medium',
                invoiced ? 'text-emerald-600 dark:text-emerald-400' : ''
              )}
            >
              {invoiced ? 'Sí' : 'No'}
            </p>
          ) : (
            <button
              type="button"
              onClick={() => onInvoicedChange(!invoiced)}
              className="hover:text-muted-foreground text-sm font-medium underline decoration-dotted underline-offset-4 focus:outline-none"
            >
              <span className={cn(invoiced ? 'text-emerald-600 dark:text-emerald-400' : '')}>
                {invoiced ? 'Sí' : 'No'}
              </span>
            </button>
          )}
        </div>
        {order?.offerId ? (
          <div>
            <p className="text-muted-foreground text-sm">Oferta vinculada</p>
            <Link
              href={`/comercial/ofertas/${order.offerId}`}
              className="text-primary text-sm font-medium hover:underline"
            >
              Ver oferta #{order.offerId as string | number}
            </Link>
          </div>
        ) : null}
      </div>
      <div className="hidden h-fit flex-row gap-2 pt-2 lg:flex">
        <div className="flex max-w-sm flex-col items-end justify-end gap-3">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onPrint}>
              <Printer />
              Imprimir
            </Button>
            {!readOnly && <OrderEditSheet />}
          </div>
          <div className="flex flex-col items-end justify-center">
            <Image
              src={transportImage}
              alt={`Transporte ${transport?.name || ''}`}
              width={240}
              height={85}
              className="h-auto w-full max-w-[240px]"
            />
            <p className="text-base font-medium">{transport?.name || '-'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
