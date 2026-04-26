'use client'

import React, { useEffect, useState, Suspense, useCallback, useMemo } from 'react'
import { ArrowLeft, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import OrderEditSheet from './OrderEditSheet';
import { OrderProvider, useOrderContext } from '@/context/OrderContext';
import OrderSkeleton from './OrderSkeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Loader from '@/components/Utilities/Loader';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useHideBottomNav } from '@/context/BottomNavContext';
import { useBackButton } from '@/hooks/use-back-button';
import { SECTIONS_CONFIG } from './config/sectionsConfig';
import { getTransportImage } from './utils/getTransportImage';
import OrderHeaderMobile from './components/OrderHeaderMobile';
import OrderSummaryMobile from './components/OrderSummaryMobile';
import OrderSectionList from './components/OrderSectionList';
import OrderStatusDropdown from './components/OrderStatusDropdown';
import OrderTemperatureDropdown from './components/OrderTemperatureDropdown';
import OrderHeaderDesktop from './components/OrderHeaderDesktop';
import OrderTabsDesktop from './components/OrderTabsDesktop';
import { notify } from '@/lib/notifications';
import OrderSectionContentMobile from './components/OrderSectionContentMobile';
import { getBlockedOrderSectionsForReadOnly, isOrderPalletsReadOnly } from '@/lib/orders/orderReadOnlyPermissions';

const OrderContent = ({ onLoading, onClose, readOnly = false }) => {
  const isMobile = useIsMobile();
  const { order, loading, error, updateOrderStatus, exportDocument, activeTab, setActiveTab, updateTemperatureOrder } = useOrderContext();
  const [activeSection, setActiveSection] = useState(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  
  // Ocultar bottom navbar en esta pantalla (solo en mobile)
  useHideBottomNav(isMobile);

  // Interceptar botón back del navegador/dispositivo
  // Si estamos en una sección, volver a la vista principal
  // Si estamos en la vista principal y hay onClose, ejecutar onClose
  useBackButton(() => {
    if (activeSection !== null) {
      setActiveSection(null);
    } else if (onClose) {
      onClose();
    }
  }, isMobile && (activeSection !== null || onClose));

  useEffect(() => {
    if (!onLoading) return;
    onLoading(loading);
  }, [loading, onLoading])

  // Lógica de negocio (comercial + pedido en curso):
  // cuando el pedido está en "en producción" (pending) ocultar secciones sensibles:
  // - Etiquetas
  // - Envío de Documentos
  // - Incidencia
  const commercialInProgressBlockedTabIds = getBlockedOrderSectionsForReadOnly({
    readOnly,
    status: order?.status,
  });

  const palletsReadOnly = isOrderPalletsReadOnly({
    readOnly,
    status: order?.status,
  });

  useEffect(() => {
    if (commercialInProgressBlockedTabIds.length === 0) return;
    if (!commercialInProgressBlockedTabIds.includes(activeTab)) return;
    // Volver a una sección permitida para evitar que quede una vista vacía
    setActiveTab('details');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commercialInProgressBlockedTabIds, activeTab, setActiveTab]);

  // Refuerzo en móvil: si se intenta entrar a una sección bloqueada vía navegación,
  // redirigir a "details" para que no se renderice.
  useEffect(() => {
    if (!activeSection) return;
    if (commercialInProgressBlockedTabIds.length === 0) return;
    if (!commercialInProgressBlockedTabIds.includes(activeSection)) return;
    setActiveSection('details');
  }, [activeSection, commercialInProgressBlockedTabIds]);

  // Función para cambiar el estado del pedido - memoizada con useCallback
  const handleStatusChange = useCallback(async (newStatus) => {
    await notify.promise(updateOrderStatus(newStatus), {
      loading: 'Actualizando estado del pedido...',
      success: 'Estado del pedido actualizado',
      error: (error) =>
        error?.userMessage || error?.data?.userMessage || error?.response?.data?.userMessage || error?.message || 'Error al actualizar el estado del pedido',
    });
  }, [updateOrderStatus]);

  // Función para cambiar la temperatura - memoizada con useCallback
  const handleTemperatureChange = useCallback(async (newTemperature) => {
    await notify.promise(updateTemperatureOrder(newTemperature), {
      loading: 'Actualizando temperatura del pedido...',
      success: 'Temperatura del pedido actualizada',
      error: (error) =>
        error?.userMessage || error?.data?.userMessage || error?.response?.data?.userMessage || error?.message || 'Error al actualizar la temperatura del pedido',
    });
  }, [updateTemperatureOrder]);

  // Memoizar imagen de transporte
  const transportImage = useMemo(() => {
    return order?.transport?.name ? getTransportImage(order.transport.name) : '/images/transports/trailer.png';
  }, [order?.transport?.name]);

  const handleOnClickPrint = useCallback(async () => {
    exportDocument('order-sheet', 'pdf', 'Hoja de pedido')
  }, [exportDocument])

  return (
    <>
      {loading ? (
        <div className="w-full h-full flex items-center justify-center">
          <Loader />
        </div>
      ) : (
        <div className="w-full h-full flex flex-col relative">
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
                
                {/* Vista principal del pedido con lista de secciones */}
                <div className="flex-1 flex flex-col w-full min-h-0 overflow-hidden">
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
                  blockedTabIds={commercialInProgressBlockedTabIds}
                />
                </div>

                {/* Sheet de edición controlado desde menú ⋮ (mobile): sin barra inferior para pantalla más limpia */}
                {onClose && !readOnly && (
                  <OrderEditSheet open={editSheetOpen} onOpenChange={setEditSheetOpen} />
                )}
              </>
            ) : (
              /* Vista de sección individual - pantalla completa */
              <div className="h-full flex flex-col w-full">
                {/* Header de sección */}
                <div className="bg-background flex-shrink-0 px-0 pt-8 pb-3">
                  <div className="relative flex items-center justify-center px-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setActiveSection(null)}
                      className="absolute left-4 w-12 h-12 rounded-full hover:bg-muted"
                      aria-label="Volver"
                    >
                      <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <h2 className="text-xl font-normal dark:text-white text-center">
                      {SECTIONS_CONFIG.find(s => s.id === activeSection)?.title || 'Sección'}
                    </h2>
                    <div className="absolute right-4 w-12 h-12" />
                  </div>
                </div>
                <OrderSectionContentMobile activeSection={activeSection} palletsReadOnly={palletsReadOnly} />
              </div>
            )
          ) : (
            <Card className="h-full w-full relative">
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
              <CardContent className="flex-1 min-h-0 flex flex-col py-0">
                <div className="h-full flex flex-col w-full pb-16 lg:pb-0">
                    <OrderTabsDesktop
                      activeTab={activeTab}
                      onTabChange={setActiveTab}
                      blockedTabIds={commercialInProgressBlockedTabIds}
                      palletsReadOnly={palletsReadOnly}
                    />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </>
  )
}


const Order = ({ orderId, onChange, onLoading, onClose, readOnly = false }) => {


  return (
    <OrderProvider orderId={orderId} onChange={onChange} >
      <OrderContent onLoading={onLoading} onClose={onClose} readOnly={readOnly} />
    </OrderProvider>
  )
}

export default Order

