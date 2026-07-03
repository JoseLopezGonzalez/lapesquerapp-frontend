'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import OrdersList from './OrdersList';
import Order from './Order';
import { useOrders } from '@/hooks/useOrders';
import { Package } from 'lucide-react';
import { EmptyState } from '@/components/Utilities/EmptyState';
import { Card } from '@/components/ui/card';
import CreateOrderForm from './CreateOrderForm';
import OrdersManagerLayout from './shared/OrdersManagerLayout';
import { useDebounce } from '@/hooks/useDebounce';
import { useIsMobileSafe } from '@/hooks/use-mobile';
import { notify } from '@/lib/notifications';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  INITIAL_ORDER_CATEGORIES,
  buildVisibleOrderCategories,
  filterAndSortOrders,
  type OrderListItem,
} from '@/lib/orders/orderListFilters';

export default function OrdersManager() {
  const queryClient = useQueryClient();
  const { isMobile, mounted } = useIsMobileSafe();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [onCreatingNewOrder, setOnCreatingNewOrder] = useState(false);
  const [isOrderLoading, setIsOrderLoading] = useState(false);
  const [createOrderPrefill, setCreateOrderPrefill] = useState<unknown>(null);

  const { orders = [], isLoading: loading, error: ordersError, queryKey } = useOrders();
  const [categories, setCategories] = useState(INITIAL_ORDER_CATEGORIES);
  const [selectedOrder, setSelectedOrder] = useState<number | string | null>(
    () => searchParams.get('order') ?? null
  );
  const [searchText, setSearchText] = useState('');
  const [viewMode, setViewMode] = useState('normal'); // 'normal' o 'production'

  // Debouncing de búsqueda para mejorar rendimiento
  const debouncedSearchText = useDebounce(searchText, 300);

  const error = ordersError;

  // Función explícita para recargar pedidos (invalida caché React Query)
  const reloadOrders = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  const handleOnChange = useCallback(
    (updatedOrder: OrderListItem | null = null) => {
      if (updatedOrder) {
        // Actualizar caché localmente para feedback inmediato
        queryClient.setQueryData(queryKey, (prevOrders: OrderListItem[] = []) =>
          prevOrders.map((order) => (order.id === updatedOrder.id ? updatedOrder : order))
        );
      } else {
        // Recargar desde el endpoint
        queryClient.invalidateQueries({ queryKey });
      }
    },
    [queryClient, queryKey]
  );

  // Mostrar toast en error de carga (comportamiento anterior)
  useEffect(() => {
    if (ordersError) {
      notify.error({
        title: 'Error al cargar pedidos',
        description: ordersError,
      });
    }
  }, [ordersError]);

  useEffect(() => {
    const shouldOpenCreate = searchParams.get('create') === '1';
    const prefillKey = searchParams.get('prefill');
    const orderIdFromUrl = searchParams.get('order');
    let parsedPrefill = null;

    if (prefillKey) {
      try {
        const rawPrefill = sessionStorage.getItem(prefillKey);
        if (rawPrefill) {
          parsedPrefill = JSON.parse(rawPrefill);
          sessionStorage.removeItem(prefillKey);
        }
      } catch {
        notify.error({
          title: 'No se pudo cargar el prellenado del pedido',
          description: 'El pedido se abrirá sin líneas pre-cargadas.',
        });
      }
    }

    if (parsedPrefill) {
      setCreateOrderPrefill(parsedPrefill);
    }

    if (shouldOpenCreate) {
      setSelectedOrder(null);
      setOnCreatingNewOrder(true);
    } else if (orderIdFromUrl) {
      setSelectedOrder(orderIdFromUrl);
    }

    if (!shouldOpenCreate && !prefillKey) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete('create');
    nextParams.delete('prefill');
    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `/admin/orders-manager?${nextQuery}` : '/admin/orders-manager');
  }, [searchParams, router]);

  // Sincroniza el pedido abierto con la URL (history.replaceState directo, sin pasar
  // por el router de Next ni crear entradas de historial) — la vista de detalle no es
  // una ruta real, solo estado de React, así que un pull-to-refresh o una recarga del
  // navegador perdían la selección y devolvían siempre al listado. Con el id en la URL,
  // el efecto de montaje de arriba lo restaura.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const nextUrl = selectedOrder
      ? `/admin/orders-manager?order=${selectedOrder}`
      : '/admin/orders-manager';
    const currentUrl = `${window.location.pathname}${window.location.search}`;
    if (currentUrl !== nextUrl) {
      window.history.replaceState(null, '', nextUrl);
    }
  }, [selectedOrder]);

  // Memoizar la categoría activa para evitar búsquedas repetidas
  const activeCategory = useMemo(() => {
    return categories.find((category) => category.current) || categories[0];
  }, [categories]);

  const visibleCategories = useMemo(() => {
    return buildVisibleOrderCategories(orders);
  }, [orders]);

  // Si la categoría activa ya no está visible (ej. era "Hoy" y ya no hay pedidos para hoy), volver a "Todos"
  useEffect(() => {
    const currentName = activeCategory.name;
    if (
      (currentName === 'today' || currentName === 'tomorrow') &&
      !visibleCategories.some((c) => c.name === currentName)
    ) {
      setCategories((prev) => prev.map((cat) => ({ ...cat, current: cat.name === 'all' })));
    }
  }, [visibleCategories, activeCategory.name]);

  // En desktop no mostramos tabs Hoy/Mañana; si estaba seleccionado uno, volver a "Todos"
  useEffect(() => {
    if (!isMobile && (activeCategory.name === 'today' || activeCategory.name === 'tomorrow')) {
      setCategories((prev) => prev.map((cat) => ({ ...cat, current: cat.name === 'all' })));
    }
  }, [isMobile, activeCategory.name]);

  // Tabs visibles: en mobile incluyen Hoy/Mañana; en desktop solo Todos, En producción, Terminados
  const visibleCategoriesForTabs = useMemo(() => {
    if (isMobile) return visibleCategories;
    return visibleCategories.filter((c) => c.name !== 'today' && c.name !== 'tomorrow');
  }, [isMobile, visibleCategories]);

  const sortedOrders = useMemo(() => {
    return filterAndSortOrders(orders, {
      searchText: debouncedSearchText,
      activeCategoryName: activeCategory.name,
    });
  }, [orders, debouncedSearchText, activeCategory]);

  // Toggle entre vista normal y vista cocina
  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => (prev === 'normal' ? 'production' : 'normal'));
    // Al cambiar a vista cocina, cerrar el detalle del pedido si está abierto
    if (viewMode === 'normal') {
      setSelectedOrder(null);
      setOnCreatingNewOrder(false);
    }
  }, [viewMode]);

  const handleOnClickOrderCard = useCallback(
    (orderId: number | string) => {
      setCreateOrderPrefill(null);
      setOnCreatingNewOrder(false);
      // Si estamos en vista producción, cambiar a vista normal
      if (viewMode === 'production') {
        setViewMode('normal');
      }
      setSelectedOrder((prevSelectedOrder) => {
        if (prevSelectedOrder === orderId) {
          return null;
        }
        return orderId;
      });
    },
    [viewMode]
  );

  const handleOnClickCategory = useCallback((categoryName: string) => {
    setSelectedOrder(null);
    setOnCreatingNewOrder(false);

    setCategories((prevCategories) =>
      prevCategories.map((cat) => {
        if (cat.name === categoryName) {
          return {
            ...cat,
            current: true,
          };
        } else {
          return {
            ...cat,
            current: false,
          };
        }
      })
    );
  }, []);

  const handleOnChangeSearch = useCallback((value: string) => {
    /* Set current true category.name all  */
    setCreateOrderPrefill(null);
    setOnCreatingNewOrder(false);
    setCategories((prevCategories) =>
      prevCategories.map((cat) => {
        return {
          ...cat,
          current: cat.name === 'all',
        };
      })
    );

    setSearchText(value);
    setSelectedOrder(null);
  }, []);

  const handleOnClickAddNewOrder = useCallback(() => {
    /* Set category current 'all' */
    setCategories((prevCategories) =>
      prevCategories.map((cat) => {
        return {
          ...cat,
          current: cat.name === 'all',
        };
      })
    );
    setSelectedOrder(null);
    setSearchText('');
    setCreateOrderPrefill(null);
    setOnCreatingNewOrder(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedOrder(null);
    setOnCreatingNewOrder(false);
    setCreateOrderPrefill(null);
  }, []);

  const handleOnCreatedOrder = useCallback(
    (id: number | string) => {
      // Primero seleccionar el pedido para que se cargue inmediatamente
      // Esto permite que el componente Order comience a cargar el pedido sin esperar
      setOnCreatingNewOrder(false);
      setSelectedOrder(id);
      setCreateOrderPrefill(null);

      // Recargar la lista en segundo plano para asegurar que esté actualizada
      // pero sin bloquear la carga del pedido individual
      // Usamos setTimeout para que la carga del pedido individual tenga prioridad
      setTimeout(() => {
        reloadOrders();
      }, 0);
    },
    [reloadOrders]
  );

  // Componente de lista (reutilizable para desktop y mobile)
  const OrdersListContent = useMemo(
    () => (
      <OrdersList
        onClickAddNewOrder={handleOnClickAddNewOrder}
        onClickOrderCard={handleOnClickOrderCard}
        orders={sortedOrders}
        totalActiveOrders={orders.length}
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
    ),
    [
      sortedOrders,
      orders.length,
      categories,
      visibleCategoriesForTabs,
      searchText,
      isOrderLoading,
      error,
      selectedOrder,
      viewMode,
      toggleViewMode,
      handleOnClickAddNewOrder,
      handleOnClickOrderCard,
      handleOnClickCategory,
      handleOnChangeSearch,
      reloadOrders,
    ]
  );

  // Memoizar la función onLoading para evitar re-renders infinitos
  const handleOrderLoading = useCallback((value: boolean) => {
    setIsOrderLoading(value);
  }, []);

  // Memoizar el contenido del detalle para evitar re-renders innecesarios
  const OrderDetailContent = useMemo(() => {
    if (selectedOrder) {
      return (
        <div className="h-full overflow-hidden">
          <Order
            orderId={selectedOrder}
            onChange={handleOnChange}
            onLoading={handleOrderLoading}
            onClose={isMobile ? handleCloseDetail : undefined}
            isMobileOverride={isMobile}
          />
        </div>
      );
    }
    if (onCreatingNewOrder) {
      return (
        <div className="flex h-full flex-col overflow-hidden">
          <CreateOrderForm
            onCreate={handleOnCreatedOrder}
            onClose={handleCloseDetail}
            initialPrefill={createOrderPrefill as never}
          />
        </div>
      );
    }
    return (
      <Card className="flex h-full flex-col p-4 sm:p-7">
        <EmptyState
          title="Seleccione un pedido"
          description="Selecciona un pedido para ver los detalles y realizar cambios."
          icon={<Package />}
          button={{ name: 'Crear pedido nuevo', onClick: handleOnClickAddNewOrder }}
        />
      </Card>
    );
  }, [
    selectedOrder,
    onCreatingNewOrder,
    handleOnChange,
    handleOrderLoading,
    isMobile,
    handleCloseDetail,
    handleOnCreatedOrder,
    handleOnClickAddNewOrder,
    createOrderPrefill,
  ]);

  if (!mounted) return null;

  return (
    <OrdersManagerLayout
      loading={loading}
      viewMode={viewMode}
      isMobile={isMobile}
      hasDetail={Boolean(selectedOrder || onCreatingNewOrder)}
      listContent={OrdersListContent}
      detailContent={OrderDetailContent}
      onClickProductionOrder={handleOnClickOrderCard}
      onToggleViewMode={toggleViewMode}
    />
  );
}
