'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import OrderEditSheet from './OrderEditSheet';
import { OrderProvider, useOrderContext } from '@/context/OrderContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useHideBottomNav } from '@/context/BottomNavContext';
import { useBackButton } from '@/hooks/use-back-button';
import { SECTIONS_CONFIG } from './config/sectionsConfig';
import { getTransportImage } from './utils/getTransportImage';
import OrderHeaderMobile from './components/OrderHeaderMobile';
import OrderSummaryMobile from './components/OrderSummaryMobile';
import OrderSectionList from './components/OrderSectionList';
import OrderHeaderDesktop from './components/OrderHeaderDesktop';
import OrderTabsDesktop from './components/OrderTabsDesktop';
import { notify } from '@/lib/notifications';
import OrderSectionContentMobile from './components/OrderSectionContentMobile';
import {
  getBlockedOrderSectionsForReadOnly,
  isOrderPalletsReadOnly,
} from '@/lib/orders/orderReadOnlyPermissions';
import type { Order as OrderType } from '@/services/orderService';

interface OrderContentProps {
  onLoading?: (loading: boolean) => void;
  onClose?: () => void;
  readOnly?: boolean;
}

const OrderContent = ({ onLoading, onClose, readOnly = false }: OrderContentProps) => {
  const isMobile = useIsMobile();
  const {
    order,
    loading,
    error,
    reload,
    updateOrderStatus,
    exportDocument,
    activeTab,
    setActiveTab,
    updateTemperatureOrder,
  } = useOrderContext() as {
    order: OrderType | null;
    loading: boolean;
    error: unknown;
    reload: () => Promise<OrderType | null>;
    updateOrderStatus: (status: number) => Promise<unknown>;
    exportDocument: (type: string, format: string, name: string) => void;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    updateTemperatureOrder: (temp: unknown) => Promise<unknown>;
  };
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);

  useHideBottomNav(isMobile);

  useBackButton(
    () => {
      if (activeSection !== null) {
        setActiveSection(null);
      } else if (onClose) {
        onClose();
      }
    },
    isMobile && (activeSection !== null || !!onClose)
  );

  useEffect(() => {
    if (!onLoading) return;
    onLoading(loading);
  }, [loading, onLoading]);

  const commercialInProgressBlockedTabIds = getBlockedOrderSectionsForReadOnly({
    readOnly,
    status: order?.status as string | undefined,
  });

  const palletsReadOnly = isOrderPalletsReadOnly({
    readOnly,
    status: order?.status as string | undefined,
  });

  useEffect(() => {
    if (commercialInProgressBlockedTabIds.length === 0) return;
    if (!commercialInProgressBlockedTabIds.includes(activeTab)) return;
    setActiveTab('details');
  }, [commercialInProgressBlockedTabIds, activeTab, setActiveTab]);

  useEffect(() => {
    if (!activeSection) return;
    if (commercialInProgressBlockedTabIds.length === 0) return;
    if (!commercialInProgressBlockedTabIds.includes(activeSection)) return;
    setActiveSection('details');
  }, [activeSection, commercialInProgressBlockedTabIds]);

  const handleStatusChange = useCallback(
    async (newStatus: number) => {
      await notify.promise(updateOrderStatus(newStatus), {
        loading: 'Actualizando estado del pedido...',
        success: 'Estado del pedido actualizado',
        error: (err: unknown) => {
          const e = err as Record<string, unknown>;
          return (
            (e?.userMessage as string) ||
            (e?.message as string) ||
            'Error al actualizar el estado del pedido'
          );
        },
      });
    },
    [updateOrderStatus]
  );

  const handleTemperatureChange = useCallback(
    async (newTemperature: unknown) => {
      await notify.promise(updateTemperatureOrder(newTemperature), {
        loading: 'Actualizando temperatura del pedido...',
        success: 'Temperatura del pedido actualizada',
        error: (err: unknown) => {
          const e = err as Record<string, unknown>;
          return (
            (e?.userMessage as string) ||
            (e?.message as string) ||
            'Error al actualizar la temperatura del pedido'
          );
        },
      });
    },
    [updateTemperatureOrder]
  );

  const transportImage = useMemo(() => {
    return order?.transport
      ? getTransportImage((order.transport as Record<string, unknown>).name as string)
      : '/images/transports/trailer.png';
  }, [order?.transport]);

  const handleOnClickPrint = useCallback(async () => {
    exportDocument('order-sheet', 'pdf', 'Hoja de pedido');
  }, [exportDocument]);

  if (loading) {
    return (
      <div className="flex h-full w-full flex-col gap-4 p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-8 w-full max-w-xs" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-8">
        <p className="text-muted-foreground text-center text-sm">
          {error ? 'Error al cargar el pedido.' : 'Pedido no encontrado.'}
        </p>
        <Button variant="outline" onClick={() => reload()}>
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full flex-col">
      {isMobile ? (
        activeSection === null ? (
          <>
            <OrderHeaderMobile
              order={order}
              onClose={onClose}
              onNavigateSection={setActiveSection}
              onEdit={() => setEditSheetOpen(true)}
              onPrint={handleOnClickPrint}
              readOnly={readOnly}
            />

            <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
              <OrderSummaryMobile
                order={order}
                transportImage={transportImage}
                onStatusChange={handleStatusChange}
                onTemperatureChange={handleTemperatureChange}
                readOnly={readOnly}
              />
              <OrderSectionList
                onSelectSection={setActiveSection}
                hasSafeAreaPadding={!!onClose}
                blockedTabIds={commercialInProgressBlockedTabIds as never[]}
              />
            </div>

            {onClose && !readOnly && (
              <OrderEditSheet open={editSheetOpen} onOpenChange={setEditSheetOpen} />
            )}
          </>
        ) : (
          <div className="flex h-full w-full flex-col">
            <div className="bg-background flex-shrink-0 px-0 pt-8 pb-3">
              <div className="relative flex items-center justify-center px-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setActiveSection(null)}
                  className="hover:bg-muted absolute left-4 h-12 w-12 rounded-full"
                  aria-label="Volver"
                >
                  <ArrowLeft className="h-6 w-6" />
                </Button>
                <h2 className="text-center text-xl font-normal dark:text-white">
                  {SECTIONS_CONFIG.find((s: Record<string, unknown>) => s.id === activeSection)
                    ?.title || 'Sección'}
                </h2>
                <div className="absolute right-4 h-12 w-12" />
              </div>
            </div>
            <OrderSectionContentMobile
              activeSection={activeSection}
              palletsReadOnly={palletsReadOnly}
            />
          </div>
        )
      ) : (
        <Card className="relative h-full w-full">
          <CardHeader>
            <OrderHeaderDesktop
              order={order}
              transportImage={transportImage}
              onStatusChange={handleStatusChange}
              onTemperatureChange={handleTemperatureChange}
              onPrint={handleOnClickPrint}
              readOnly={readOnly}
            />
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col py-0">
            <div className="flex h-full w-full flex-col pb-16 lg:pb-0">
              <OrderTabsDesktop
                activeTab={activeTab}
                onTabChange={setActiveTab}
                blockedTabIds={commercialInProgressBlockedTabIds as never[]}
                palletsReadOnly={palletsReadOnly}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

interface OrderProps {
  orderId: number | string | null | undefined;
  onChange?: (order: OrderType) => void;
  onLoading?: (loading: boolean) => void;
  onClose?: () => void;
  readOnly?: boolean;
}

const Order = ({ orderId, onChange, onLoading, onClose, readOnly = false }: OrderProps) => {
  return (
    <OrderProvider orderId={orderId} onChange={onChange}>
      <OrderContent onLoading={onLoading} onClose={onClose} readOnly={readOnly} />
    </OrderProvider>
  );
};

export default Order;
