'use client'

import React, { useEffect, useState, useMemo } from 'react'
import OrdersList from './OrdersList';
import { EmptyState } from '@/components/Utilities/EmptyState/index';
import Order from './Order';
import { getActiveOrders } from '@/services/orderService';
import { Loader2, Package, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Loader from '@/components/Utilities/Loader';
import CreateOrderForm from './CreateOrderForm';


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
    },

]

export default function OrdersManager() {

    const [onCreatingNewOrder, setOnCreatingNewOrder] = useState(false);
    const [isOrderLoading, setIsOrderLoading] = useState(false);

    const [orders, setOrders] = useState([]);
    const [categories, setCategories] = useState(initialCategories);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(true);
    const [reload, setReload] = useState(false);


    const handleOnChange = () => {
        setReload(prev => !prev);
    }

    useEffect(() => {
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

    // Memoizar la categoría activa para evitar búsquedas repetidas
    const activeCategory = useMemo(() => {
        return categories.find((category) => category.current) || categories[0];
    }, [categories]);

    // Optimizar filtrado y ordenamiento con useMemo
    const sortedOrders = useMemo(() => {
        const searchLower = searchText.toLowerCase();
        
        // Filtrar sin mutar los objetos originales
        const filtered = orders
            .filter((order) => {
                const matchesSearch = order.customer.name.toLowerCase().includes(searchLower) ||
                    order.id.toString().includes(searchText);
                const matchesCategory = activeCategory.name === 'all' ||
                    activeCategory.name === order.status;
                return matchesSearch && matchesCategory;
            })
            // Añadir propiedad current sin mutar el objeto original
            .map((order) => ({
                ...order,
                current: selectedOrder === order.id
            }));

        // Ordenar creando una copia del array
        return [...filtered].sort((a, b) => {
            return new Date(a.loadDate) - new Date(b.loadDate);
        });
    }, [orders, searchText, activeCategory, selectedOrder]);

    const handleOnClickOrderCard = (orderId) => {
        setOnCreatingNewOrder(false);
        if (selectedOrder === orderId) return setSelectedOrder(null);
        setSelectedOrder(orderId);
    }

    const handleOnClickCategory = (categoryName) => {
        setSelectedOrder(null);
        setOnCreatingNewOrder(false);

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
        setOnCreatingNewOrder(false);
        setCategories(categories.map((cat) => {
            return {
                ...cat,
                current: cat.name === 'all',
            }
        }));

        setSearchText(value);
        setSelectedOrder(null);
    }

    const handleOnClickAddNewOrder = () => {
        /* Set category current 'all' */
        setCategories(categories.map((cat) => {
            return {
                ...cat,
                current: cat.name === 'all',
            }
        }
        ));
        setSelectedOrder(null);
        setSearchText('');
        setOnCreatingNewOrder(true);
    }

    const handleOnCreatedOrder = (id) => {
        handleOnChange();
        setOnCreatingNewOrder(false);
        setSelectedOrder(id);
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
                                onClickAddNewOrder={handleOnClickAddNewOrder}
                                onClickOrderCard={handleOnClickOrderCard}
                                orders={sortedOrders}
                                categories={categories}
                                onClickCategory={handleOnClickCategory}
                                onChangeSearch={handleOnChangeSearch}
                                searchText={searchText}
                                disabled={isOrderLoading}
                            />
                        </div>
                        <div className='grow  lg:pl-0 p-2'>
                            {selectedOrder ? (
                                <div className='h-full overflow-hidden'>
                                    <Order orderId={selectedOrder} onChange={handleOnChange} onLoading={(value) => setIsOrderLoading(value)} />
                                </div>
                            ) :
                                onCreatingNewOrder ? (
                                    <Card className='h-full   p-7 flex flex-col justify-center items-center'>
                                        <div className='w-full h-full overflow-y-auto'>
                                            <CreateOrderForm onCreate={handleOnCreatedOrder} />
                                        </div>
                                    </Card>
                                ) : (
                                    <Card className='h-full   p-7 flex flex-col justify-center items-center'>
                                        <EmptyState
                                            icon={<Package className="h-12 w-12 text-primary" strokeWidth={1.5} />}
                                            title='Seleccione un pedido'
                                            description='Selecciona un pedido para ver los detalles y realizar cambios.'
                                            button={{
                                                name: 'Crear pedido nuevo',
                                                onClick: handleOnClickAddNewOrder,
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
