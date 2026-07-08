'use client';

import { formatDate } from '@/helpers/formats/dates/formatDates';
import { useIsMobileSafe } from '@/hooks/use-mobile';
import { ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import StatusBadge from '../../StatusBadge';

const AVATAR_BG_CLASS: Record<'orange' | 'green' | 'red', string> = {
  orange: 'bg-orange-500',
  green: 'bg-green-500',
  red: 'bg-red-500',
};

function customerInitials(name: string | null | undefined) {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return '—';
}

export interface OrderCardOrder {
  id: number | string;
  status?: string | null;
  orderType?: string;
  order_type?: string;
  offerId?: number | string | null;
  loadDate?: string | null;
  customer?: { name?: string | null } | null;
  numberOfBoxes?: number | null;
  externalProcessor?: { id?: number | string; name?: string } | null;
  externalProcessorId?: number | string | null;
  [key: string]: unknown;
}

interface OrderCardProps {
  order: OrderCardOrder;
  onClick: () => void;
  disabled?: boolean;
  isSelected?: boolean;
}

const OrderCard = ({ order, onClick, disabled, isSelected = false }: OrderCardProps) => {
  const { isMobile, mounted } = useIsMobileSafe();
  if (!mounted) return null;

  const orderId = order.id.toString().padStart(5, '0');
  const loadDate = order.loadDate ? formatDate(order.loadDate) : 'N/A';

  const loadDateObj = order.loadDate ? new Date(order.loadDate) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const loadDateOnly = loadDateObj
    ? new Date(loadDateObj.getFullYear(), loadDateObj.getMonth(), loadDateObj.getDate())
    : null;
  const dateLabel = loadDateOnly
    ? loadDateOnly.getTime() === today.getTime()
      ? 'Hoy'
      : loadDateOnly.getTime() === tomorrow.getTime()
        ? 'Mañana'
        : null
    : null;

  const statusLabel =
    order.status === 'pending'
      ? 'En producción'
      : order.status === 'finished'
        ? 'Terminado'
        : 'Incidencia';

  const ringColor =
    order.status === 'pending' ? 'orange' : order.status === 'finished' ? 'green' : 'red';
  const ringColorClass =
    ringColor === 'orange'
      ? 'ring-orange-500'
      : ringColor === 'green'
        ? 'ring-green-500'
        : 'ring-red-500';
  const focusRingClass =
    ringColor === 'orange'
      ? 'focus-visible:ring-orange-500'
      : ringColor === 'green'
        ? 'focus-visible:ring-green-500'
        : 'focus-visible:ring-red-500';

  return (
    <Card
      className={cn(
        disabled && 'pointer-events-none cursor-not-allowed',
        !disabled && [
          'cursor-pointer',
          'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
          focusRingClass,
        ],
        isSelected && 'ring-2',
        isSelected && ringColorClass
      )}
      onClick={() => !disabled && onClick()}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={`Pedido ${orderId} - ${order.customer?.name ?? '—'}`}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <CardContent className="py-0">
        {isMobile ? (
          /* Mobile: avatar coloreado por estado → Cliente + badge de estado (misma fila) → ID · Fecha (secundario) */
          <div className="flex w-full min-w-0 grow items-center gap-3 pr-1">
            <div
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] text-base font-extrabold text-white',
                AVATAR_BG_CLASS[ringColor]
              )}
              aria-hidden="true"
            >
              {customerInitials(order.customer?.name)}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p
                className="truncate text-base leading-tight font-medium"
                title={order.customer?.name ?? '—'}
              >
                {order.customer?.name ?? '—'}
              </p>
              <p className="text-muted-foreground text-sm tabular-nums">
                #{orderId} · {loadDate}
                {order.numberOfBoxes != null ? ` · ${order.numberOfBoxes} cajas` : ''}
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                <StatusBadge color={ringColor} label={statusLabel} showDot />
                {(order?.orderType === 'autoventa' || order?.order_type === 'autoventa') && (
                  <span className="inline-flex items-center rounded-full border border-neutral-400/50 bg-neutral-500/15 px-2 py-0.5 text-[11px] font-medium text-neutral-700 dark:border-neutral-500/50 dark:text-neutral-300">
                    Autoventa
                  </span>
                )}
                {order?.offerId && (
                  <span className="inline-flex items-center rounded-full border border-blue-400/50 bg-blue-500/15 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:border-blue-500/50 dark:text-blue-300">
                    Desde oferta
                  </span>
                )}
                {(order?.externalProcessor || order?.externalProcessorId) && (
                  <span className="inline-flex items-center rounded-full border border-amber-400/50 bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:border-amber-500/50 dark:text-amber-300">
                    {order.externalProcessor?.name ?? 'Maquilador'}
                  </span>
                )}
              </div>
            </div>
            <ChevronRight className="text-muted-foreground h-5 w-5 flex-shrink-0" aria-hidden />
          </div>
        ) : (
          <div className="w-full max-w-xs grow space-y-2 sm:space-y-2 xl:max-w-none">
            <div
              className={cn('flex flex-wrap items-center gap-2', dateLabel && 'justify-between')}
            >
              <StatusBadge
                color={
                  order.status === 'pending'
                    ? 'orange'
                    : order.status === 'finished'
                      ? 'green'
                      : 'red'
                }
                label={statusLabel}
                className=""
              />
              {dateLabel && (
                <span
                  className="text-muted-foreground text-xs font-medium tabular-nums"
                  title={loadDate}
                >
                  {dateLabel}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-muted-foreground text-sm font-medium">#{orderId}</h3>
              {(order?.orderType === 'autoventa' || order?.order_type === 'autoventa') && (
                <span className="inline-flex items-center rounded-full border border-neutral-400/50 bg-neutral-500/15 px-2 py-0.5 text-[11px] font-medium text-neutral-700 dark:border-neutral-500/50 dark:text-neutral-300">
                  Autoventa
                </span>
              )}
              {order?.offerId && (
                <span className="inline-flex items-center rounded-full border border-blue-400/50 bg-blue-500/15 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:border-blue-500/50 dark:text-blue-300">
                  Desde oferta
                </span>
              )}
              {order?.externalProcessor && (
                <span className="inline-flex items-center rounded-full border border-amber-400/50 bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:border-amber-500/50 dark:text-amber-300">
                  {order.externalProcessor.name ?? 'Maquilador'}
                </span>
              )}
            </div>
            <div>
              <p
                className="line-clamp-2 text-base font-medium [overflow-wrap:anywhere]"
                title={order.customer?.name ?? '—'}
              >
                {order.customer?.name ?? '—'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <p className="text-muted-foreground mb-1 text-xs">Fecha de Carga</p>
                <p className="text-sm font-medium">{loadDate}</p>
              </div>
              {order.numberOfBoxes != null && (
                <div>
                  <p className="text-muted-foreground mb-1 text-xs">Cajas</p>
                  <p className="text-sm font-medium">{order.numberOfBoxes}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderCard;
