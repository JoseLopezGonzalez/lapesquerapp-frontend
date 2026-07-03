'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import OrdersList from '@/components/Admin/OrdersManager/OrdersList';
import type { OrderCardOrder } from '@/components/Admin/OrdersManager/OrdersList/OrderCard';
import Order from '@/components/Admin/OrdersManager/Order';
import OrdersManagerLayout from '@/components/Admin/OrdersManager/shared/OrdersManagerLayout';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/Utilities/EmptyState';
import { useDebounce } from '@/hooks/useDebounce';
import { useIsMobileSafe } from '@/hooks/use-mobile';
import { useComercialOrders } from '@/hooks/useComercialOrders';
import { useOffersList } from '@/hooks/useOffers';
import {
  buildVisibleCommercialOrderCategories,
  enrichOrdersWithOffers,
  filterAndSortCommercialOrders,
} from '@/lib/comercial/comercialOrders';
import { INITIAL_ORDER_CATEGORIES } from '@/lib/orders/orderListFilters';
import { notify } from '@/lib/notifications';
import { Package } from 'lucide-react';
import { offerKeys } from '@/lib/routes/queryKeys';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';

export default function ComercialOrdersManager() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { isMobile, mounted } = useIsMobileSafe();
  const tenantId = getCurrentTenant();
  const canCreateOrder = false;

  const [onCreatingNewOrder, setOnCreatingNewOrder] = useState(false);
  const [isOrderLoading, setIsOrderLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(searchParams.get('orderId'));
  const [searchText, setSearchText] = useState('');
  const [categories, setCategories] = useState(INITIAL_ORDER_CATEGORIES);
  const [viewMode, setViewMode] = useState('normal');

  const debouncedSearchText = useDebounce(searchText, 300);
  const { data: offers } = useOffersList({ perPage: 100 });
  const {
    data: orders = [],
    isLoading: loading,
    errorMessage: ordersError,
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
    () => enrichOrdersWithOffers(orders, offers as never),
    [orders, offers]
  );

  const activeCategory = useMemo(
    () => categories.find((c) => c.current) || categories[0],
    [categories]
  );

  const visibleCategories = useMemo(() => {
    return buildVisibleCommercialOrderCategories(enrichedOrders);
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
    return filterAndSortCommercialOrders(enrichedOrders, {
      searchText: debouncedSearchText,
      activeCategoryName: activeCategory.name,
    });
  }, [enrichedOrders, debouncedSearchText, activeCategory]);

  const reloadOrders = useCallback(() => {
    refetch();
    queryClient.invalidateQueries({ queryKey: offerKeys.listPrefix(tenantId) });
  }, [refetch, queryClient, tenantId]);

  const handleOnChange = useCallback(
    (updatedOrder: unknown = null) => {
      if (updatedOrder) {
        refetch();
      } else {
        reloadOrders();
      }
    },
    [refetch, reloadOrders]
  );

  const handleOnClickCategory = useCallback((categoryName: string) => {
    setSelectedOrder(null);
    setOnCreatingNewOrder(false);
    setCategories((prev) => prev.map((cat) => ({ ...cat, current: cat.name === categoryName })));
  }, []);

  const handleOnChangeSearch = useCallback((value: string) => {
    setOnCreatingNewOrder(false);
    setCategories((prev) => prev.map((cat) => ({ ...cat, current: cat.name === 'all' })));
    setSearchText(value);
    setSelectedOrder(null);
  }, []);

  const handleOnClickAddNewOrder = useCallback(() => {
    if (!canCreateOrder) return;
    setCategories((prev) => prev.map((cat) => ({ ...cat, current: cat.name === 'all' })));
    setSelectedOrder(null);
    setSearchText('');
    setOnCreatingNewOrder(true);
  }, [canCreateOrder]);

  const handleCloseDetail = useCallback(() => {
    setSelectedOrder(null);
    setOnCreatingNewOrder(false);
  }, []);

  const handleOnClickOrderCard = useCallback(
    (orderId: number | string) => {
      setOnCreatingNewOrder(false);
      if (viewMode === 'production') setViewMode('normal');
      setSelectedOrder((prev) => (prev === orderId ? null : String(orderId)));
    },
    [viewMode]
  );

  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => (prev === 'normal' ? 'production' : 'normal'));
    if (viewMode === 'normal') {
      setSelectedOrder(null);
      setOnCreatingNewOrder(false);
    }
  }, [viewMode]);

  const handleOrderLoading = useCallback((value: boolean) => {
    setIsOrderLoading(value);
  }, []);

  const OrdersListContent = useMemo(
    () => (
      <OrdersList
        orders={sortedOrders as unknown as OrderCardOrder[]}
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
        readOnly
        canCreateOrder={canCreateOrder}
        // canExportListData no se pasa a propósito: el default `!readOnly` de OrdersList
        // lo deja en false para comercial hasta confirmar que el xlsx no expone coste/margen
        // (GAP-V2-056).
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
            canViewCostData={false}
          />
        </div>
      );
    }
    return (
      <Card className="flex h-full flex-col p-4 sm:p-7">
        <EmptyState
          title="Seleccione un pedido"
          description="Selecciona un pedido para ver los detalles."
          icon={<Package />}
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
