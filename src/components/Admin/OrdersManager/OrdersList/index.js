import { useState } from 'react'
import { InboxIcon } from '@heroicons/react/24/outline';

/* import example.json */
import example from './examples.json';
import OrderCard from './OrderCard';
import { IoSearchCircle } from 'react-icons/io5';
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid';


/* Ordenar Pedidos por fecha de salida */

const sortOrdersByDate = (orders) => {
    return orders.sort((a, b) => {
        return new Date(a.loadDate) - new Date(b.loadDate);
    });
}

/* convertir examples a objeto js */
const examplesOrders = example.data;

console.log(examplesOrders)


const OrdersList = () => {

    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([
        {
            name: 'Todos',
            current: true,
        },
        {
            name: 'En producción',
            current: false,
        },
        {
            name: 'Terminados',
            current: false,
        }
    ]);

    const handleOnClickCategory = (category) => {
        setCategories(categories.map((cat) => {
            if (cat.name === category.name) {
                return {
                    ...cat,
                    current: true,
                }
            } else {
                return {
                    ...cat,
                    current: false,
                }
            }
        }))
    }





    return (
        <div className='flex flex-col h-full pt-5   px-7'>
            <h2 className='pb-7 text-xl  dark:text-white font-semibold'>Pedidos Activos</h2>
            {loading ? (
                <>

                </>
            ) : !examplesOrders?.length ? (
                <>
                    {/* Empty state */}
                    <div className='pl-7 w-full h-full pb-7'>
                        <div className=' h-full w-full rounded-lg border-2 flex flex-col items-center justify-center gap-2 border-dashed px-20'>
                            <InboxIcon className='h-10 w-10 text-white' />
                            <h2 className='text-white text-lg font-light'>No hay pedidos activos</h2>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    {/* Filtro */}
                    <div className='w-full mb-5'>
                        {/*  <OrderFilters categories={categories} /> */}

                        {/* input search  */}
                        <div className='relative w-full'>
                            <input type="text" placeholder='Buscar' className='w-full h-10 px-5  bg-black/15 text-white border border-neutral-600 rounded-2xl' />
                            <button className='absolute right-0 top-0 h-full w-10 flex items-center justify-center'>
                                <MagnifyingGlassIcon className='h-4 w-4 text-white dark:text-white' />
                            </button>
                        </div>

                        <div className='flex gap-3 mt-5 bg-neutral-600 rounded-full p-1'>
                            {/* Boton de caegorias */}
                            {categories.map((category, index) => category.current ? (
                                <span key={category.name} class="cursor-not-allowed inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-xs font-medium  text-black bg-white">
                                    {category.name}
                                </span>
                            ) : (
                                <span 
                                onClick={() => handleOnClickCategory(category)}
                                key={category.name} 
                                class=" cursor-pointer inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-xs font-medium  text-white bg-neutral-600"
                                >
                                    {category.name}
                                </span>
                            ))}


                        </div>
                    </div>
                    {/* Lista PC */}
                    {/* <ScrollShadow className='grow overflow-y-auto xl:pr-2 pb-4 mb-5  xl:flex-col gap-3 scrollbar-hide xl:scrollbar-default xl:flex hidden'>
                        {categories.filter((category) =>
                            category.current).map((category) =>
                                sortOrdersByDate(category.orders).map((order, index) => (
                                    <div key={index} className='' onClick={() => onClick(order)}  >
                                        <OrderItem order={order} isOrderSelected={isOrderSelected} />
                                    </div>
                                ))
                            )
                        }
                    </ScrollShadow> */}

                    {/* Lista de orders */}
                    <div className='flex flex-col gap-3 '>
                        {examplesOrders.map((order, index) => (
                            <div key={index} className='' >
                                <OrderCard order={order} isOrderSelected={() => false} />
                            </div>
                        ))}
                    </div>

                    {/* Lista Movil */}
                    {/*  <ScrollShadow orientation='horizontal' className='grow overflow-y-auto  pb-4 mb-5 flex  gap-3 scrollbar-hide xl:hidden'>
                        {categories.filter((category) =>
                            category.current).map((category) =>
                                sortOrdersByDate(category.orders).map((order, index) => (
                                    <div key={index} className='' onClick={() => onClick(order)}  >
                                        <OrderItem order={order} isOrderSelected={isOrderSelected} />
                                    </div>
                                ))
                            )
                        }
                    </ScrollShadow> */}
                </>
            )}

        </div>
    )
}

export default OrdersList