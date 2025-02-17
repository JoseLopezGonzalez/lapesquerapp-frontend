'use client'

import React, { useEffect, useState } from 'react'
import OrdersList from './OrdersList';
import examples from './examples.json';
import { EmptyState } from '@/components/Utilities/EmptyState';
import Order from './Order';

const examplesOrders = examples.data;

const initialCategories = [
    {
        label: 'Todos',
        name: 'all',
        current: true,
    },
    {
        label: 'En producción',
        name: 'pending',
        current: false,
    },
    {
        label: 'Terminados',
        name: 'finished',
        current: false,
    }
]

export default function OrdersManager() {

    const [orders, setOrders] = useState([]);
    const [categories, setCategories] = useState(initialCategories);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        /* Simular carga de datos */
        setTimeout(() => {
            setOrders(examplesOrders);
            setLoading(false);
        }, 2000);
    }, [])

    const filterOrders = orders.filter((order) => {
        /* Añadir a order current, true o flase si coincide con selectedOrder */
        order.current = selectedOrder === order.id;

        /* categoria activa */
        const activeCategory = categories.find((category) => category.current);

        return (order.customer.name.toLowerCase().includes(searchText.toLowerCase()) ||
            order.id.toString().includes(searchText)) && (
                activeCategory.name === 'all' ||
                activeCategory.name === order.status
            )
    })

    const sortOrdersByDate = filterOrders.sort((a, b) => {
        return new Date(a.loadDate) - new Date(b.loadDate);
    });

    const handleOnClickOrderCard = (orderId) => {
        if (selectedOrder === orderId) return setSelectedOrder(null);
        setSelectedOrder(orderId);
    }

    const handleOnClickCategory = (category) => {
        setSelectedOrder(null);
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

    const handleOnChangeSearch = (value) => {
        /* Set current true category.name all  */
        setCategories(categories.map((cat) => {
            return {
                ...cat,
                current: cat.name === 'all',
            }
        }));

        setSearchText(value);
        setSelectedOrder(null);
    }



    return (
        <>
            {loading ? (
                /* Loader */
                <div className="py-3">
                    <div role="status" className="flex justify-center pt-96">
                        <svg aria-hidden="true" className="inline w-12 h-12 mr-2 text-neutral-200 animate-spin dark:text-neutral-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                        </svg>
                        <br />
                        <span className="text-white dark:text-neutral-400 pt-2 ml-2 sr-only">Cargando...</span>
                    </div>
                </div>
            ) : (
                /* Contenido */
                <div className="h-full">
                    <div className="flex flex-col xl:flex-row h-full">
                        <div className='xl:h-full'>
                            <OrdersList
                                onClickOrderCard={handleOnClickOrderCard}
                                orders={sortOrdersByDate}
                                categories={categories}
                                onClickCategory={handleOnClickCategory}
                                onChangeSearch={handleOnChangeSearch}
                                searchText={searchText}
                            />
                        </div>
                        <div className='grow p-5 pt-0 lg:pl-0'>
                            {selectedOrder ? (
                                <div className='h-full text-white p-9 bg-neutral-700 rounded-2xl'>
                                     <Order/>
                                </div>
                            ) : (
                                <div className='h-full  rounded-3xl p-7 flex flex-col justify-center items-center bg-black/20'>
                                    <EmptyState title='Seleccione un pedido' description='Seleccione un pedido para ver los detalles' />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
