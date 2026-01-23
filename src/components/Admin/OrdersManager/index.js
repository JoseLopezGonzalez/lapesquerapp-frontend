'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useSession } from 'next-auth/react';
import OrdersList from './OrdersList';
import { EmptyState } from '@/components/Utilities/EmptyState/index';
import Order from './Order';
import { getActiveOrders } from '@/services/orderService';
import { Loader2, Package, PlusCircle, Plus, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Loader from '@/components/Utilities/Loader';
import CreateOrderForm from './CreateOrderForm';
import toast from 'react-hot-toast';
import { getToastTheme } from '@/customs/reactHotToast';
import { useDebounce } from '@/hooks/useDebounce';
import { useIsMobile } from '@/hooks/use-mobile';
import { fetchWithTenant } from "@lib/fetchWithTenant";
import { API_URL_V2 } from '@/configs/config';


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

        console.log('[OrdersManager] 📥 useEffect getActiveOrders - Inicio', { reloadCounter, timestamp: new Date().toISOString() });
        const startTime = performance.now();
        
        setLoading(true);
        setError(null);

        getActiveOrders(token)
            .then((data) => {
                const fetchTime = performance.now();
                console.log('[OrdersManager] ⏱️ getActiveOrders - Tiempo de respuesta API:', (fetchTime - startTime).toFixed(2), 'ms');
                
                // Asegurar que data sea un array
                const ordersArray = Array.isArray(data) ? data : [];
                setOrders(ordersArray);
                setLoading(false);
                setError(null);
                
                const totalTime = performance.now();
                console.log('[OrdersManager] ✅ getActiveOrders - Completado (total:', (totalTime - startTime).toFixed(2), 'ms, pedidos:', ordersArray.length, ')');
            })
            .catch((error) => {
                const errorTime = performance.now();
                const errorMessage = error?.message || 'Error al obtener los pedidos activos';
                console.error('[OrdersManager] ❌ Error al obtener los pedidos activos (tiempo:', (errorTime - startTime).toFixed(2), 'ms):', error);
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
    // No incluimos selectedOrder en las dependencias para evitar re-renders innecesarios
    // isSelected se calculará en OrderCard basándose en selectedOrderId prop
    const sortedOrders = useMemo(() => {
        const searchLower = debouncedSearchText.toLowerCase();
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Resetear horas para comparación de fechas
        
        // Filtrar sin mutar los objetos originales
        const filtered = orders
            .filter((order) => {
                // Filtro de búsqueda
                const matchesSearch = order.customer?.name?.toLowerCase().includes(searchLower) ||
                    order.id.toString().includes(debouncedSearchText);
                
                // Filtro de categoría
                const matchesCategory = activeCategory.name === 'all' ||
                    activeCategory.name === order.status;
                
                // Lógica de negocio: Si el pedido está "finished" (enviado) y es más antiguo que hoy,
                // no mostrarlo en la lista (solo mostrar finished del día actual o futuros)
                const loadDateObj = order.loadDate ? new Date(order.loadDate) : null;
                const loadDateOnly = loadDateObj ? new Date(loadDateObj.getFullYear(), loadDateObj.getMonth(), loadDateObj.getDate()) : null;
                const isOldFinishedOrder = order.status === 'finished' && loadDateOnly && loadDateOnly < today;
                const matchesBusinessLogic = !isOldFinishedOrder;
                
                return matchesSearch && matchesCategory && matchesBusinessLogic;
            });

        // Ordenar creando una copia del array
        return [...filtered].sort((a, b) => {
            return new Date(a.loadDate) - new Date(b.loadDate);
        });
    }, [orders, debouncedSearchText, activeCategory]);

    const handleOnClickOrderCard = useCallback((orderId) => {
        setOnCreatingNewOrder(false);
        setSelectedOrder(prevSelectedOrder => {
            if (prevSelectedOrder === orderId) {
                return null;
            }
            return orderId;
        });
    }, []);

    const handleOnClickCategory = useCallback((categoryName) => {
        setSelectedOrder(null);
        setOnCreatingNewOrder(false);

        setCategories(prevCategories => prevCategories.map((cat) => {
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
    }, []);

    const handleOnChangeSearch = useCallback((value) => {
        /* Set current true category.name all  */
        setOnCreatingNewOrder(false);
        setCategories(prevCategories => prevCategories.map((cat) => {
            return {
                ...cat,
                current: cat.name === 'all',
            }
        }));

        setSearchText(value);
        setSelectedOrder(null);
    }, []);

    const handleOnClickAddNewOrder = useCallback(() => {
        /* Set category current 'all' */
        setCategories(prevCategories => prevCategories.map((cat) => {
            return {
                ...cat,
                current: cat.name === 'all',
            }
        }));
        setSelectedOrder(null);
        setSearchText('');
        setOnCreatingNewOrder(true);
    }, []);
    
    const handleCloseDetail = useCallback(() => {
        setSelectedOrder(null);
        setOnCreatingNewOrder(false);
    }, []);

    const handleOnCreatedOrder = useCallback((id, newOrderData = null) => {
        console.log('[OrdersManager] 🚀 handleOnCreatedOrder - Inicio', { id, timestamp: new Date().toISOString() });
        const startTime = performance.now();
        
        // Primero seleccionar el pedido para que se cargue inmediatamente
        // Esto permite que el componente Order comience a cargar el pedido sin esperar
        console.log('[OrdersManager] 📌 Seleccionando pedido:', id);
        setOnCreatingNewOrder(false);
        setSelectedOrder(id);
        
        const selectTime = performance.now();
        console.log('[OrdersManager] ⏱️ Tiempo hasta seleccionar pedido:', (selectTime - startTime).toFixed(2), 'ms');
        
        // Recargar la lista en segundo plano para asegurar que esté actualizada
        // pero sin bloquear la carga del pedido individual
        // Usamos setTimeout para que la carga del pedido individual tenga prioridad
        setTimeout(() => {
            console.log('[OrdersManager] 🔄 Iniciando recarga de lista de pedidos');
            const reloadStartTime = performance.now();
            reloadOrders();
            console.log('[OrdersManager] ⏱️ Tiempo hasta iniciar recarga:', (performance.now() - reloadStartTime).toFixed(2), 'ms');
        }, 0);
        
        console.log('[OrdersManager] ✅ handleOnCreatedOrder - Fin (total:', (performance.now() - startTime).toFixed(2), 'ms)');
    }, [reloadOrders]);




    // Componente de lista (reutilizable para desktop y mobile)
    const OrdersListContent = useMemo(() => (
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
            selectedOrderId={selectedOrder}
        />
    ), [sortedOrders, categories, searchText, isOrderLoading, error, selectedOrder, handleOnClickAddNewOrder, handleOnClickOrderCard, handleOnClickCategory, handleOnChangeSearch, reloadOrders]);

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
            ) : (
                /* Vista - layout adaptativo: lista siempre visible, detalle se muestra cuando se selecciona */
                <div className="h-full">
                    {isMobile ? (
                        /* Vista móvil: lista o detalle según selección */
                        <div className="h-full flex flex-col">
                            {selectedOrder || onCreatingNewOrder ? (
                                /* Mostrar detalle cuando hay selección */
                                <div className='h-full overflow-hidden'>
                                    {OrderDetailContent}
                                </div>
                            ) : (
                                /* Mostrar lista cuando no hay selección */
                                <div className='h-full'>
                                    {OrdersListContent}
                                </div>
                            )}
                            
                        </div>
                    ) : (
                        /* Vista desktop - layout side-by-side */
                        <div className="flex flex-col xl:flex-row h-full">
                            <div className='w-full xl:w-[360px] xl:flex-shrink-0 xl:h-full'>
                                {OrdersListContent}
                            </div>
                            <div className='grow lg:pl-0 p-2'>
                                {OrderDetailContent}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    )
}
