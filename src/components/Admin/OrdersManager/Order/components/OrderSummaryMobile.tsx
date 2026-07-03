'use client';

import { ThermometerSnowflake, ShoppingBag, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDate } from '@/helpers/formats/dates/formatDates';
import { formatInteger, formatDecimalCurrency } from '@/helpers/formats/numbers/formatNumbers';
import StatusBadge from '../../StatusBadge';
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

const TEMPERATURE_OPTIONS = [0, 4, -18, -23];

interface OrderSummaryMobileProps {
  order: Order;
  transportImage: string;
  onStatusChange: (status: OrderStatus) => void;
  onTemperatureChange: (temperature: number) => void;
  readOnly?: boolean;
}

/**
 * Cabecera centrada móvil: cliente, transporte, estado, fecha, temperatura, palets, importe
 */
export default function OrderSummaryMobile({
  order,
  transportImage,
  onStatusChange,
  onTemperatureChange,
  readOnly = false,
}: OrderSummaryMobileProps) {
  const status = order.status as OrderStatus;
  const customer = order.customer as { id?: number | string; name?: string } | undefined;
  const transport = order.transport as { name?: string } | undefined;

  return (
    <div className="flex-shrink-0 space-y-5 px-4 pt-6 text-center">
      <div className="flex flex-col items-center gap-2">
        {(order?.orderType ?? order?.order_type) === 'autoventa' && (
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-400 bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-800 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-200"
            aria-label="Tipo de pedido: Autoventa"
          >
            <ShoppingBag className="h-3.5 w-3.5" aria-hidden />
            Autoventa
          </span>
        )}
        <div>
          <p className="text-xl font-medium">{customer?.name ?? '—'}</p>
          <p className="text-muted-foreground mt-1 text-base">Cliente Nº {customer?.id ?? '—'}</p>
          {order?.buyerReference ? (
            <p className="text-muted-foreground mt-1 text-sm">
              Ref. cliente: {order.buyerReference as string}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col items-center justify-center gap-2">
        <Image
          className="h-auto max-w-[170px]"
          src={transportImage}
          width={170}
          height={96}
          alt={`Transporte ${transport?.name || ''}`}
        />
        <p className="text-lg font-medium">{transport?.name || '-'}</p>
      </div>

      <div className="flex justify-center">
        {readOnly ? (
          <StatusBadge color={STATUS_COLORS[status]} label={STATUS_LABELS[status]} />
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-1 focus:outline-none">
              <StatusBadge color={STATUS_COLORS[status]} label={STATUS_LABELS[status]} />
              <ChevronDown className="text-muted-foreground h-3.5 w-3.5" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="flex flex-col items-end">
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => onStatusChange('pending')}
              >
                <StatusBadge color="orange" label="En producción" />
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => onStatusChange('finished')}
              >
                <StatusBadge color="green" label="Terminado" />
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => onStatusChange('incident')}
              >
                <StatusBadge color="red" label="Incidencia" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-6">
        <div>
          <p className="text-muted-foreground mb-1 text-sm">Fecha de Carga</p>
          <p className="text-lg font-medium">{formatDate(order.loadDate)}</p>
        </div>
        <div>
          <p className="text-muted-foreground mb-1 text-sm">Temperatura</p>
          {readOnly ? (
            <span className="flex items-center justify-center gap-1.5 text-lg font-medium">
              <ThermometerSnowflake className="h-5 w-5" />
              {(order.temperature as number | string | undefined) ?? '0'} ºC
            </span>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex min-h-[44px] min-w-[44px] items-center justify-center focus:outline-none">
                <span className="hover:text-muted-foreground flex items-center justify-center gap-1.5 text-lg font-medium transition-colors">
                  <ThermometerSnowflake className="h-5 w-5" />
                  {(order.temperature as number | string | undefined) ?? '0'} ºC
                  <ChevronDown className="text-muted-foreground h-3.5 w-3.5" aria-hidden />
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {TEMPERATURE_OPTIONS.map((temp) => (
                  <DropdownMenuItem
                    key={temp}
                    className="cursor-pointer"
                    onClick={() => onTemperatureChange(temp)}
                  >
                    {temp} ºC
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-6">
        <div>
          <p className="text-muted-foreground mb-1 text-sm">Palets</p>
          <p className="text-lg font-medium">
            {order.numberOfPallets ? formatInteger(order.numberOfPallets) : '-'}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground mb-1 text-sm">Importe</p>
          <p className="text-lg font-medium">
            {order.totalAmount ? formatDecimalCurrency(order.totalAmount) : '-'}
          </p>
        </div>
      </div>
    </div>
  );
}
