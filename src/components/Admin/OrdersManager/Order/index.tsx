'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { AlertCircle, AlertTriangle, ArrowLeft, PackageX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/Utilities/EmptyState';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import OrderEditSheet from './OrderEditSheet';
import { OrderProvider, useOrderContext } from '@/context/OrderContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobileSafe } from '@/hooks/use-mobile';
import { useHideBottomNav } from '@/context/BottomNavContext';
import { useBackButton } from '@/hooks/use-back-button';
import { SECTIONS_CONFIG } from './config/sectionsConfig';
import { getTransportImage } from './utils/getTransportImage';
import OrderHeaderMobile from './components/OrderHeaderMobile';
import OrderSummaryMobile from './components/OrderSummaryMobile';
import OrderSectionGrid from './components/OrderSectionGrid';
import OrderHeaderDesktop from './components/OrderHeaderDesktop';
import OrderTabsDesktop from './components/OrderTabsDesktop';
import { notify } from '@/lib/notifications';
import OrderSectionContentMobile from './components/OrderSectionContentMobile';
import {
  getBlockedOrderSectionsForReadOnly,
  isOrderPalletsReadOnly,
} from '@/lib/orders/orderReadOnlyPermissions';
import type { Order as OrderType, OrderStatus } from '@/services/orderService';
import type { MergedOrderProductDetail } from '@/hooks/useOrder';

interface OrderContentProps {
  onLoading?: (loading: boolean) => void;
  onClose?: () => void;
  readOnly?: boolean;
  canViewCostData?: boolean;
}

const OrderContent = ({
  onLoading,
  onClose,
  readOnly = false,
  canViewCostData = true,
}: OrderContentProps) => {
  const { isMobile, mounted } = useIsMobileSafe();
  const {
    order,
    loading,
    error,
    reload,
    updateOrderStatus,
    mergedProductDetails,
    exportDocument,
    activeTab,
    setActiveTab,
    updateTemperatureOrder,
  } = useOrderContext();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [pendingFinishedStatus, setPendingFinishedStatus] = useState<OrderStatus | null>(null);

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

  const commercialInProgressBlockedTabIds = useMemo(
    () =>
      getBlockedOrderSectionsForReadOnly({
        readOnly,
        status: order?.status as string | undefined,
      }),
    [readOnly, order?.status]
  );

  const blockedTabIds = useMemo(
    () => [...commercialInProgressBlockedTabIds, ...(!canViewCostData ? ['analysis'] : [])],
    [commercialInProgressBlockedTabIds, canViewCostData]
  );

  const palletsReadOnly = isOrderPalletsReadOnly({
    readOnly,
    status: order?.status as string | undefined,
  });

  useEffect(() => {
    if (blockedTabIds.length === 0) return;
    if (!blockedTabIds.includes(activeTab)) return;
    setActiveTab('details');
  }, [blockedTabIds, activeTab, setActiveTab]);

  useEffect(() => {
    if (!activeSection) return;
    if (blockedTabIds.length === 0) return;
    if (!blockedTabIds.includes(activeSection)) return;
    setActiveSection('details');
  }, [activeSection, blockedTabIds]);

  const incompleteProductionLines = useMemo(
    () =>
      // Regla de negocio: finalizar con lineas pendientes/no planificadas exige confirmacion explicita.
      mergedProductDetails.filter((detail) =>
        ['pending', 'noPlanned'].includes(detail.status)
      ) as MergedOrderProductDetail[],
    [mergedProductDetails]
  );

  const updateStatusWithNotification = useCallback(
    async (newStatus: OrderStatus) => {
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

  const handleStatusChange = useCallback(
    async (newStatus: OrderStatus) => {
      if (newStatus === 'finished' && incompleteProductionLines.length > 0) {
        setPendingFinishedStatus(newStatus);
        return;
      }

      await updateStatusWithNotification(newStatus);
    },
    [incompleteProductionLines.length, updateStatusWithNotification]
  );

  const handleConfirmFinishedStatus = useCallback(async () => {
    if (!pendingFinishedStatus) return;
    const statusToApply = pendingFinishedStatus;
    setPendingFinishedStatus(null);
    await updateStatusWithNotification(statusToApply);
  }, [pendingFinishedStatus, updateStatusWithNotification]);

  const handleCancelFinishedStatus = useCallback(() => {
    setPendingFinishedStatus(null);
  }, []);

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
    return isMobile ? <OrderMobileSkeleton /> : <OrderDesktopSkeleton />;
  }

  if (!order) {
    if (error) {
      return (
        <EmptyState
          className="bg-muted/30 h-full w-full"
          icon={<AlertCircle className="text-red-500" />}
          title="Error al cargar el pedido"
          description="No se pudo obtener la información del pedido. Revisa la conexión e inténtalo de nuevo."
          button={{ name: 'Reintentar', onClick: () => reload() }}
        />
      );
    }

    return (
      <EmptyState
        className="bg-muted/30 h-full w-full"
        icon={<PackageX />}
        title="Pedido no encontrado"
        description="El pedido no existe o ya no está disponible en el listado."
      />
    );
  }

  if (!mounted) return null;

  return (
    <div className="relative flex h-full w-full flex-col">
      <AlertDialog
        open={pendingFinishedStatus === 'finished'}
        onOpenChange={(open) => {
          if (!open) handleCancelFinishedStatus();
        }}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-amber-50 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
            </AlertDialogMedia>
            <AlertDialogTitle>Finalizar pedido con producción pendiente</AlertDialogTitle>
            <AlertDialogDescription>
              Hay líneas sin cobertura completa de producción. Revisa el pedido antes de finalizarlo
              o confirma la transición si es intencionada.
            </AlertDialogDescription>
            <ul className="bg-muted/30 text-foreground max-h-40 space-y-2 overflow-y-auto rounded-md border p-3 text-left text-xs">
              {incompleteProductionLines.slice(0, 5).map((detail, index) => {
                const productName =
                  typeof detail.product?.name === 'string'
                    ? detail.product.name
                    : `Producto ${detail.product?.id ?? index + 1}`;
                const statusLabel = detail.status === 'noPlanned' ? 'No planificado' : 'Pendiente';

                return (
                  <li key={`${detail.product?.id ?? productName}-${index}`}>
                    <span className="font-medium">{productName}</span>
                    <span className="text-muted-foreground">
                      {' '}
                      - {statusLabel}. Planificado: {detail.plannedQuantity} kg; producido:{' '}
                      {detail.productionQuantity} kg.
                    </span>
                  </li>
                );
              })}
              {incompleteProductionLines.length > 5 && (
                <li className="text-muted-foreground">
                  Y {incompleteProductionLines.length - 5} línea
                  {incompleteProductionLines.length - 5 === 1 ? '' : 's'} más.
                </li>
              )}
            </ul>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelFinishedStatus}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmFinishedStatus}>
              Finalizar igualmente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {isMobile ? (
        activeSection === null ? (
          <>
            <OrderMobileOverview
              order={order}
              transportImage={transportImage}
              onClose={onClose}
              onEdit={() => setEditSheetOpen(true)}
              onStatusChange={handleStatusChange}
              onTemperatureChange={handleTemperatureChange}
              onSelectSection={setActiveSection}
              onPrint={handleOnClickPrint}
              readOnly={readOnly}
              blockedTabIds={blockedTabIds}
              productDetailsCount={mergedProductDetails.length}
              pendingProductionCount={incompleteProductionLines.length}
            />

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
                  {SECTIONS_CONFIG.find((s) => s.id === activeSection)?.title || 'Sección'}
                </h2>
                <div className="absolute right-4 h-12 w-12" />
              </div>
            </div>
            <OrderSectionContentMobile
              activeSection={activeSection}
              palletsReadOnly={palletsReadOnly}
              canViewCostData={canViewCostData}
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
                blockedTabIds={blockedTabIds as never[]}
                palletsReadOnly={palletsReadOnly}
                canViewCostData={canViewCostData}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

interface OrderMobileOverviewProps {
  order: OrderType;
  transportImage: string;
  onClose?: () => void;
  onEdit: () => void;
  onStatusChange: (status: OrderStatus) => void;
  onTemperatureChange: (temperature: number) => void;
  onSelectSection: (sectionId: string) => void;
  onPrint: () => void;
  readOnly: boolean;
  blockedTabIds: string[];
  productDetailsCount: number;
  pendingProductionCount: number;
}

function OrderMobileOverview({
  order,
  transportImage,
  onClose,
  onEdit,
  onStatusChange,
  onTemperatureChange,
  onSelectSection,
  onPrint,
  readOnly,
  blockedTabIds,
  productDetailsCount,
  pendingProductionCount,
}: OrderMobileOverviewProps) {
  return (
    <div className="order-mobile-overview-scroll min-h-0 w-full flex-1 overflow-y-auto">
      <div className="sticky top-0 z-20">
        <OrderHeaderMobile
          order={order}
          transportImage={transportImage}
          onClose={onClose}
          onEdit={onEdit}
          readOnly={readOnly}
        />
      </div>

      <div className="relative w-full">
        <div className="from-background pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b to-transparent" />
        <OrderSummaryMobile
          order={order}
          onTemperatureChange={onTemperatureChange}
          readOnly={readOnly}
        />
        <OrderSectionGrid
          order={order}
          onSelectSection={onSelectSection}
          onStatusChange={onStatusChange}
          onPrint={onPrint}
          hasSafeAreaPadding={!!onClose}
          readOnly={readOnly}
          blockedTabIds={blockedTabIds}
          productDetailsCount={productDetailsCount}
          pendingProductionCount={pendingProductionCount}
        />
      </div>
      <style jsx global>{`
        .order-mobile-overview-scroll {
          scroll-timeline-name: --order-mobile-overview;
          scroll-timeline-axis: block;
        }

        .order-mobile-transport {
          animation: order-mobile-transport-collapse linear both;
          animation-timeline: --order-mobile-overview;
          animation-range: 0 72px;
          transform-origin: top center;
        }

        .order-mobile-hero-bg {
          animation: order-mobile-hero-bg-collapse linear both;
          animation-timeline: --order-mobile-overview;
          animation-range: 0 72px;
          transform-origin: top center;
          will-change: transform;
        }

        .order-mobile-status {
          animation: order-mobile-status-reposition linear both;
          animation-timeline: --order-mobile-overview;
          animation-range: 0 72px;
        }

        @keyframes order-mobile-transport-collapse {
          from {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
          to {
            opacity: 0;
            transform: translate3d(0, -14px, 0) scale(0.94);
          }
        }

        @keyframes order-mobile-hero-bg-collapse {
          from {
            transform: scaleY(1);
          }
          to {
            transform: scaleY(0.68);
          }
        }

        @keyframes order-mobile-status-reposition {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(0, -112px, 0);
          }
        }
      `}</style>
    </div>
  );
}

// Silueta mobile: hero (back+título+editar+cliente+estado+transporte) + resumen secundario + grid
function OrderMobileSkeleton() {
  return (
    <div className="relative flex h-full w-full flex-col">
      <div className="bg-muted flex-shrink-0 rounded-br-[50%_40px] rounded-bl-[50%_40px] pt-8 pb-12">
        <div className="relative flex items-center justify-center px-4">
          <Skeleton className="absolute left-4 h-12 w-12 rounded-full" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="absolute right-4 h-12 w-12 rounded-full" />
        </div>
        <div className="mt-5 flex flex-col items-center gap-2 px-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-1 h-7 w-32 rounded-full" />
        </div>
        <div className="mt-3 flex flex-col items-center gap-2">
          <Skeleton className="h-16 w-[170px] rounded-md" />
          <Skeleton className="h-5 w-24" />
        </div>
      </div>
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
        <div className="flex-shrink-0 space-y-4 px-4 pt-5 text-center">
          <div className="flex justify-center gap-6">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
          </div>
          <div className="flex justify-center gap-6">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 px-4 pt-6">
          {[104, 104, 104, 104, 104, 104].map((height, i) => (
            <Skeleton key={i} className="rounded-2xl" style={{ height }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Silueta desktop: Card > CardHeader (dos columnas: info + botones/imagen) > CardContent (tabs + contenido)
function OrderDesktopSkeleton() {
  return (
    <Card className="relative h-full w-full">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-40" />
            <div className="space-y-1 pt-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
          <div className="hidden h-fit flex-col items-end gap-3 pt-2 lg:flex">
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-9" />
            </div>
            <Skeleton className="h-24 w-[240px] rounded-md" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col py-0">
        <div className="mb-4 flex gap-2 overflow-x-auto">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-20 flex-shrink-0 rounded-md" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

interface OrderProps {
  orderId: number | string | null | undefined;
  onChange?: (order: OrderType) => void;
  onLoading?: (loading: boolean) => void;
  onClose?: () => void;
  readOnly?: boolean;
  canViewCostData?: boolean;
}

const Order = ({
  orderId,
  onChange,
  onLoading,
  onClose,
  readOnly = false,
  canViewCostData = true,
}: OrderProps) => {
  return (
    <OrderProvider orderId={orderId} onChange={onChange} canViewCostData={canViewCostData}>
      <OrderContent
        onLoading={onLoading}
        onClose={onClose}
        readOnly={readOnly}
        canViewCostData={canViewCostData}
      />
    </OrderProvider>
  );
};

export default Order;
