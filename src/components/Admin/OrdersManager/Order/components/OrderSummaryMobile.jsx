'use client';

import { ThermometerSnowflake, ShoppingBag } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDate } from '@/helpers/formats/dates/formatDates';
import { formatInteger, formatDecimalCurrency } from '@/helpers/formats/numbers/formatNumbers';
import StatusBadge from '../../StatusBadge';

const STATUS_COLORS = { pending: 'orange', finished: 'green', incident: 'red' };
const STATUS_LABELS = {
  pending: 'En producción',
  finished: 'Terminado',
  incident: 'Incidencia',
};

const TEMPERATURE_OPTIONS = [0, 4, -18, -23];

/**
 * Cabecera centrada móvil: cliente, transporte, estado, fecha, temperatura, palets, importe
 */
export default function OrderSummaryMobile({
  order,
  transportImage,
  onStatusChange,
  onTemperatureChange,
}) {
  return (
    <div className="space-y-5 px-4 pt-6 text-center flex-shrink-0">
      <div className="flex flex-col items-center gap-2">
        {(order?.orderType ?? order?.order_type) === 'autoventa' && (
          <span
            className="inline-flex items-center gap-1.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium px-2.5 py-1 rounded-full border border-slate-400 dark:border-slate-500"
            aria-label="Tipo de pedido: Autoventa"
          >
            <ShoppingBag className="h-3.5 w-3.5" aria-hidden />
            Autoventa
          </span>
        )}
        <div>
          <p className="text-xl font-semibold">{order.customer?.name ?? '—'}</p>
          <p className="text-base text-muted-foreground mt-1">
            Cliente Nº {order.customer?.id ?? '—'}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center gap-2">
        <img
          className="max-w-[170px]"
          src={transportImage}
          alt={`Transporte ${order.transport?.name || ''}`}
        />
        <p className="text-lg font-medium">{order.transport?.name || '-'}</p>
      </div>

      <div className="flex justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none">
            <StatusBadge
              color={STATUS_COLORS[order.status]}
              label={STATUS_LABELS[order.status]}
            />
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
      </div>

      <div className="flex items-center justify-center gap-6 flex-wrap">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Fecha de Carga</p>
          <p className="text-lg font-semibold">{formatDate(order.loadDate)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-1">Temperatura</p>
          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none">
              <span className="text-lg font-semibold flex gap-1.5 items-center justify-center hover:text-muted-foreground transition-colors">
                <ThermometerSnowflake className="h-5 w-5" />
                {order.temperature ?? '0'} ºC
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
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 flex-wrap">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Palets</p>
          <p className="text-lg font-semibold">
            {order.numberOfPallets ? formatInteger(order.numberOfPallets) : '-'}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-1">Importe</p>
          <p className="text-lg font-semibold">
            {order.totalAmount ? formatDecimalCurrency(order.totalAmount) : '-'}
          </p>
        </div>
      </div>
    </div>
  );
}
