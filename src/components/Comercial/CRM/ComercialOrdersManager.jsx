'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import OrdersList from '@/components/Admin/OrdersManager/OrdersList';
import Order from '@/components/Admin/OrdersManager/Order';
import CreateOrderForm from '@/components/Admin/OrdersManager/CreateOrderForm';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/Utilities/EmptyState';
import { useDebounce } from '@/hooks/useDebounce';
import { useIsMobile } from '@/hooks/use-mobile';
import { useComercialOrders } from '@/hooks/useComercialOrders';
import { useOffersList } from '@/hooks/useOffers';

const initialCategories = [
  { label: 'Todos', name: 'all', current: true },
  { label: 'En producción', name: 'pending', current: false },
  { label: 'Terminados', name: 'finished', current: false },
];

function enrichOrdersWithOffers(orders, offers) {
  const offerByOrderId = new Map((offers ?? []).filter((offer) => offer.orderId != null).map((offer) => [String(offer.orderId), offer]));

  return orders.map((order) => {
    if (order.offerId) return order;
    const linkedOffer = offerByOrderId.get(String(order.id));
    return linkedOffer ? { ...order, offerId: linkedOffer.id } : order;
  });
}

export default function ComercialOrdersManager() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [onCreatingNewOrder, setOnCreatingNewOrder] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(searchParams.get('orderId'));
  const [searchText, setSearchText] = useState('');
  const [categories, setCategories] = useState(initialCategories);
  const activeCategory = categories.find((item) => item.current)?.name ?? 'all';
  const debouncedSearchText = useDebounce(searchText, 300);
  const { data: offers } = useOffersList({ perPage: 100 });
  const { data: orders = [], isLoading, error, refetch } = useComercialOrders({ perPage: 100 });

  useEffect(() => {
    const orderId = searchParams.get('orderId');
    if (orderId) {
      setSelectedOrder(orderId);
    }
  }, [searchParams]);

  const enrichedOrders = useMemo(() => enrichOrdersWithOffers(orders, offers), [orders, offers]);

  const filteredOrders = useMemo(() => {
    return enrichedOrders
      .filter((order) => {
        const matchesSearch = !debouncedSearchText
          || order.customer?.name?.toLowerCase().includes(debouncedSearchText.toLowerCase())
          || String(order.id).includes(debouncedSearchText);
        const matchesCategory = activeCategory === 'all' ? true : order.status === activeCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => new Date(a.loadDate) - new Date(b.loadDate));
  }, [activeCategory, debouncedSearchText, enrichedOrders]);

  const handleOnChange = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['crm', 'offers', 'list'] });
  };

  return (
    <div className="flex h-full flex-col gap-4 px-4 py-3 md:px-6">
      <div>
        <h1 className="text-3xl font-light">Mis pedidos</h1>
        <p className="text-sm text-muted-foreground">Reutiliza el gestor de pedidos actual con detalle en modo solo lectura.</p>
      </div>

      <div className="flex-1 min-h-0">
        {isMobile ? (
          onCreatingNewOrder ? (
            <CreateOrderForm
              onCreate={(newOrderId) => {
                setOnCreatingNewOrder(false);
                setSelectedOrder(newOrderId);
                refetch();
              }}
              onClose={() => setOnCreatingNewOrder(false)}
            />
          ) : selectedOrder ? (
            <Order
              orderId={selectedOrder}
              onChange={handleOnChange}
              onClose={() => setSelectedOrder(null)}
              readOnly
            />
          ) : (
            <OrdersList
              orders={filteredOrders}
              categories={categories}
              totalActiveOrders={filteredOrders.length}
              visibleCategories={categories}
              onClickCategory={(categoryName) => setCategories((current) => current.map((item) => ({ ...item, current: item.name === categoryName })))}
              onChangeSearch={setSearchText}
              searchText={searchText}
              onClickOrderCard={setSelectedOrder}
              onClickAddNewOrder={() => setOnCreatingNewOrder(true)}
              error={error}
              onRetry={refetch}
              selectedOrderId={selectedOrder}
              viewMode="normal"
              onToggleViewMode={() => {}}
            />
          )
        ) : (
          <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
            <Card className="min-h-0 overflow-hidden">
              <OrdersList
                orders={filteredOrders}
                categories={categories}
                totalActiveOrders={filteredOrders.length}
                visibleCategories={categories}
                onClickCategory={(categoryName) => setCategories((current) => current.map((item) => ({ ...item, current: item.name === categoryName })))}
                onChangeSearch={setSearchText}
                searchText={searchText}
                onClickOrderCard={setSelectedOrder}
                onClickAddNewOrder={() => setOnCreatingNewOrder(true)}
                error={error}
                onRetry={refetch}
                selectedOrderId={selectedOrder}
                viewMode="normal"
                onToggleViewMode={() => {}}
              />
            </Card>

            {onCreatingNewOrder ? (
              <Card className="min-h-0 overflow-auto p-4">
                <CreateOrderForm
                  onCreate={(newOrderId) => {
                    setOnCreatingNewOrder(false);
                    setSelectedOrder(newOrderId);
                    refetch();
                  }}
                  onClose={() => setOnCreatingNewOrder(false)}
                />
              </Card>
            ) : selectedOrder ? (
              <Order orderId={selectedOrder} onChange={handleOnChange} readOnly />
            ) : (
              <Card className="flex items-center justify-center">
                <EmptyState
                  title="Selecciona un pedido"
                  description="Aquí se abrirá el detalle del pedido en modo lectura para el rol comercial."
                />
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
