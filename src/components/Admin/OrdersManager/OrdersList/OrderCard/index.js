import { formatDate } from '@/helpers/formats/dates/formatDates';
import { useIsMobile } from '@/hooks/use-mobile';
import { ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import StatusBadge from '../../StatusBadge';

const OrderCard = ({ order, onClick, disabled, isSelected = false }) => {
    const isMobile = useIsMobile();

    const orderId = order.id.toString().padStart(5, '0');
    const loadDate = order.loadDate ? formatDate(order.loadDate) : 'N/A';

    const loadDateObj = order.loadDate ? new Date(order.loadDate) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const loadDateOnly = loadDateObj ? new Date(loadDateObj.getFullYear(), loadDateObj.getMonth(), loadDateObj.getDate()) : null;
    const dateLabel = loadDateOnly
        ? loadDateOnly.getTime() === today.getTime()
            ? 'Hoy'
            : loadDateOnly.getTime() === tomorrow.getTime()
                ? 'Mañana'
                : null
        : null;

    const statusLabel = order.status === 'pending' ? 'En producción' : order.status === 'finished' ? 'Terminado' : 'Incidencia';

    const ringColor = order.status === 'pending' ? 'orange' : order.status === 'finished' ? 'green' : 'red';
    const ringColorClass = ringColor === 'orange' ? 'ring-orange-500' : ringColor === 'green' ? 'ring-green-500' : 'ring-red-500';
    const focusRingClass = ringColor === 'orange' ? 'focus-visible:ring-orange-500' : ringColor === 'green' ? 'focus-visible:ring-green-500' : 'focus-visible:ring-red-500';

    return (
        <Card
            className={cn(
                disabled && 'cursor-not-allowed pointer-events-none',
                !disabled && [
                    'cursor-pointer',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
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
                /* Mobile: Cliente protagonista → ID · Fecha (secundario) → estado badge discreto */
                <div className="grow w-full min-w-0 flex items-center gap-3 pr-1">
                    <div className="flex-1 min-w-0 space-y-1">
                        <p className="font-medium text-base truncate leading-tight" title={order.customer?.name ?? '—'}>
                            {order.customer?.name ?? '—'}
                        </p>
                        <p className="text-sm text-muted-foreground tabular-nums">
                            #{orderId} · {loadDate}
                            {order.numberOfBoxes != null ? ` · ${order.numberOfBoxes} cajas` : ''}
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                                className={cn(
                                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                                    order.status === 'pending' && 'bg-orange-500/15 text-orange-700 dark:text-orange-300',
                                    order.status === 'finished' && 'bg-green-500/15 text-green-700 dark:text-green-300',
                                    order.status === 'incident' && 'bg-red-500/15 text-red-700 dark:text-red-300'
                                )}
                            >
                                <span
                                    className={cn(
                                        'h-1.5 w-1.5 rounded-full',
                                        order.status === 'pending' && 'bg-orange-500',
                                        order.status === 'finished' && 'bg-green-500',
                                        order.status === 'incident' && 'bg-red-500'
                                    )}
                                />
                                {statusLabel}
                            </span>
                            {order?.orderType === 'autoventa' && (
                                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-neutral-500/15 text-neutral-700 dark:text-neutral-300 border border-neutral-400/50 dark:border-neutral-500/50">
                                    Autoventa
                                </span>
                            )}
                            {order?.offerId && (
                                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-400/50 dark:border-blue-500/50">
                                    Desde oferta
                                </span>
                            )}
                        </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" aria-hidden />
                </div>
            ) : (
                <div className="grow w-full max-w-xs xl:max-w-none space-y-2 sm:space-y-2">
                    <div className={cn('flex items-center gap-2 flex-wrap', dateLabel && 'justify-between')}>
                        <StatusBadge
                            color={order.status === 'pending' ? 'orange' : order.status === 'finished' ? 'green' : 'red'}
                            label={statusLabel}
                        />
                        {dateLabel && (
                            <span className="text-xs font-medium text-muted-foreground tabular-nums" title={loadDate}>
                                {dateLabel}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-medium">#{orderId}</h3>
                        {order?.orderType === 'autoventa' && (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-neutral-500/15 text-neutral-700 dark:text-neutral-300 border border-neutral-400/50 dark:border-neutral-500/50">
                                Autoventa
                            </span>
                        )}
                        {order?.offerId && (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-400/50 dark:border-blue-500/50">
                                Desde oferta
                            </span>
                        )}
                    </div>
                    <div>
                        <p className="font-medium text-base truncate" title={order.customer?.name ?? '—'}>
                            {order.customer?.name ?? '—'}
                        </p>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                        <div>
                            <p className="text-muted-foreground mb-1 text-xs">Fecha de Carga</p>
                            <p className="text-sm font-medium">{loadDate}</p>
                        </div>
                        {order.numberOfBoxes != null && (
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Cajas</p>
                                <p className="text-sm font-medium">{order.numberOfBoxes}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
            </CardContent>
        </Card>
    )
}

export default OrderCard
