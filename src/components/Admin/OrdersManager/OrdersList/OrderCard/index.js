
const OrderCard = ({ order, onClick }) => {

    const orderId = order.id.toString().padStart(5, '0');
    const loadDate = order.loadDate.split('-').reverse().join('/'); //convertir fecha a dd/mm/yyyy

    const today = new Date();
    const loadDateObj = new Date(order.loadDate);
    const isToday = today.toDateString() === loadDateObj.toDateString();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = tomorrow.toDateString() === loadDateObj.toDateString();

    const baseClass = "relative flex cursor-pointer rounded-xl p-5 border-l-4"

    let statusClass = ''

    if (order.current && order.status === 'finished') {
        statusClass = 'border-green-500 bg-green-400/70 hover:bg-green-400/80'
    } else if (order.current && order.status === 'pending') {
        statusClass = 'border-orange-500 bg-orange-400/90 hover:bg-orange-400'
    } else if (order.current && order.status === 'incident') {
        statusClass = 'border-red-500 bg-red-400/80 hover:bg-red-400'
    } else if (order.status === 'incident') {
        statusClass = 'border-red-500 bg-neutral-700 hover:bg-neutral-600'
    } else if (order.status === 'finished') {
        statusClass = 'border-green-500 bg-neutral-700 hover:bg-neutral-600'
    } else {
        statusClass = 'border-orange-500 bg-neutral-700 hover:bg-neutral-600'
    }
    
    return (
        <div
            className={`${baseClass} ${statusClass}`}
            onClick={onClick}
        >
            {isToday && (
                <span className="absolute top-5 right-4 text-xs animate-pulse bg-black/20 px-2 py-0.5 rounded-full dark:bg-white/50 text-white">
                    {isToday && 'Hoy'}
                </span>)}

            {isTomorrow && (
                <span className="absolute top-5 right-4 text-xs animate-pulse bg-black/20 px-2 py-0.5 rounded-full dark:bg-white/20 text-white">
                    {isTomorrow && 'Mañana'}
                </span>)}

            < div className='grow dark:text-white xl:w-48 space-y-1'>

                {order.status === 'pending' && (
                    <span className="inline-flex items-center bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-orange-900 dark:text-orange-300 border-2 dark:border-orange-500">
                        <span className="me-1 relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                        </span>
                        En producción
                    </span>
                )}

                {order.status === 'finished' && (
                    <span className="inline-flex items-center bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-green-900 dark:text-green-300 border-2 dark:border-green-500">
                        <span className="w-2 h-2 me-1 bg-green-500 rounded-full"></span>
                        Terminado
                    </span>
                )}

                <h3 className='text-xl font-medium'>#{orderId}</h3>
                <div>
                    {/* <p className=' text-xs font-light text-white'>Cliente:</p> */}
                    <p className='font-medium text-lg whitespace-nowrap xl:whitespace-normal'>{order.customer.name}</p>
                </div>
                <div className=''>
                    <p className='text-xs font-light text-white'>Fecha de Carga:</p>
                    <p className='font-medium text-lg '>
                        {loadDate}
                    </p>
                </div>

                {/* <div className=''>
                    <p className='font-medium text-xs text-neutral-300'>Transporte:</p>
                    <p className='font-medium text-sm'>{order.transport.name}</p>
                </div> */}



            </div >
        </div>
    )
}

export default OrderCard