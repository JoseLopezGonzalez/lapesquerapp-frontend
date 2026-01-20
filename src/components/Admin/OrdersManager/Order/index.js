'use client'

import React, { useEffect, useState, lazy, Suspense, useCallback, useMemo } from 'react'
import { Loader2, MoreVertical, Printer, ThermometerSnowflake, ArrowLeft } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
        <Card className='p-4 sm:p-6 lg:p-9 h-full w-full relative'>
          {/* Botones móviles - sticky bottom bar */}
          {isMobile && onClose && (
            <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-3 flex gap-2 z-50 lg:hidden shadow-lg">
              <Button variant="outline" onClick={onClose} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <OrderEditSheet />
              <Button variant="outline" onClick={handleOnClickPrint} size="icon">
                <Printer className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className='h-full flex flex-col w-full pb-16 lg:pb-0'>
            <div className='flex flex-col sm:flex-row sm:justify-between gap-4 mt-0 sm:-mt-6 lg:-mt-2'>
              <div className='space-y-1 flex-1'>
                {order && renderStatusBadge(order.status)}

                {/* {order.status === 'pending' && (
                  <span className="inline-flex items-center bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-orange-900 dark:text-orange-300 dark:border-orange-300 border-2">
                    <span className="me-1 relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                    </span>
                    En producción
                  </span>)
                }
                {order.status === 'finished' && (
                  <span className="inline-flex items-center bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-green-900 dark:border-green-500 border-2 dark:text-green-300">
                    <span className="w-2 h-2 me-1 bg-green-500 rounded-full"></span>
                    Terminado
                  </span>)
                } */}
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
                    <img className="max-w-[120px]" src={transportImage} alt={`Transporte ${order.transport.name}`} />
                    <h3 className='text-xl sm:text-2xl font-light'>{order.transport.name}</h3>
                  </div>
                </div>
              </div>
              
              {/* Imagen de transporte en móvil (opcional, más compacta) */}
              {isMobile && (
                <div className='flex flex-col items-start sm:items-end justify-center mt-2 sm:mt-0'>
                  <img className="max-w-[100px] sm:max-w-[120px]" src={transportImage} alt={`Transporte ${order.transport.name}`} />
                  <h3 className='text-lg sm:text-xl font-light'>{order.transport.name}</h3>
                </div>
              )}
            </div>
            <div className='flex-1 w-full overflow-y-hidden '>
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
                      <Suspense fallback={<Loader />}>
                        <OrderPlannedProductDetails />
                      </Suspense>
                    </TabsContent>

                    <TabsContent value="productDetails" className="space-y-4 w-full h-full ">
                      <Suspense fallback={<Loader />}>
                        <OrderProductDetails />
                      </Suspense>
                    </TabsContent>

                    <TabsContent value="production" className="space-y-4 w-full h-full ">
                      <Suspense fallback={<Loader />}>
                        <OrderProduction />
                      </Suspense>
                    </TabsContent>

                    <TabsContent value="pallets" className='h-full'>
                      <Suspense fallback={<Loader />}>
                        <OrderPallets />
                      </Suspense>
                    </TabsContent>

                    <TabsContent value="documents" className='h-full'>
                      <Suspense fallback={<Loader />}>
                        <OrderDocuments />
                      </Suspense>
                    </TabsContent>

                    <TabsContent value="export" className='h-full'>
                      <Suspense fallback={<Loader />}>
                        <OrderExport />
                      </Suspense>
                    </TabsContent>

                    <TabsContent value="labels" className='h-full'>
                      <Suspense fallback={<Loader />}>
                        <OrderLabels />
                      </Suspense>
                    </TabsContent>

                    <TabsContent value="map" className='h-full'>
                      <Suspense fallback={<Loader />}>
                        <OrderMap />
                      </Suspense>
                    </TabsContent>

                    <TabsContent value="incident" className='h-full'>
                      <Suspense fallback={<Loader />}>
                        <OrderIncident />
                      </Suspense>
                    </TabsContent>

                    <TabsContent value="customer-history" className='h-full'>
                      <Suspense fallback={<Loader />}>
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




