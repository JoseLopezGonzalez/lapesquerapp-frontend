import { formatDate } from '@/helpers/formats/dates/formatDates';
import { useIsMobile } from '@/hooks/use-mobile';
import { ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
                : loadDate
        : 'N/A';

    // Borde izquierdo por estado (sin cambiar fondo base)
    const borderLClass =
        order.status === 'incident'
            ? 'border-l-red-500'
            : order.status === 'finished'
                ? 'border-l-green-500'
                : 'border-l-orange-500';

    // Resaltar pedido seleccionado (fondo más marcado)
    const selectedClass = isSelected
        ? order.status === 'incident'
            ? 'bg-red-500/10 border-red-500/50'
            : order.status === 'finished'
                ? 'bg-green-500/10 border-green-500/50'
                : 'bg-orange-500/10 border-orange-500/50'
        : '';

    const StatusBadge = ({ color = 'green', label = 'Terminado' }) => {
        const colorVariants = {
            green: {
                bg: 'bg-green-200 dark:bg-green-900',
                text: 'text-green-800 dark:text-green-300',
                border: 'border dark:border-2 border-green-500',
                dot: 'bg-green-500'
            },
            orange: {
                bg: 'bg-orange-200 dark:bg-orange-900',
                text: 'text-orange-800 dark:text-orange-300',
                border: 'border dark:border-2 border-orange-500',
                dot: 'bg-orange-500'
            },
            red: {
                bg: 'bg-red-100 dark:bg-red-900',
                text: 'text-red-800 dark:text-red-300',
                border: 'border dark:border-2 border-red-500',
                dot: 'bg-red-500'
            },
            // Puedes añadir más colores aquí
        };

        const { bg, text, border, dot } = colorVariants[color] || colorVariants.green; // Fallback a verde

        return (
            <span
                className={`inline-flex items-center ${bg} ${text} text-xs font-medium px-2.5 py-0.5 rounded-full ${border}`}
            >
                <span className={`w-2 h-2 me-1 ${dot} rounded-full`} />
                {label}
            </span>
        );
    };

    const statusLabel = order.status === 'pending' ? 'En producción' : order.status === 'finished' ? 'Terminado' : 'Incidente';

    return (
        <Card
            className={cn(
                'relative flex border-l-4 min-h-[120px] transition-colors duration-150',
                'p-4 sm:p-5',
                borderLClass,
                selectedClass,
                disabled && 'cursor-not-allowed pointer-events-none',
                !disabled && [
                    'cursor-pointer',
                    isMobile && 'hover:bg-accent/50 hover:border-accent active:bg-accent/70 active:scale-[0.99]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                ]
            )}
            onClick={() => !disabled && onClick()}
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-label={`Pedido ${orderId} - ${order.customer.name}`}
            onKeyDown={(e) => {
                if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onClick();
                }
            }}
        >
            {isMobile ? (
                /* Mobile: Cliente protagonista → ID · Fecha (secundario) → estado badge discreto */
                <div className="grow w-full min-w-0 flex items-center gap-3 pr-1">
                    <div className="flex-1 min-w-0 space-y-1">
                        <p className="font-semibold text-lg truncate leading-tight" title={order.customer.name}>
                            {order.customer.name}
                        </p>
                        <p className="text-sm text-muted-foreground tabular-nums">
                            #{orderId} · {loadDate}
                            {order.numberOfBoxes != null ? ` · ${order.numberOfBoxes} cajas` : ''}
                        </p>
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
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" aria-hidden />
                </div>
            ) : (
                <div className="grow w-full max-w-xs xl:max-w-none space-y-2 sm:space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        <StatusBadge
                            color={order.status === 'pending' ? 'orange' : order.status === 'finished' ? 'green' : 'red'}
                            label={statusLabel}
                        />
                        <span className="text-xs font-medium text-muted-foreground tabular-nums" title={loadDate}>
                            {dateLabel}
                        </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold">#{orderId}</h3>
                    <div>
                        <p className="font-semibold truncate text-base sm:text-lg font-medium" title={order.customer.name}>
                            {order.customer.name}
                        </p>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                        <div>
                            <p className={`${isSelected ? 'text-foreground/80' : 'text-muted-foreground'} mb-1 text-xs`}>Fecha de Carga</p>
                            <p className="font-semibold text-base sm:text-lg font-medium">{loadDate}</p>
                        </div>
                        {order.numberOfBoxes != null && (
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Cajas</p>
                                <p className="font-semibold text-base">{order.numberOfBoxes}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Card>
    )
}

export default OrderCard
