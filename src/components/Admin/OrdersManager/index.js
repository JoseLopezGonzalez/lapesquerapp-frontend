'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useSession } from 'next-auth/react';
import OrdersList from './OrdersList';
import { EmptyState } from '@/components/Utilities/EmptyState/index';
import Order from './Order';
import { getActiveOrders } from '@/services/orderService';
import { Loader2, Package, PlusCircle, Menu, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Loader from '@/components/Utilities/Loader';
import CreateOrderForm from './CreateOrderForm';
import toast from 'react-hot-toast';
import { getToastTheme } from '@/customs/reactHotToast';
import { useDebounce } from '@/hooks/useDebounce';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';


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
    const { data: session } = useSession();
    const token = session?.user?.accessToken;
    const isMobile = useIsMobile();

    const [onCreatingNewOrder, setOnCreatingNewOrder] = useState(false);
    const [isOrderLoading, setIsOrderLoading] = useState(false);

    const [orders, setOrders] = useState([]);
    const [categories, setCategories] = useState(initialCategories);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reloadCounter, setReloadCounter] = useState(0);
    
    // Estados para navegación móvil
    const [mobileListOpen, setMobileListOpen] = useState(false);
    const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

    // Debouncing de búsqueda para mejorar rendimiento
    const debouncedSearchText = useDebounce(searchText, 300);

    // Función para actualizar un pedido en el listado sin recargar desde el endpoint
    const updateOrderInList = useCallback((updatedOrder) => {
        setOrders(prevOrders => {
            return prevOrders.map(order => 
                order.id === updatedOrder.id ? updatedOrder : order
            );
        });
    }, []);

    // Función explícita para recargar pedidos
    const reloadOrders = useCallback(() => {
        setReloadCounter(prev => prev + 1);
    }, []);

    const handleOnChange = useCallback((updatedOrder = null) => {
        // Si se pasa un pedido actualizado, actualizar el listado localmente
        if (updatedOrder) {
            updateOrderInList(updatedOrder);
        } else {
            // Si no se pasa nada, recargar desde el endpoint
            reloadOrders();
        }
    }, [updateOrderInList, reloadOrders]);

    // Cargar pedidos activos
    useEffect(() => {
        if (!token) {
            setLoading(false);
            setError('No hay sesión autenticada');
            return;
        }

        setLoading(true);
        setError(null);

        getActiveOrders(token)
            .then((data) => {
                // Asegurar que data sea un array
                const ordersArray = Array.isArray(data) ? data : [];
                setOrders(ordersArray);
                setLoading(false);
                setError(null);
            })
            .catch((error) => {
                const errorMessage = error?.message || 'Error al obtener los pedidos activos';
                console.error('Error al obtener los pedidos activos:', error);
                setError(errorMessage);
                toast.error(errorMessage, getToastTheme());
                setLoading(false);
                // Asegurar que orders sea un array vacío en caso de error
                setOrders([]);
            });
    }, [reloadCounter, token]);

    // Memoizar la categoría activa para evitar búsquedas repetidas
    const activeCategory = useMemo(() => {
        return categories.find((category) => category.current) || categories[0];
    }, [categories]);

    // Optimizar filtrado y ordenamiento con useMemo (usando debouncedSearchText)
    const sortedOrders = useMemo(() => {
        const searchLower = debouncedSearchText.toLowerCase();
        
        // Filtrar sin mutar los objetos originales
        const filtered = orders
            .filter((order) => {
                const matchesSearch = order.customer?.name?.toLowerCase().includes(searchLower) ||
                    order.id.toString().includes(debouncedSearchText);
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
    }, [orders, debouncedSearchText, activeCategory, selectedOrder]);

    const handleOnClickOrderCard = (orderId) => {
        setOnCreatingNewOrder(false);
        if (selectedOrder === orderId) {
            setSelectedOrder(null);
            if (isMobile) {
                setMobileListOpen(true);
                setMobileDetailOpen(false);
            }
            return;
        }
        setSelectedOrder(orderId);
        if (isMobile) {
            setMobileListOpen(false);
            setMobileDetailOpen(true);
        }
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
        if (isMobile) {
            setMobileListOpen(false);
            setMobileDetailOpen(true);
        }
    }
    
    const handleCloseDetail = useCallback(() => {
        setSelectedOrder(null);
        setOnCreatingNewOrder(false);
        if (isMobile) {
            setMobileDetailOpen(false);
            setMobileListOpen(true);
        }
    }, [isMobile]);

    const handleOnCreatedOrder = useCallback((id) => {
        reloadOrders();
        setOnCreatingNewOrder(false);
        setSelectedOrder(id);
        if (isMobile) {
            setMobileListOpen(false);
            setMobileDetailOpen(true);
        }
    }, [reloadOrders, isMobile]);




    // Componente de lista (reutilizable para desktop y mobile)
    const OrdersListContent = () => (
        <OrdersList
            onClickAddNewOrder={handleOnClickAddNewOrder}
            onClickOrderCard={handleOnClickOrderCard}
            orders={sortedOrders}
            categories={categories}
            onClickCategory={handleOnClickCategory}
            onChangeSearch={handleOnChangeSearch}
            searchText={searchText}
            disabled={isOrderLoading}
            error={error}
            onRetry={reloadOrders}
        />
    );

    // Memoizar la función onLoading para evitar re-renders infinitos
    const handleOrderLoading = useCallback((value) => {
        setIsOrderLoading(value);
    }, []);

    // Memoizar el contenido del detalle para evitar re-renders innecesarios
    const OrderDetailContent = useMemo(() => {
        if (selectedOrder) {
            return (
                <div className='h-full overflow-hidden'>
                    <Order 
                        orderId={selectedOrder} 
                        onChange={handleOnChange} 
                        onLoading={handleOrderLoading}
                        onClose={isMobile ? handleCloseDetail : undefined}
                    />
                </div>
            );
        }
        if (onCreatingNewOrder) {
            return (
                <Card className='h-full p-4 sm:p-7 flex flex-col justify-center items-center'>
                    <div className='w-full h-full overflow-y-auto'>
                        <CreateOrderForm onCreate={handleOnCreatedOrder} />
                    </div>
                </Card>
            );
        }
        return (
            <Card className='h-full p-4 sm:p-7 flex flex-col justify-center items-center'>
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
        );
    }, [selectedOrder, onCreatingNewOrder, handleOnChange, handleOrderLoading, isMobile, handleCloseDetail, handleOnCreatedOrder, handleOnClickAddNewOrder]);

    return (
        <>
            {loading ? (
                /* Loader */
                <div className="w-full h-full flex items-center justify-center">
                    <Loader />
                </div>
            ) : isMobile ? (
                /* Vista móvil con Sheets */
                <div className="h-full relative">
                    {/* Botón flotante para abrir lista en móvil - solo visible cuando no hay detalle abierto */}
                    {(!selectedOrder && !onCreatingNewOrder) && (
                        <div className="fixed top-4 left-4 z-50 lg:hidden">
                            <Sheet open={mobileListOpen} onOpenChange={setMobileListOpen}>
                                <SheetTrigger asChild>
                                    <Button size="icon" variant="outline" className="bg-background shadow-lg">
                                        <Menu className="h-5 w-5" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="w-[85vw] sm:w-[400px] p-0">
                                    <OrdersListContent />
                                </SheetContent>
                            </Sheet>
                        </div>
                    )}

                    {/* Sheet para lista en móvil */}
                    <Sheet open={mobileListOpen && !selectedOrder && !onCreatingNewOrder} onOpenChange={setMobileListOpen}>
                        <SheetContent side="left" className="w-[85vw] sm:w-[400px] p-0">
                            <OrdersListContent />
                        </SheetContent>
                    </Sheet>

                    {/* Sheet para detalle en móvil */}
                    {(selectedOrder || onCreatingNewOrder) && (
                        <Sheet 
                            open={mobileDetailOpen || selectedOrder !== null || onCreatingNewOrder} 
                            onOpenChange={(open) => {
                                if (!open) {
                                    handleCloseDetail();
                                }
                            }}
                        >
                            <SheetContent side="right" className="w-[100vw] sm:w-[90vw] md:w-[600px] p-0 overflow-y-auto">
                                {OrderDetailContent}
                            </SheetContent>
                        </Sheet>
                    )}

                    {/* Vista por defecto cuando no hay nada seleccionado */}
                    {!selectedOrder && !onCreatingNewOrder && !mobileListOpen && (
                        <div className="h-full flex items-center justify-center p-4">
                            <Card className="w-full max-w-md p-6">
                                <EmptyState
                                    icon={<Package className="h-12 w-12 text-primary" strokeWidth={1.5} />}
                                    title='Seleccione un pedido'
                                    description='Toca el botón de menú para ver la lista de pedidos.'
                                    button={{
                                        name: 'Ver pedidos',
                                        onClick: () => setMobileListOpen(true),
                                    }}
                                />
                            </Card>
                        </div>
                    )}
                </div>
            ) : (
                /* Vista desktop - layout side-by-side */
                <div className="h-full">
                    <div className="flex flex-col xl:flex-row h-full">
                        <div className='w-full xl:w-auto xl:max-w-md xl:h-full xl:border-r'>
                            <OrdersListContent />
                        </div>
                        <div className='grow lg:pl-0 p-2'>
                            {OrderDetailContent}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
