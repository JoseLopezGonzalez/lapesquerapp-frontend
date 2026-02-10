'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useSession } from 'next-auth/react';
import OrdersList from './OrdersList';
import { EmptyState } from '@/components/Utilities/EmptyState/index';
import Order from './Order';
import { getActiveOrders } from '@/services/orderService';
import { Loader2, Package, PlusCircle, Plus, Download, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Loader from '@/components/Utilities/Loader';
import CreateOrderForm from './CreateOrderForm';
import ProductionView from './ProductionView';
import toast from 'react-hot-toast';
import { getToastTheme } from '@/customs/reactHotToast';
import { useDebounce } from '@/hooks/useDebounce';
import { useIsMobile } from '@/hooks/use-mobile';
import { fetchWithTenant } from "@lib/fetchWithTenant";
import { API_URL_V2 } from '@/configs/config';


const initialCategories = [
    { label: 'Todos', name: 'all', current: true },
    { label: 'En producción', name: 'pending', current: false },
    { label: 'Terminados', name: 'finished', current: false },
    { label: 'Hoy', name: 'today', current: false },
    { label: 'Mañana', name: 'tomorrow', current: false },
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
    const [viewMode, setViewMode] = useState('normal'); // 'normal' o 'production'

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

    // Categorías visibles: Hoy y Mañana solo si hay pedidos para esa fecha; orden: Hoy, Mañana, Todos, En producción, Terminados
    const visibleCategories = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const hasOrdersToday = orders.some((order) => {
            const loadDateObj = order.loadDate ? new Date(order.loadDate) : null;
            const loadDateOnly = loadDateObj ? new Date(loadDateObj.getFullYear(), loadDateObj.getMonth(), loadDateObj.getDate()) : null;
            return loadDateOnly && loadDateOnly.getTime() === today.getTime();
        });
        const hasOrdersTomorrow = orders.some((order) => {
            const loadDateObj = order.loadDate ? new Date(order.loadDate) : null;
            const loadDateOnly = loadDateObj ? new Date(loadDateObj.getFullYear(), loadDateObj.getMonth(), loadDateObj.getDate()) : null;
            return loadDateOnly && loadDateOnly.getTime() === tomorrow.getTime();
        });

        const result = [{ label: 'Todos', name: 'all' }];
        if (hasOrdersToday) result.push({ label: 'Hoy', name: 'today' });
        if (hasOrdersTomorrow) result.push({ label: 'Mañana', name: 'tomorrow' });
        result.push({ label: 'En producción', name: 'pending' }, { label: 'Terminados', name: 'finished' });
        return result;
    }, [orders]);

    // Si la categoría activa ya no está visible (ej. era "Hoy" y ya no hay pedidos para hoy), volver a "Todos"
    useEffect(() => {
        const currentName = activeCategory.name;
        if ((currentName === 'today' || currentName === 'tomorrow') && !visibleCategories.some((c) => c.name === currentName)) {
            setCategories((prev) =>
                prev.map((cat) => ({ ...cat, current: cat.name === 'all' }))
            );
        }
    }, [visibleCategories, activeCategory.name]);

    // En desktop no mostramos tabs Hoy/Mañana; si estaba seleccionado uno, volver a "Todos"
    useEffect(() => {
        if (!isMobile && (activeCategory.name === 'today' || activeCategory.name === 'tomorrow')) {
            setCategories((prev) =>
                prev.map((cat) => ({ ...cat, current: cat.name === 'all' }))
            );
        }
    }, [isMobile, activeCategory.name]);

    // Tabs visibles: en mobile incluyen Hoy/Mañana; en desktop solo Todos, En producción, Terminados
    const visibleCategoriesForTabs = useMemo(() => {
        if (isMobile) return visibleCategories;
        return visibleCategories.filter((c) => c.name !== 'today' && c.name !== 'tomorrow');
    }, [isMobile, visibleCategories]);

    // Optimizar filtrado y ordenamiento con useMemo (usando debouncedSearchText)
    // No incluimos selectedOrder en las dependencias para evitar re-renders innecesarios
    // isSelected se calculará en OrderCard basándose en selectedOrderId prop
    const sortedOrders = useMemo(() => {
        const searchLower = debouncedSearchText.toLowerCase();
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Resetear horas para comparación de fechas
        
        // Filtrar sin mutar los objetos originales
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const filtered = orders
            .filter((order) => {
                const loadDateObj = order.loadDate ? new Date(order.loadDate) : null;
                const loadDateOnly = loadDateObj ? new Date(loadDateObj.getFullYear(), loadDateObj.getMonth(), loadDateObj.getDate()) : null;

                // Filtro de búsqueda
                const matchesSearch = order.customer?.name?.toLowerCase().includes(searchLower) ||
                    order.id.toString().includes(debouncedSearchText);

                // Filtro de categoría: estado (all/pending/finished) o fecha (today/tomorrow)
                let matchesCategory = true;
                if (activeCategory.name === 'today') {
                    matchesCategory = loadDateOnly && loadDateOnly.getTime() === today.getTime();
                } else if (activeCategory.name === 'tomorrow') {
                    matchesCategory = loadDateOnly && loadDateOnly.getTime() === tomorrow.getTime();
                } else if (activeCategory.name !== 'all') {
                    matchesCategory = activeCategory.name === order.status;
                }

                // Lógica de negocio: no mostrar finished antiguos (solo hoy o futuros)
                const isOldFinishedOrder = order.status === 'finished' && loadDateOnly && loadDateOnly < today;
                const matchesBusinessLogic = !isOldFinishedOrder;

                return matchesSearch && matchesCategory && matchesBusinessLogic;
            });

        // Ordenar creando una copia del array
        return [...filtered].sort((a, b) => {
            return new Date(a.loadDate) - new Date(b.loadDate);
        });
    }, [orders, debouncedSearchText, activeCategory]);

    // Toggle entre vista normal y vista cocina
    const toggleViewMode = useCallback(() => {
        setViewMode(prev => prev === 'normal' ? 'production' : 'normal');
        // Al cambiar a vista cocina, cerrar el detalle del pedido si está abierto
        if (viewMode === 'normal') {
            setSelectedOrder(null);
            setOnCreatingNewOrder(false);
        }
    }, [viewMode]);

    const handleOnClickOrderCard = useCallback((orderId) => {
        setOnCreatingNewOrder(false);
        // Si estamos en vista producción, cambiar a vista normal
        if (viewMode === 'production') {
            setViewMode('normal');
        }
        setSelectedOrder(prevSelectedOrder => {
            if (prevSelectedOrder === orderId) {
                return null;
            }
            return orderId;
        });
    }, [viewMode]);

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
        // Primero seleccionar el pedido para que se cargue inmediatamente
        // Esto permite que el componente Order comience a cargar el pedido sin esperar
        setOnCreatingNewOrder(false);
        setSelectedOrder(id);
        
        // Recargar la lista en segundo plano para asegurar que esté actualizada
        // pero sin bloquear la carga del pedido individual
        // Usamos setTimeout para que la carga del pedido individual tenga prioridad
        setTimeout(() => {
            reloadOrders();
        }, 0);
    }, [reloadOrders]);




    // Componente de lista (reutilizable para desktop y mobile)
    const OrdersListContent = useMemo(() => (
        <OrdersList
            onClickAddNewOrder={handleOnClickAddNewOrder}
            onClickOrderCard={handleOnClickOrderCard}
            orders={sortedOrders}
            categories={categories}
            visibleCategories={visibleCategoriesForTabs}
            onClickCategory={handleOnClickCategory}
            onChangeSearch={handleOnChangeSearch}
            searchText={searchText}
            disabled={isOrderLoading}
            error={error}
            onRetry={reloadOrders}
            selectedOrderId={selectedOrder}
            viewMode={viewMode}
            onToggleViewMode={toggleViewMode}
        />
    ), [sortedOrders, categories, visibleCategoriesForTabs, searchText, isOrderLoading, error, selectedOrder, viewMode, toggleViewMode, handleOnClickAddNewOrder, handleOnClickOrderCard, handleOnClickCategory, handleOnChangeSearch, reloadOrders]);

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
                <div className='h-full flex flex-col overflow-hidden'>
                    <CreateOrderForm onCreate={handleOnCreatedOrder} onClose={handleCloseDetail} />
                    </div>
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
                <div className="h-full flex flex-col">
                    {viewMode === 'production' ? (
                        /* Vista de producción - pantalla completa */
                        <div className="h-full flex flex-col overflow-hidden">
                            {/* Contenido de vista producción - ocupa todo el espacio */}
                            <div className="h-full min-h-0 overflow-hidden">
                                <ProductionView
                                    orders={sortedOrders}
                                    onClickOrder={handleOnClickOrderCard}
                                    useMockData={sortedOrders.length === 0}
                                    onToggleViewMode={toggleViewMode}
                                />
                            </div>
                        </div>
                    ) : isMobile ? (
                        /* Vista móvil: lista o detalle según selección */
                        <div className="h-full flex flex-col min-h-0">
                            {selectedOrder || onCreatingNewOrder ? (
                                /* Mostrar detalle cuando hay selección */
                                <div className='h-full overflow-hidden'>
                                    {OrderDetailContent}
                                </div>
                            ) : (
                                /* Mostrar lista cuando no hay selección */
                                <div className='h-full flex flex-col overflow-hidden min-h-0'>
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
