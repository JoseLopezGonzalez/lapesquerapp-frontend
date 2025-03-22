'use client'

import React, { useEffect, useState } from 'react'
import OrdersList from './OrdersList';
import examples from './examples.json';
import { EmptyState } from '@/components/Utilities/EmptyState';
import Order from './Order';
import { getActiveOrders } from '@/services/orderService';


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

    useEffect(() => {
        const timeout = setTimeout(() => {
            setLoading(false)
        }, 6000)

        return () => clearTimeout(timeout)
    }, [])


    const [orders, setOrders] = useState([]);
    const [categories, setCategories] = useState(initialCategories);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(true);
    const [reload, setReload] = useState(false);


    const handleOnChange = () => {
        setTimeout(() => setReload(prev => !prev), 0);
    }

    useEffect(() => {
        console.log('OrdersManager - useEffect');
        getActiveOrders()
            .then((data) => {
                setOrders(data);
                setLoading(false);
            })
            .catch((error) => {
                console.error('Error al obtener los pedidos activos', error);
                setLoading(false);
            });
    }, [reload]);

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

    const handleOnClickCategory = (categoryName) => {
        setSelectedOrder(null);
        setCategories(categories.map((cat) => {
            if (cat.name === categoryName) {
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
                <div className="w-full h-full flex items-center justify-center">

                <div className="loader ">
                    <div className="box">
                        <div className="logo">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 94 94"
                                className="svg"
                            >
                                <path
                                    d="M38.0481 4.82927C38.0481 2.16214 40.018 0 42.4481 0H51.2391C53.6692 0 55.6391 2.16214 55.6391 4.82927V40.1401C55.6391 48.8912 53.2343 55.6657 48.4248 60.4636C43.6153 65.2277 36.7304 67.6098 27.7701 67.6098C18.8099 67.6098 11.925 65.2953 7.11548 60.6663C2.37183 56.0036 3.8147e-06 49.2967 3.8147e-06 40.5456V4.82927C3.8147e-06 2.16213 1.96995 0 4.4 0H13.2405C15.6705 0 17.6405 2.16214 17.6405 4.82927V39.1265C17.6405 43.7892 18.4805 47.2018 20.1605 49.3642C21.8735 51.5267 24.4759 52.6079 27.9678 52.6079C31.4596 52.6079 34.0127 51.5436 35.6268 49.4149C37.241 47.2863 38.0481 43.8399 38.0481 39.0758V4.82927Z"
                                ></path>
                                <path
                                    d="M86.9 61.8682C86.9 64.5353 84.9301 66.6975 82.5 66.6975H73.6595C71.2295 66.6975 69.2595 64.5353 69.2595 61.8682V4.82927C69.2595 2.16214 71.2295 0 73.6595 0H82.5C84.9301 0 86.9 2.16214 86.9 4.82927V61.8682Z"
                                ></path>
                                <path
                                    d="M2.86102e-06 83.2195C2.86102e-06 80.5524 1.96995 78.3902 4.4 78.3902H83.6C86.0301 78.3902 88 80.5524 88 83.2195V89.1707C88 91.8379 86.0301 94 83.6 94H4.4C1.96995 94 0 91.8379 0 89.1707L2.86102e-06 83.2195Z"
                                ></path>
                            </svg>
                        </div>
                    </div>
                    <div className="box"></div>
                    <div className="box"></div>
                    <div className="box"></div>
                    <div className="box"></div>
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
                        <div className='grow  lg:pl-0'>
                            {selectedOrder ? (
                                <div className='h-full p-2 overflow-hidden'>
                                    <Order orderId={selectedOrder} onChange={handleOnChange} />
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
