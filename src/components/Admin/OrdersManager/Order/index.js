'use client'

import React, { useEffect, useState, lazy, Suspense, useCallback, useMemo } from 'react'
import { Loader2, MoreVertical, Printer, ThermometerSnowflake, ArrowLeft } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import OrderEditSheet from './OrderEditSheet';
import OrderDetails from './OrderDetails';
import { OrderProvider, useOrderContext } from '@/context/OrderContext';
import toast from 'react-hot-toast';
import { getToastTheme } from '@/customs/reactHotToast';
import OrderSkeleton from './OrderSkeleton';
import { formatDate } from '@/helpers/formats/dates/formatDates';
import { Card } from '@/components/ui/card';
import Loader from '@/components/Utilities/Loader';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useHideBottomNav } from '@/context/BottomNavContext';

// Lazy load de componentes pesados para mejorar el rendimiento inicial
const OrderPallets = lazy(() => import('./OrderPallets'));
const OrderDocuments = lazy(() => import('./OrderDocuments'));
const OrderExport = lazy(() => import('./OrderExport'));
const OrderLabels = lazy(() => import('./OrderLabels'));
const OrderMap = lazy(() => import('./OrderMap'));
const OrderProduction = lazy(() => import('./OrderProduction'));
const OrderProductDetails = lazy(() => import('./OrderProductDetails'));
const OrderPlannedProductDetails = lazy(() => import('./OrderPlannedProductDetails'));
const OrderIncident = lazy(() => import('./OrderIncident'));
const OrderCustomerHistory = lazy(() => import('./OrderCustomerHistory'));

// Badge reutilizable - movido fuera del componente para evitar recreación
const StatusBadge = ({ color = 'green', label = 'Terminado' }) => {
  const colorVariants = {
    green: {
      bg: 'bg-green-200 dark:bg-green-900',
      text: 'text-green-800 dark:text-green-300',
      border: 'border dark:border-2 border-green-500',
      dot: 'bg-green-500'
    },
    orange: {
      bg: 'bg-orange-200 dark:bg-orange-900',
      text: 'text-orange-800 dark:text-orange-300',
      border: 'border dark:border-2 border-orange-500',
      dot: 'bg-orange-500'
    },
    red: {
      bg: 'bg-red-200 dark:bg-red-900',
      text: 'text-red-800 dark:text-red-300',
      border: 'border dark:border-2 border-red-500',
      dot: 'bg-red-500'
    },
  };

  const { bg, text, border, dot } = colorVariants[color] || colorVariants.green;

  return (
    <span
      className={`inline-flex items-center ${bg} ${text} text-xs font-medium px-2.5 py-0.5 rounded-full ${border}`}
    >
      <span className={`w-2 h-2 me-1 ${dot} rounded-full`} />
      {label}
    </span>
  );
};

// Función helper para obtener la imagen de transporte - optimizada
const getTransportImage = (transportName) => {
  const name = transportName.toLowerCase();
  const transportMap = {
    'olano': '/images/transports/trailer-olano.png',
    'tir': '/images/transports/trailer-tir.png',
    'tpo': '/images/transports/trailer-tpo.png',
    'distran': '/images/transports/trailer-distran.png',
    'narval': '/images/transports/trailer-narval.png',
  };

  for (const [key, value] of Object.entries(transportMap)) {
    if (name.includes(key)) {
      return value;
    }
  }
  
  return '/images/transports/trailer.png';
};

const OrderContent = ({ onLoading, onClose }) => {
  const isMobile = useIsMobile();
  const { order, loading, error, updateOrderStatus, exportDocument, activeTab, setActiveTab, updateTemperatureOrder } = useOrderContext();
  
  // Ocultar bottom navbar en esta pantalla (solo en mobile)
  useHideBottomNav(isMobile);

  useEffect(() => {
    if (!onLoading) return;
    onLoading(loading);
  }, [loading, onLoading])

  // Función para cambiar el estado del pedido - memoizada con useCallback
  const handleStatusChange = useCallback(async (newStatus) => {
    const toastId = toast.loading('Actualizando estado del pedido...', getToastTheme());
    updateOrderStatus(newStatus)
      .then(() => {
        toast.success('Estado del pedido actualizado', { id: toastId, ...getToastTheme() });
      })
      .catch((error) => {
        // Priorizar userMessage sobre message para mostrar errores en formato natural
        const errorMessage = error.userMessage || error.data?.userMessage || error.response?.data?.userMessage || error.message || 'Error al actualizar el estado del pedido';
        toast.error(errorMessage, { id: toastId, ...getToastTheme() });
      });
  }, [updateOrderStatus]);

  // Función para cambiar la temperatura - memoizada con useCallback
  const handleTemperatureChange = useCallback(async (newTemperature) => {
    const toastId = toast.loading('Actualizando temperatura del pedido...', getToastTheme());
    updateTemperatureOrder(newTemperature)
      .then(() => {
        toast.success('Temperatura del pedido actualizada', { id: toastId, ...getToastTheme() });
      })
      .catch((error) => {
        // Priorizar userMessage sobre message para mostrar errores en formato natural
        const errorMessage = error.userMessage || error.data?.userMessage || error.response?.data?.userMessage || error.message || 'Error al actualizar la temperatura del pedido';
        toast.error(errorMessage, { id: toastId, ...getToastTheme() });
      });
  }, [updateTemperatureOrder]);

  // Función para renderizar el badge de estado - memoizada
  const renderStatusBadge = useCallback((status) => {
    const colors = {
      pending: 'orange',
      finished: 'green',
      incident: 'red',
    };

    const statusText = {
      pending: 'En producción',
      finished: 'Terminado',
      incident: 'Incidencia',
    };

    return (
      <DropdownMenu>
        <DropdownMenuTrigger className="focus:outline-none">
          <StatusBadge color={colors[status]} label={statusText[status]} />
        </DropdownMenuTrigger>
        <DropdownMenuContent className=' flex flex-col items-end '>
          <DropdownMenuItem className='cursor-pointer' onClick={() => handleStatusChange('pending')}>
            <StatusBadge color="orange" label="En producción" />
          </DropdownMenuItem>
          <DropdownMenuItem className='cursor-pointer' onClick={() => handleStatusChange('finished')}>
            <StatusBadge color="green" label="Terminado" />
          </DropdownMenuItem>
          <DropdownMenuItem className='cursor-pointer' onClick={() => handleStatusChange('incident')} >
            <StatusBadge color="red" label="Incidencia" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }, [handleStatusChange]);

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
          {/* Header mobile: botón back + título (ID del pedido) */}
          {isMobile && onClose && (
            <div className="bg-background flex-shrink-0 px-0 pt-8 pb-3">
              <div className="relative flex items-center justify-center px-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="absolute left-4 w-12 h-12 rounded-full hover:bg-muted"
                  aria-label="Volver"
                >
                  <ArrowLeft className="h-6 w-6" />
                </Button>
                <h2 className="text-xl font-normal dark:text-white text-center">
                  #{order.id}
                </h2>
                <div className="absolute right-4 w-12 h-12" />
              </div>
            </div>
          )}
          
          {/* Botones móviles - sticky bottom bar */}
          {isMobile && onClose && (
            <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-3 flex gap-2 z-50 lg:hidden shadow-lg" style={{ paddingBottom: `calc(0.75rem + env(safe-area-inset-bottom))` }}>
              <OrderEditSheet />
              <Button variant="outline" onClick={handleOnClickPrint} size="icon" className="w-fit min-h-[44px] min-w-[44px]">
                <Printer className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {isMobile ? (
            <div className="h-full flex flex-col w-full pb-24">
              {/* Vista Mobile: Cabecera centrada y mobile-friendly */}
              <div className='space-y-5 px-4 pt-6 text-center'>
                {/* Nombre del cliente */}
                <div>
                  <p className='text-xl font-semibold'>{order.customer.name}</p>
                  <p className='text-base text-muted-foreground mt-1'>Cliente Nº {order.customer.id}</p>
                </div>
                
                {/* Badge de estado */}
                <div className='flex justify-center'>
                  {order && renderStatusBadge(order.status)}
                </div>
                
                {/* Fecha de Carga y Temperatura en fila */}
                <div className='flex items-center justify-center gap-6 flex-wrap'>
                  <div>
                    <p className='text-sm text-muted-foreground mb-1'>Fecha de Carga</p>
                    <p className='text-lg font-semibold'>{formatDate(order.loadDate)}</p>
                  </div>
                  <div>
                    <p className='text-sm text-muted-foreground mb-1'>Temperatura</p>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="focus:outline-none">
                        <span className='text-lg font-semibold flex gap-1.5 items-center justify-center hover:text-muted-foreground transition-colors'>
                          <ThermometerSnowflake className='h-5 w-5' />
                          {order.temperature || '0'} ºC
                        </span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem className='cursor-pointer' onClick={() => handleTemperatureChange(0)}>
                          0 ºC
                        </DropdownMenuItem>
                        <DropdownMenuItem className='cursor-pointer' onClick={() => handleTemperatureChange(4)}>
                          4 ºC
                        </DropdownMenuItem>
                        <DropdownMenuItem className='cursor-pointer' onClick={() => handleTemperatureChange(-18)}>
                          - 18 ºC
                        </DropdownMenuItem>
                        <DropdownMenuItem className='cursor-pointer' onClick={() => handleTemperatureChange(-23)}>
                          - 23 ºC
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                {/* Transporte */}
                <div className='flex flex-col items-center justify-center gap-2 pt-3 border-t'>
                  <img className="max-w-[170px]" src={transportImage} alt={`Transporte ${order.transport.name}`} />
                  <p className='text-lg font-medium'>{order.transport.name}</p>
                </div>
              </div>
              <div className='flex-1 w-full overflow-y-hidden '>
                {/* Vista Mobile: Acordeones */}
                <ScrollArea className="h-full w-full" style={{ paddingBottom: isMobile ? 'calc(6rem + env(safe-area-inset-bottom))' : '5rem' }}>
                  <div className="px-4 py-4 space-y-2">
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="details">
                        <AccordionTrigger className="text-base font-medium">Detalles</AccordionTrigger>
                        <AccordionContent>
                          <OrderDetails />
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="products">
                        <AccordionTrigger className="text-base font-medium">Previsión</AccordionTrigger>
                        <AccordionContent>
                          <Suspense fallback={<div className="h-32 flex items-center justify-center"><Loader /></div>}>
                            <OrderPlannedProductDetails />
                          </Suspense>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="productDetails">
                        <AccordionTrigger className="text-base font-medium">Detalle productos</AccordionTrigger>
                        <AccordionContent>
                          <Suspense fallback={<div className="h-32 flex items-center justify-center"><Loader /></div>}>
                            <OrderProductDetails />
                          </Suspense>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="production">
                        <AccordionTrigger className="text-base font-medium">Producción</AccordionTrigger>
                        <AccordionContent>
                          <Suspense fallback={<div className="h-32 flex items-center justify-center"><Loader /></div>}>
                            <OrderProduction />
                          </Suspense>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="pallets">
                        <AccordionTrigger className="text-base font-medium">Palets</AccordionTrigger>
                        <AccordionContent>
                          <Suspense fallback={<div className="h-32 flex items-center justify-center"><Loader /></div>}>
                            <OrderPallets />
                          </Suspense>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="labels">
                        <AccordionTrigger className="text-base font-medium">Etiquetas</AccordionTrigger>
                        <AccordionContent>
                          <Suspense fallback={<div className="h-32 flex items-center justify-center"><Loader /></div>}>
                            <OrderLabels />
                          </Suspense>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="documents">
                        <AccordionTrigger className="text-base font-medium">Envío de Documentos</AccordionTrigger>
                        <AccordionContent>
                          <Suspense fallback={<div className="h-32 flex items-center justify-center"><Loader /></div>}>
                            <OrderDocuments />
                          </Suspense>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="export">
                        <AccordionTrigger className="text-base font-medium">Exportar</AccordionTrigger>
                        <AccordionContent>
                          <Suspense fallback={<div className="h-32 flex items-center justify-center"><Loader /></div>}>
                            <OrderExport />
                          </Suspense>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="map">
                        <AccordionTrigger className="text-base font-medium">Mapa</AccordionTrigger>
                        <AccordionContent>
                          <Suspense fallback={<div className="h-32 flex items-center justify-center"><Loader /></div>}>
                            <OrderMap />
                          </Suspense>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="incident">
                        <AccordionTrigger className="text-base font-medium">Incidencia</AccordionTrigger>
                        <AccordionContent>
                          <Suspense fallback={<div className="h-32 flex items-center justify-center"><Loader /></div>}>
                            <OrderIncident />
                          </Suspense>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="customer-history">
                        <AccordionTrigger className="text-base font-medium">Histórico</AccordionTrigger>
                        <AccordionContent>
                          <Suspense fallback={<div className="h-32 flex items-center justify-center"><Loader /></div>}>
                            <OrderCustomerHistory />
                          </Suspense>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </ScrollArea>
              </div>
            </div>
          ) : (
            <Card className="h-full w-full relative p-4 sm:p-6 lg:p-9">
              <div className="h-full flex flex-col w-full pb-16 lg:pb-0">
                {/* Vista Desktop: Estructura original */}
                <div className='flex flex-col sm:flex-row sm:justify-between gap-4 mt-0 sm:-mt-6 lg:-mt-2'>
                    <div className='space-y-1 flex-1'>
                      {order && renderStatusBadge(order.status)}
                      <h3 className='text-lg sm:text-xl font-medium'>#{order.id}</h3>
                      <div className=''>
                        <p className=''>
                          <span className='font-light text-2xl sm:text-3xl'>{order.customer.name}</span> <br />
                          <span className='text-base sm:text-lg font-medium'>Cliente Nº {order.customer.id}</span>
                        </p>
                      </div>
                      <div className=''>
                        <p className='font-medium text-xs text-muted-foreground'>Fecha de Carga:</p>
                        <p className='font-medium text-lg'>{formatDate(order.loadDate)}</p>
                      </div>
                      <div className=''>
                        <p className='font-medium text-xs text-muted-foreground'>Temperatura:</p>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="focus:outline-none">
                            <span className='font-medium text-lg flex gap-1 items-center hover:text-muted-foreground'>
                              <ThermometerSnowflake className='h-5 w-5 inline-block' />
                              {order.temperature || '0'} ºC
                            </span>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className=' '>
                            <DropdownMenuItem className='cursor-pointer' onClick={() => handleTemperatureChange(0)}>
                              0 ºC
                            </DropdownMenuItem>
                            <DropdownMenuItem className='cursor-pointer' onClick={() => handleTemperatureChange(4)}>
                              4 ºC
                            </DropdownMenuItem>
                            <DropdownMenuItem className='cursor-pointer' onClick={() => handleTemperatureChange(-18)}>
                              - 18 ºC
                            </DropdownMenuItem>
                            <DropdownMenuItem className='cursor-pointer' onClick={() => handleTemperatureChange(-23)}>
                              - 23 ºC
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    {/* Botones desktop - ocultos en móvil (se muestran en bottom bar) */}
                    <div className='hidden lg:flex flex-row gap-2 h-fit pt-2'>
                      <div className='flex flex-col max-w-sm justify-end items-end gap-3'>
                        <div className="flex gap-2">
                          <OrderEditSheet />
                          <Button variant="outline" onClick={handleOnClickPrint} >
                            <Printer className="h-4 w-4 mr-2" />
                            Imprimir
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Duplicar pedido</DropdownMenuItem>
                              <DropdownMenuItem>Cancelar pedido</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">Eliminar pedido</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className='flex flex-col items-end justify-center'>
                          <img className="max-w-[240px]" src={transportImage} alt={`Transporte ${order.transport.name}`} />
                          <h3 className='text-3xl font-light'>{order.transport.name}</h3>
                        </div>
                      </div>
                    </div>
                  </div>
                <div className='flex-1 w-full overflow-y-hidden '>
                  {/* Vista Desktop: Tabs (mantener comportamiento actual) */}
                  <div className="container mx-auto py-3 space-y-4 sm:space-y-8 h-full w-full">
                      <Tabs value={activeTab} onValueChange={setActiveTab} className='h-full flex flex-col w-full'>
                        <div className="mb-4 flex justify-start">
                          <TabsList className='w-fit inline-flex'>
                            <TabsTrigger value="details" className="text-xs sm:text-sm whitespace-nowrap">Detalles</TabsTrigger>
                            <TabsTrigger value="products" className="text-xs sm:text-sm whitespace-nowrap">Previsión</TabsTrigger>
                            <TabsTrigger value="productDetails" className="text-xs sm:text-sm whitespace-nowrap">Detalle productos</TabsTrigger>
                            <TabsTrigger value="production" className="text-xs sm:text-sm whitespace-nowrap">Producción</TabsTrigger>
                            <TabsTrigger value="labels" className="text-xs sm:text-sm whitespace-nowrap">Etiquetas</TabsTrigger>
                            <TabsTrigger value="pallets" className="text-xs sm:text-sm whitespace-nowrap">Palets</TabsTrigger>
                            <TabsTrigger value="documents" className="text-xs sm:text-sm whitespace-nowrap">Envio de Documentos</TabsTrigger>
                            <TabsTrigger value="export" className="text-xs sm:text-sm whitespace-nowrap">Exportar</TabsTrigger>
                            <TabsTrigger value="map" className="text-xs sm:text-sm whitespace-nowrap">Mapa</TabsTrigger>
                            <TabsTrigger value="incident" className="text-xs sm:text-sm whitespace-nowrap">Incidencia</TabsTrigger>
                            <TabsTrigger value="customer-history" className="text-xs sm:text-sm whitespace-nowrap">Histórico</TabsTrigger>
                          </TabsList>
                        </div>
                        <div className="flex-1 overflow-y-hidden w-full">
                          {/* Tab Details - siempre cargado ya que es el default */}
                          <TabsContent value="details" className="space-y-4 w-full h-full overflow-y-auto">
                            <OrderDetails />
                          </TabsContent>

                          {/* Tabs con lazy loading - solo se cargan cuando están activos */}
                          <TabsContent value="products" className="space-y-4 w-full h-full ">
                            <Suspense fallback={<div className="h-full flex items-center justify-center"><Loader /></div>}>
                              <OrderPlannedProductDetails />
                            </Suspense>
                          </TabsContent>

                          <TabsContent value="productDetails" className="space-y-4 w-full h-full ">
                            <Suspense fallback={<div className="h-full flex items-center justify-center"><Loader /></div>}>
                              <OrderProductDetails />
                            </Suspense>
                          </TabsContent>

                          <TabsContent value="production" className="space-y-4 w-full h-full ">
                            <Suspense fallback={<div className="h-full flex items-center justify-center"><Loader /></div>}>
                              <OrderProduction />
                            </Suspense>
                          </TabsContent>

                          <TabsContent value="pallets" className='h-full'>
                            <Suspense fallback={<div className="h-full flex items-center justify-center"><Loader /></div>}>
                              <OrderPallets />
                            </Suspense>
                          </TabsContent>

                          <TabsContent value="documents" className='h-full'>
                            <Suspense fallback={<div className="h-full flex items-center justify-center"><Loader /></div>}>
                              <OrderDocuments />
                            </Suspense>
                          </TabsContent>

                          <TabsContent value="export" className='h-full'>
                            <Suspense fallback={<div className="h-full flex items-center justify-center"><Loader /></div>}>
                              <OrderExport />
                            </Suspense>
                          </TabsContent>

                          <TabsContent value="labels" className='h-full'>
                            <Suspense fallback={<div className="h-full flex items-center justify-center"><Loader /></div>}>
                              <OrderLabels />
                            </Suspense>
                          </TabsContent>

                          <TabsContent value="map" className='h-full'>
                            <Suspense fallback={<div className="h-full flex items-center justify-center"><Loader /></div>}>
                              <OrderMap />
                            </Suspense>
                          </TabsContent>

                          <TabsContent value="incident" className='h-full'>
                            <Suspense fallback={<div className="h-full flex items-center justify-center"><Loader /></div>}>
                              <OrderIncident />
                            </Suspense>
                          </TabsContent>

                          <TabsContent value="customer-history" className='h-full'>
                            <Suspense fallback={<div className="h-full flex items-center justify-center"><Loader /></div>}>
                              <OrderCustomerHistory />
                            </Suspense>
                          </TabsContent>

                        </div>
                      </Tabs>
                    </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </>
  )
}


const Order = ({ orderId, onChange, onLoading, onClose }) => {


  return (
    <OrderProvider orderId={orderId} onChange={onChange} >
      <OrderContent onLoading={onLoading} onClose={onClose} />
    </OrderProvider>
  )
}

export default Order




