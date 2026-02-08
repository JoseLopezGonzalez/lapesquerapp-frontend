import { formatDate } from '@/helpers/formats/dates/formatDates';
import { useIsMobile } from '@/hooks/use-mobile';

const OrderCard = ({ order, onClick, disabled, isSelected = false }) => {
    const isMobile = useIsMobile();

    const orderId = order.id.toString().padStart(5, '0');
    const loadDate = order.loadDate ? formatDate(order.loadDate) : 'N/A';

    const today = new Date();
    const loadDateObj = order.loadDate ? new Date(order.loadDate) : null;
    const isToday = loadDateObj && today.toDateString() === loadDateObj.toDateString();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = loadDateObj && tomorrow.toDateString() === loadDateObj.toDateString();

    // Mobile: padding más generoso, altura mínima para touch target
    const baseClass = isMobile 
        ? "relative flex rounded-2xl p-4 border-l-4 min-h-[120px] active:scale-[0.98] transition-transform"
        : "relative flex rounded-xl p-4 sm:p-5 border-l-4"

    let statusClass = ''

    // Resaltar pedido seleccionado
    if (isSelected && order.status === 'finished') {
        statusClass = 'border-green-500 bg-green-400/70 hover:bg-green-400/80'
    } else if (isSelected && order.status === 'pending') {
        statusClass = 'border-orange-500 bg-orange-400/90 hover:bg-orange-400'
    } else if (isSelected && order.status === 'incident') {
        statusClass = 'border-red-900 bg-red-500 hover:bg-red-500/80'
    } else if (order.status === 'incident') {
        statusClass = 'border-red-500 bg-foreground-50 hover:foreground-100'
    } else if (order.status === 'finished') {
        statusClass = 'border-green-500 bg-foreground-50 hover:foreground-100'
    } else {
        statusClass = 'border-orange-500 bg-foreground-50 hover:foreground-100'
    }

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

    return (
        <div
            className={`${baseClass} ${statusClass} ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} shadow-sm hover:shadow-md transition-shadow`}
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
            {isToday && (
                <span className="absolute top-3 right-3 text-xs font-medium animate-pulse bg-primary/20 text-primary px-2.5 py-1 rounded-full z-10 border border-primary/30">
                    Hoy
                </span>)}

            {isTomorrow && (
                <span className="absolute top-3 right-3 text-xs font-medium animate-pulse bg-primary/20 text-primary px-2.5 py-1 rounded-full z-10 border border-primary/30">
                    Mañana
                </span>)}

            <div className='grow w-full max-w-xs xl:max-w-none space-y-2 sm:space-y-2'>
                <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge
                        color={order.status === 'pending' ? 'orange' : order.status === 'finished' ? 'green' : 'red'}
                        label={order.status === 'pending' ? 'En producción' : order.status === 'finished' ? 'Terminado' : 'Incidente'}
                    />
                </div>
                <h3 className={`font-semibold ${isMobile ? 'text-xl' : 'text-lg sm:text-xl'}`}>#{orderId}</h3>
                <div>
                    <p className={`font-medium truncate ${isMobile ? 'text-base' : 'text-base sm:text-lg'}`} title={order.customer.name}>
                        {order.customer.name}
                    </p>
                </div>
                <div className='flex items-center gap-4 flex-wrap'>
                    <div>
                        <p className='text-xs text-muted-foreground mb-0.5'>Fecha de Carga</p>
                        <p className={`font-medium ${isMobile ? 'text-sm' : 'text-base sm:text-lg'}`}>
                            {loadDate}
                        </p>
                    </div>
                    {/* Información adicional en mobile si está disponible */}
                    {isMobile && order.numberOfBoxes && (
                        <div>
                            <p className='text-xs text-muted-foreground mb-0.5'>Cajas</p>
                            <p className='font-medium text-sm'>{order.numberOfBoxes}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default OrderCard
