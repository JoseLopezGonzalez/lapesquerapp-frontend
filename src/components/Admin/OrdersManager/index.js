'use client'

import React, { useEffect, useState } from 'react'
import OrdersList from './OrdersList';
import examples from './examples.json';
import { EmptyState } from '@/components/Utilities/EmptyState/index';
import Order from './Order';
import { getActiveOrders } from '@/services/orderService';
import { Loader2, Package, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Loader from '@/components/Utilities/Loader';


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
                    <Loader />
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
                        <div className='grow  lg:pl-0 p-2'>
                            {selectedOrder ? (
                                <div className='h-full overflow-hidden'>
                                    <Order orderId={selectedOrder} onChange={handleOnChange} />
                                </div>
                            ) : (
                                <Card className='h-full   p-7 flex flex-col justify-center items-center'>

                                    <EmptyState
                                        icon={<Package className="h-12 w-12 text-primary" strokeWidth={1.5} />}
                                        title='Seleccione un pedido'
                                        description='Selecciona un pedido para ver los detalles y realizar cambios.'
                                        button={{
                                            name: 'Crear pedido nuevo',
                                            onClick: () => console.log('Nuevo pedido'),
                                        }}
                                    />
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
