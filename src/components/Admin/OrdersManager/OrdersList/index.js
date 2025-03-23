import { useState } from 'react'
import { InboxIcon } from '@heroicons/react/24/outline';

import OrderCard from './OrderCard';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/20/solid';
import { ScrollShadow } from '@nextui-org/react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';


/* Ordenar Pedidos por fecha de salida */

const sortOrdersByDate = (orders) => {
    return orders.sort((a, b) => {
        return new Date(a.loadDate) - new Date(b.loadDate);
    });
}

/* convertir examples a objeto js */



const OrdersList = ({ orders, categories, onClickCategory, onChangeSearch, searchText, onClickOrderCard , onClickAddNewOrder }) => {

    const [loading, setLoading] = useState(false);


    const activeTab = categories.find((category) => category.current)?.name || 'all';





    return (
        <div className='flex flex-col h-full pt-5   px-7'>
            <div className='w-full flex items-center justify-between pb-3'>
                <h2 className=' text-xl  dark:text-white font-semibold'>Pedidos Activos</h2>
                <Button size="icon" variant='outline' onClick={onClickAddNewOrder}>
                    <Plus className='h-5 w-5' />
                    {/* <span className='text-sm'>Nuevo Pedido</span> */}
                </Button>
            </div>
            {loading ? (
                <>

                </>
            ) : (
                <>
                    {/* Filtro */}
                    <div className='w-full mb-5'>
                        {/*  <OrderFilters categories={categories} /> */}

                        {/* input search  */}
                        <div className='relative w-full text-sm'>
                            <input onChange={(e) => onChangeSearch(e.target.value)} value={searchText}
                                type="text" placeholder='Buscar por id o cliente' className='w-full py-2 px-5 bg-black/15 text-white border border-neutral-600 rounded-lg placeholder:text-neutral-500' />
                            <button className='absolute right-0 top-0 h-full w-10 flex items-center justify-center'>
                                {searchText.length > 0 ? (
                                    <XMarkIcon onClick={() => onChangeSearch('')} className='h-4 w-4 text-white dark:text-white' />
                                )
                                    : (
                                        <MagnifyingGlassIcon className='h-4 w-4 text-white dark:text-white' />
                                    )}
                            </button>
                        </div>

                        {/* <select className="mt-2 py-2 px-3 pe-9 block w-full border rounded-2xl text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-black/15 dark:border-neutral-600 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600">
                            <option>Esta Semana</option>
                            <option>Hoy</option>
                            <option>Mañana</option>
                        </select> */}

                        {/* Tab Shadcn categories */}
                        <Tabs value={activeTab} onValueChange={onClickCategory} className='mt-5'>
                            <TabsList>
                                {categories.map((category) =>
                                    <TabsTrigger key={category.name} value={category.name}>{category.label}</TabsTrigger>
                                )}

                            </TabsList>

                        </Tabs>

                        {/*  <div className='flex gap-3 mt-5 bg-white/20 rounded-lg p-1 text-nowrap'>
                            {categories.map((category, index) => category.current ? (
                                <span key={category.name} className="cursor-not-allowed inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-lg text-xs font-medium  text-black bg-white">
                                    {category.label}
                                </span>
                            ) : (
                                <span
                                    onClick={() => onClickCategory(category)}
                                    key={category.name}
                                    className=" cursor-pointer inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-lg text-xs font-medium  text-neutral-400"
                                >
                                    {category.label}
                                </span>
                            ))}


                        </div> */}
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

                    {orders?.length > 0 ? (
                        <ScrollShadow hideScrollBar className="h-full grow overflow-y-auto xl:pr-2 pb-4 mb-4  xl:flex-col gap-3 scrollbar-hide xl:scrollbar-default xl:flex hidden">

                            {orders.map((order, index) => (
                                <div key={index} className='' >
                                    <OrderCard
                                        onClick={() => onClickOrderCard(order.id)}
                                        order={order} isOrderSelected={() => false} />
                                </div>
                            ))}
                        </ScrollShadow>
                    ) : (
                        <div className='flex flex-col items-center justify-start gap-6 h-full w-full '>
                            <div className='flex flex-col items-center gap-2 w-full'>
                                <div className='w-full opacity-10 relative flex cursor-pointer rounded-xl p-5 border-l-4 border-neutral-400 bg-neutral-700 hover:bg-neutral-600'>
                                    <div className=' flex flex-col gap-1 grow dark:text-white xl:w-48 space-y-2'>
                                        <div className="w-24 h-5 inline-flex items-center bg-neutral-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-neutral-800 dark:text-neutral-300">
                                            <span className="me-1 relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neutral-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-neutral-500"></span>
                                            </span>
                                            {/*  En producción */}
                                        </div>
                                        <div className='text-xl font-medium h-4 bg-neutral-400 w-20 rounded-full'></div>
                                        <div className='text-xl font-medium h-4 bg-neutral-400 w-36 rounded-full'></div>
                                        <div className='text-xl font-medium h-2 bg-neutral-400 w-20 rounded-full'></div>
                                        <div className='text-xl font-medium h-4 bg-neutral-400 w-32 rounded-full'></div>
                                    </div>
                                </div>
                                <div className='w-full opacity-25 relative flex cursor-pointer rounded-xl p-5 border-l-4 border-neutral-400 bg-neutral-700 hover:bg-neutral-600'>
                                    <div className='flex flex-col gap-1 grow dark:text-white xl:w-48 space-y-2'>
                                        <div className="w-24 h-5 inline-flex items-center bg-neutral-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-neutral-800 dark:text-neutral-300">
                                            <span className="me-1 relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neutral-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-neutral-500"></span>
                                            </span>
                                            {/*  En producción */}
                                        </div>
                                        <div className='text-xl font-medium h-4 bg-neutral-400 w-20 rounded-full'></div>
                                        <div className='text-xl font-medium h-4 bg-neutral-400 w-36 rounded-full'></div>
                                        <div className='text-xl font-medium h-2 bg-neutral-400 w-20 rounded-full'></div>
                                        <div className='text-xl font-medium h-4 bg-neutral-400 w-32 rounded-full'></div>
                                    </div>
                                </div>
                                <div className='w-full opacity-10 relative flex cursor-pointer rounded-xl p-5 border-l-4 border-neutral-400 bg-neutral-700 hover:bg-neutral-600'>
                                    <div className='flex flex-col gap-1 grow dark:text-white xl:w-48 space-y-2'>
                                        <div className="w-24 h-5 inline-flex items-center bg-neutral-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-neutral-800 dark:text-neutral-300">
                                            <span className="me-1 relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neutral-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-neutral-500"></span>
                                            </span>
                                            {/*  En producción */}
                                        </div>
                                        <div className='text-xl font-medium h-4 bg-neutral-400 w-20 rounded-full'></div>
                                        <div className='text-xl font-medium h-4 bg-neutral-400 w-36 rounded-full'></div>
                                        <div className='text-xl font-medium h-2 bg-neutral-400 w-20 rounded-full'></div>
                                        <div className='text-xl font-medium h-4 bg-neutral-400 w-32 rounded-full'></div>
                                    </div>
                                </div>
                            </div>
                            {/* <div className='flex items-center flex-col gap-1 py-1 px-5'>
                                <span className='text-neutral-300 dark:text-neutral-400 font-medium text-md'>No existen pedidos</span>
                                <p className='text-neutral-300 dark:text-neutral-500 font-light text-sm'>Intenta introducir otros parámetros</p>
                            </div> */}
                        </div>
                    )}

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
            )
            }

        </div >
    )
}

export default OrdersList