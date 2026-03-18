'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import OrdersList from '@/components/Admin/OrdersManager/OrdersList';
import Order from '@/components/Admin/OrdersManager/Order';
import CreateOrderForm from '@/components/Admin/OrdersManager/CreateOrderForm';
import ProductionView from '@/components/Admin/OrdersManager/ProductionView';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/Utilities/EmptyState';
import Loader from '@/components/Utilities/Loader';
import { useDebounce } from '@/hooks/useDebounce';
import { useIsMobile } from '@/hooks/use-mobile';
import { useComercialOrders } from '@/hooks/useComercialOrders';
import { useOffersList } from '@/hooks/useOffers';
import { notify } from '@/lib/notifications';
import { Package } from 'lucide-react';

const initialCategories = [
  { label: 'Todos', name: 'all', current: true },
  { label: 'En producción', name: 'pending', current: false },
  { label: 'Terminados', name: 'finished', current: false },
  { label: 'Hoy', name: 'today', current: false },
  { label: 'Mañana', name: 'tomorrow', current: false },
];

function enrichOrdersWithOffers(orders, offers) {
  const offerByOrderId = new Map(
    (offers ?? []).filter((o) => o.orderId != null).map((o) => [String(o.orderId), o])
  );
  return orders.map((order) => {
    if (order.offerId) return order;
    const linked = offerByOrderId.get(String(order.id));
    return linked ? { ...order, offerId: linked.id } : order;
  });
}

export default function ComercialOrdersManager() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const [onCreatingNewOrder, setOnCreatingNewOrder] = useState(false);
  const [isOrderLoading, setIsOrderLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(searchParams.get('orderId'));
  const [searchText, setSearchText] = useState('');
  const [categories, setCategories] = useState(initialCategories);
  const [viewMode, setViewMode] = useState('normal');

  const debouncedSearchText = useDebounce(searchText, 300);
  const { data: offers } = useOffersList({ perPage: 100 });
  const {
    data: orders = [],
    isLoading: loading,
    error: ordersError,
    refetch,
  } = useComercialOrders({ perPage: 100 });

  const error = ordersError;

  useEffect(() => {
    const orderId = searchParams.get('orderId');
    if (orderId) setSelectedOrder(orderId);
  }, [searchParams]);

  useEffect(() => {
    if (ordersError) {
      notify.error({
        title: 'Error al cargar pedidos',
        description: ordersError,
      });
    }
  }, [ordersError]);

  const enrichedOrders = useMemo(
    () => enrichOrdersWithOffers(orders, offers),
    [orders, offers]
  );

  const activeCategory = useMemo(
    () => categories.find((c) => c.current) || categories[0],
    [categories]
  );

  const visibleCategories = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const hasOrdersToday = enrichedOrders.some((order) => {
      const loadDateObj = order.loadDate ? new Date(order.loadDate) : null;
      const loadDateOnly = loadDateObj
        ? new Date(loadDateObj.getFullYear(), loadDateObj.getMonth(), loadDateObj.getDate())
        : null;
      return loadDateOnly && loadDateOnly.getTime() === today.getTime();
    });
    const hasOrdersTomorrow = enrichedOrders.some((order) => {
      const loadDateObj = order.loadDate ? new Date(order.loadDate) : null;
      const loadDateOnly = loadDateObj
        ? new Date(loadDateObj.getFullYear(), loadDateObj.getMonth(), loadDateObj.getDate())
        : null;
      return loadDateOnly && loadDateOnly.getTime() === tomorrow.getTime();
    });

    const result = [{ label: 'Todos', name: 'all' }];
    if (hasOrdersToday) result.push({ label: 'Hoy', name: 'today' });
    if (hasOrdersTomorrow) result.push({ label: 'Mañana', name: 'tomorrow' });
    result.push(
      { label: 'En producción', name: 'pending' },
      { label: 'Terminados', name: 'finished' }
    );
    return result;
  }, [enrichedOrders]);

  useEffect(() => {
    const currentName = activeCategory.name;
    if (
      (currentName === 'today' || currentName === 'tomorrow') &&
      !visibleCategories.some((c) => c.name === currentName)
    ) {
      setCategories((prev) => prev.map((cat) => ({ ...cat, current: cat.name === 'all' })));
    }
  }, [visibleCategories, activeCategory.name]);

  useEffect(() => {
    if (!isMobile && (activeCategory.name === 'today' || activeCategory.name === 'tomorrow')) {
      setCategories((prev) => prev.map((cat) => ({ ...cat, current: cat.name === 'all' })));
    }
  }, [isMobile, activeCategory.name]);

  const visibleCategoriesForTabs = useMemo(() => {
    if (isMobile) return visibleCategories;
    return visibleCategories.filter((c) => c.name !== 'today' && c.name !== 'tomorrow');
  }, [isMobile, visibleCategories]);

  const sortedOrders = useMemo(() => {
    const searchLower = debouncedSearchText.toLowerCase();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const filtered = enrichedOrders.filter((order) => {
      const loadDateObj = order.loadDate ? new Date(order.loadDate) : null;
      const loadDateOnly = loadDateObj
        ? new Date(loadDateObj.getFullYear(), loadDateObj.getMonth(), loadDateObj.getDate())
        : null;

      const matchesSearch =
        order.customer?.name?.toLowerCase().includes(searchLower) ||
        order.id.toString().includes(debouncedSearchText);

      let matchesCategory = true;
      if (activeCategory.name === 'today') {
        matchesCategory = loadDateOnly && loadDateOnly.getTime() === today.getTime();
      } else if (activeCategory.name === 'tomorrow') {
        matchesCategory = loadDateOnly && loadDateOnly.getTime() === tomorrow.getTime();
      } else if (activeCategory.name !== 'all') {
        matchesCategory = activeCategory.name === order.status;
      }

      const isOldFinishedOrder =
        order.status === 'finished' && loadDateOnly && loadDateOnly < today;
      const matchesBusinessLogic = !isOldFinishedOrder;

      return matchesSearch && matchesCategory && matchesBusinessLogic;
    });

    return [...filtered].sort((a, b) => new Date(a.loadDate) - new Date(b.loadDate));
  }, [enrichedOrders, debouncedSearchText, activeCategory]);

  const reloadOrders = useCallback(() => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['crm', 'offers', 'list'] });
  }, [refetch, queryClient]);

  const handleOnChange = useCallback(
    (updatedOrder = null) => {
      if (updatedOrder) {
        refetch();
      } else {
        reloadOrders();
      }
    },
    [refetch, reloadOrders]
  );

  const handleOnClickCategory = useCallback((categoryName) => {
    setSelectedOrder(null);
    setOnCreatingNewOrder(false);
    setCategories((prev) =>
      prev.map((cat) => ({ ...cat, current: cat.name === categoryName }))
    );
  }, []);

  const handleOnChangeSearch = useCallback((value) => {
    setOnCreatingNewOrder(false);
    setCategories((prev) => prev.map((cat) => ({ ...cat, current: cat.name === 'all' })));
    setSearchText(value);
    setSelectedOrder(null);
  }, []);

  const handleOnClickAddNewOrder = useCallback(() => {
    setCategories((prev) => prev.map((cat) => ({ ...cat, current: cat.name === 'all' })));
    setSelectedOrder(null);
    setSearchText('');
    setOnCreatingNewOrder(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedOrder(null);
    setOnCreatingNewOrder(false);
  }, []);

  const handleOnClickOrderCard = useCallback((orderId) => {
    setOnCreatingNewOrder(false);
    if (viewMode === 'production') setViewMode('normal');
    setSelectedOrder((prev) => (prev === orderId ? null : orderId));
  }, [viewMode]);

  const handleOnCreatedOrder = useCallback(
    (id) => {
      setOnCreatingNewOrder(false);
      setSelectedOrder(id);
      setTimeout(() => reloadOrders(), 0);
    },
    [reloadOrders]
  );

  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => (prev === 'normal' ? 'production' : 'normal'));
    if (viewMode === 'normal') {
      setSelectedOrder(null);
      setOnCreatingNewOrder(false);
    }
  }, [viewMode]);

  const handleOrderLoading = useCallback((value) => {
    setIsOrderLoading(value);
  }, []);

  const OrdersListContent = useMemo(
    () => (
      <OrdersList
        orders={sortedOrders}
        totalActiveOrders={enrichedOrders.length}
        categories={categories}
        visibleCategories={visibleCategoriesForTabs}
        onClickCategory={handleOnClickCategory}
        onChangeSearch={handleOnChangeSearch}
        searchText={searchText}
        onClickOrderCard={handleOnClickOrderCard}
        onClickAddNewOrder={handleOnClickAddNewOrder}
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
      enrichedOrders.length,
      categories,
      visibleCategoriesForTabs,
      searchText,
      isOrderLoading,
      error,
      selectedOrder,
      viewMode,
      handleOnClickCategory,
      handleOnChangeSearch,
      handleOnClickOrderCard,
      handleOnClickAddNewOrder,
      reloadOrders,
      toggleViewMode,
    ]
  );

  const OrderDetailContent = useMemo(() => {
    if (selectedOrder) {
      return (
        <div className="h-full overflow-hidden">
          <Order
            orderId={selectedOrder}
            onChange={handleOnChange}
            onLoading={handleOrderLoading}
            onClose={isMobile ? handleCloseDetail : undefined}
            readOnly
          />
        </div>
      );
    }
    if (onCreatingNewOrder) {
      return (
        <div className="h-full flex flex-col overflow-hidden">
          <CreateOrderForm onCreate={handleOnCreatedOrder} onClose={handleCloseDetail} />
        </div>
      );
    }
    return (
      <Card className="h-full flex flex-col p-4 sm:p-7">
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
    isMobile,
    handleOnChange,
    handleOrderLoading,
    handleCloseDetail,
    handleOnCreatedOrder,
    handleOnClickAddNewOrder,
  ]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {viewMode === 'production' ? (
        <div className="h-full flex flex-col overflow-hidden">
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
        <div className="h-full flex flex-col min-h-0">
          {selectedOrder || onCreatingNewOrder ? (
            <div className="h-full overflow-hidden">{OrderDetailContent}</div>
          ) : (
            <div className="h-full flex flex-col overflow-hidden min-h-0">
              {OrdersListContent}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col xl:flex-row h-full">
          <div className="w-full xl:w-[360px] xl:flex-shrink-0 xl:h-full">
            {OrdersListContent}
          </div>
          <div className="grow lg:pl-0 p-2">{OrderDetailContent}</div>
        </div>
      )}
    </div>
  );
}
