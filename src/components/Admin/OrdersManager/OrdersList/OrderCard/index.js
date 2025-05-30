
const OrderCard = ({ order, onClick, disabled }) => {

    const orderId = order.id.toString().padStart(5, '0');
    const loadDate = order.loadDate.split('-').reverse().join('/'); //convertir fecha a dd/mm/yyyy

    const today = new Date();
    const loadDateObj = new Date(order.loadDate);
    const isToday = today.toDateString() === loadDateObj.toDateString();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = tomorrow.toDateString() === loadDateObj.toDateString();

    const baseClass = "relative flex  rounded-xl p-5 border-l-4"

    let statusClass = ''

    if (order.current && order.status === 'finished') {
        statusClass = 'border-green-500 bg-green-400/70 hover:bg-green-400/80'
    } else if (order.current && order.status === 'pending') {
        statusClass = 'border-orange-500 bg-orange-400/90 hover:bg-orange-400'
    } else if (order.current && order.status === 'incident') {
        statusClass = 'border-red-900 bg-red-500 hover:bg-red-500/80'
    } else if (order.status === 'incident') {
        statusClass = 'border-red-500 bg-foreground-50 hover:foreground-100'
    } else if (order.status === 'finished') {
        statusClass = 'border-green-500 bg-foreground-50 hover:foreground-100'
    } else {
        statusClass = 'border-orange-500 bg-foreground-50 hover:bg-foreground-100'
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
            className={`${baseClass} ${statusClass} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}  `}
            onClick={() => !disabled && onClick()}
        >
            {isToday && (
                <span className="absolute top-5 right-4 text-xs animate-pulse bg-foreground-200 px-2 py-0.5 rounded-full  text-muted-foreground">
                    {isToday && 'Hoy'}
                </span>)}

            {isTomorrow && (
                <span className="absolute top-5 right-4 text-xs animate-pulse bg-foreground-200 px-2 py-0.5 rounded-full  text-muted-foreground">
                    {isTomorrow && 'Mañana'}
                </span>)}

            < div className='grow  xl:w-48 space-y-1'>
                <StatusBadge
                    color={order.status === 'pending' ? 'orange' : order.status === 'finished' ? 'green' : 'red'}
                    label={order.status === 'pending' ? 'En producción' : order.status === 'finished' ? 'Terminado' : 'Incidente'}
                />
                <h3 className='text-xl font-medium'>#{orderId}</h3>
                <div>
                    <p className='font-medium text-lg whitespace-nowrap xl:whitespace-normal'>{order.customer.name}</p>
                </div>
                <div className=''>
                    <p className='text-xs font-light '>Fecha de Carga:</p>
                    <p className='font-medium text-lg '>
                        {loadDate}
                    </p>
                </div>

            </div >
        </div>
    )
}

export default OrderCard