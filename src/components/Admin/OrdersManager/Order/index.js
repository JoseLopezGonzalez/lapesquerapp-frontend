'use client'

import React, { useEffect, useState, lazy, Suspense, useCallback, useMemo } from 'react'
import { Loader2, MoreVertical, Printer, ThermometerSnowflake, ArrowLeft, ChevronRight, FileText, Package, Boxes, Factory, Tag, FileCheck, Download, MapPin, AlertTriangle, History, Info, Map, Tickets, ListCollapse } from 'lucide-react';
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
import { formatInteger, formatDecimalCurrency } from '@/helpers/formats/numbers/formatNumbers';
import { Card, CardContent } from '@/components/ui/card';
import Loader from '@/components/Utilities/Loader';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useHideBottomNav } from '@/context/BottomNavContext';
import { useBackButton } from '@/hooks/use-back-button';

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
  const [activeSection, setActiveSection] = useState(null);
  
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
          {isMobile ? (
            activeSection === null ? (
              <>
                {/* Header mobile: botón back + título (ID del pedido) - Solo en vista principal */}
                {onClose && (
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
                
                {/* Vista principal del pedido con lista de secciones */}
                <div className="flex-1 flex flex-col w-full min-h-0 overflow-hidden">
                {/* Vista Mobile: Cabecera centrada y mobile-friendly */}
                <div className='space-y-5 px-4 pt-6 text-center flex-shrink-0'>
                  {/* Nombre del cliente */}
                  <div>
                    <p className='text-xl font-semibold'>{order.customer.name}</p>
                    <p className='text-base text-muted-foreground mt-1'>Cliente Nº {order.customer.id}</p>
                  </div>
                  
                  {/* Transporte */}
                  <div className='flex flex-col items-center justify-center gap-2'>
                    <img className="max-w-[170px]" src={transportImage} alt={`Transporte ${order.transport.name}`} />
                    <p className='text-lg font-medium'>{order.transport.name}</p>
                  </div>
                  
                  {/* Badge de estado */}
                  <div className='flex justify-center'>
                    {order && renderStatusBadge(order.status)}
                  </div>
                  
                  {/* Fecha de Carga y Temperatura en primera fila */}
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
                  
                  {/* Palets e Importe en segunda fila */}
                  <div className='flex items-center justify-center gap-6 flex-wrap'>
                    <div>
                      <p className='text-sm text-muted-foreground mb-1'>Palets</p>
                      <p className='text-lg font-semibold'>{order.numberOfPallets ? formatInteger(order.numberOfPallets) : '-'}</p>
                    </div>
                    <div>
                      <p className='text-sm text-muted-foreground mb-1'>Importe</p>
                      <p className='text-lg font-semibold'>{order.totalAmount ? formatDecimalCurrency(order.totalAmount) : '-'}</p>
                    </div>
                  </div>
                </div>
                {/* Lista de secciones */}
                <div className='flex-1 w-full overflow-hidden min-h-0'>
                  <ScrollArea className="h-full w-full">
                    <div className={`px-4 pt-6 ${onClose ? 'pb-24' : 'pb-2'}`} style={onClose ? { paddingBottom: `calc(6rem + env(safe-area-inset-bottom))` } : {}}>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { id: 'details', title: 'Información', component: OrderDetails, icon: Info },
                          { id: 'products', title: 'Previsión', component: OrderPlannedProductDetails, lazy: true, icon: Package },
                          { id: 'productDetails', title: 'Detalle productos', component: OrderProductDetails, lazy: true, icon: ListCollapse },
                          { id: 'production', title: 'Producción', component: OrderProduction, lazy: true, icon: Factory },
                          { id: 'pallets', title: 'Palets', component: OrderPallets, lazy: true, icon: Package },
                          { id: 'labels', title: 'Etiquetas', component: OrderLabels, lazy: true, icon: Tickets },
                          { id: 'documents', title: 'Envío de Documentos', component: OrderDocuments, lazy: true, icon: FileCheck },
                          { id: 'export', title: 'Descargas', component: OrderExport, lazy: true, icon: Download },
                          { id: 'map', title: 'Ruta', component: OrderMap, lazy: true, icon: Map },
                          { id: 'incident', title: 'Incidencia', component: OrderIncident, lazy: true, icon: AlertTriangle },
                          { id: 'customer-history', title: 'Histórico', component: OrderCustomerHistory, lazy: true, icon: History },
                        ].map((section) => {
                          const Icon = section.icon;
                          return (
                            <Card
                              key={section.id}
                              className="cursor-pointer hover:bg-muted/50 transition-colors border"
                              onClick={() => setActiveSection(section.id)}
                            >
                              <CardContent className="p-4 flex flex-col items-center justify-center gap-2">
                                <Icon className="h-5 w-5 text-primary" />
                                <span className="text-sm font-medium text-foreground text-center">{section.title}</span>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  </ScrollArea>
                </div>
                </div>
                
                {/* Botones móviles - sticky bottom bar - Solo en vista principal */}
                {onClose && (
                  <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-3 flex gap-2 z-50 lg:hidden shadow-lg" style={{ paddingBottom: `calc(0.75rem + env(safe-area-inset-bottom))` }}>
                    <OrderEditSheet />
                    <Button variant="outline" onClick={handleOnClickPrint} size="icon" className="w-fit min-h-[44px] min-w-[44px]">
                      <Printer className="h-4 w-4" />
                    </Button>
                  </div>
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
                      {[
                        { id: 'details', title: 'Información' },
                        { id: 'products', title: 'Previsión' },
                        { id: 'productDetails', title: 'Detalle productos' },
                        { id: 'production', title: 'Producción' },
                        { id: 'pallets', title: 'Palets' },
                        { id: 'labels', title: 'Etiquetas' },
                        { id: 'documents', title: 'Envío de Documentos' },
                        { id: 'export', title: 'Descargas' },
                        { id: 'map', title: 'Ruta' },
                        { id: 'incident', title: 'Incidencia' },
                        { id: 'customer-history', title: 'Histórico' },
                      ].find(s => s.id === activeSection)?.title || 'Sección'}
                    </h2>
                    <div className="absolute right-4 w-12 h-12" />
                  </div>
                </div>
                {/* Contenido de la sección */}
                {activeSection === 'map' && isMobile ? (
                  <div className="flex-1 w-full min-h-0 overflow-hidden px-4 py-4 flex flex-col">
                    <Suspense fallback={<div className="h-full flex items-center justify-center"><Loader /></div>}>
                      <OrderMap />
                    </Suspense>
                  </div>
                ) : activeSection === 'customer-history' && isMobile ? (
                  <div className="flex-1 w-full min-h-0 overflow-hidden px-4 py-4 flex flex-col">
                    <Suspense fallback={<div className="h-32 flex items-center justify-center"><Loader /></div>}>
                      <OrderCustomerHistory />
                    </Suspense>
                  </div>
                ) : activeSection === 'export' && isMobile ? (
                  <div className="flex-1 w-full min-h-0 overflow-hidden px-4 py-4 flex flex-col">
                    <Suspense fallback={<div className="flex-1 flex items-center justify-center min-h-0"><Loader /></div>}>
                      <OrderExport />
                    </Suspense>
                  </div>
                ) : activeSection === 'pallets' && isMobile ? (
                  <div className="flex-1 w-full min-h-0 overflow-hidden px-4 py-4 flex flex-col">
                    <Suspense fallback={<div className="flex-1 flex items-center justify-center min-h-0"><Loader /></div>}>
                      <OrderPallets />
                    </Suspense>
                  </div>
                ) : activeSection === 'products' && isMobile ? (
                  <div className="flex-1 w-full min-h-0 overflow-hidden px-4 py-4 flex flex-col">
                    <Suspense fallback={<div className="flex-1 flex items-center justify-center min-h-0"><Loader /></div>}>
                      <OrderPlannedProductDetails />
                    </Suspense>
                  </div>
                ) : activeSection === 'documents' && isMobile ? (
                  <div className="flex-1 w-full min-h-0 overflow-hidden px-4 py-4 flex flex-col">
                    <Suspense fallback={<div className="flex-1 flex items-center justify-center min-h-0"><Loader /></div>}>
                      <OrderDocuments />
                    </Suspense>
                  </div>
                ) : activeSection === 'details' && isMobile ? (
                  <div className="flex-1 w-full min-h-0 overflow-hidden px-4 py-4 flex flex-col">
                    <ScrollArea className="flex-1 min-h-0">
                      <OrderDetails />
                    </ScrollArea>
                  </div>
                ) : activeSection === 'productDetails' && isMobile ? (
                  <div className="flex-1 w-full min-h-0 overflow-hidden px-4 py-4 flex flex-col">
                    <Suspense fallback={<div className="h-full flex items-center justify-center"><Loader /></div>}>
                      <OrderProductDetails />
                    </Suspense>
                  </div>
                ) : activeSection === 'production' && isMobile ? (
                  <div className="flex-1 w-full min-h-0 overflow-hidden px-4 py-4 flex flex-col">
                    <Suspense fallback={<div className="h-full flex items-center justify-center"><Loader /></div>}>
                      <OrderProduction />
                    </Suspense>
                  </div>
                ) : activeSection === 'labels' && isMobile ? (
                  <div className="flex-1 w-full min-h-0 overflow-hidden px-4 py-4 flex flex-col">
                    <Suspense fallback={<div className="h-full flex items-center justify-center"><Loader /></div>}>
                      <OrderLabels />
                    </Suspense>
                  </div>
                ) : activeSection === 'export' && isMobile ? (
                  <div className="flex-1 w-full min-h-0 overflow-hidden px-4 py-4 flex flex-col">
                    <Suspense fallback={<div className="h-full flex items-center justify-center"><Loader /></div>}>
                      <OrderExport />
                    </Suspense>
                  </div>
                ) : (
                  <ScrollArea className="flex-1 w-full min-h-0" style={{ paddingBottom: isMobile ? 'calc(6rem + env(safe-area-inset-bottom))' : '5rem' }}>
                    <div className="px-4 py-4">
                      {activeSection === 'details' && <OrderDetails />}
                      {activeSection === 'productDetails' && (
                        <Suspense fallback={<div className="h-32 flex items-center justify-center"><Loader /></div>}>
                          <OrderProductDetails />
                        </Suspense>
                      )}
                      {activeSection === 'production' && (
                        <Suspense fallback={<div className="h-32 flex items-center justify-center"><Loader /></div>}>
                          <OrderProduction />
                        </Suspense>
                      )}
                      {activeSection === 'labels' && (
                        <Suspense fallback={<div className="h-32 flex items-center justify-center"><Loader /></div>}>
                          <OrderLabels />
                        </Suspense>
                      )}
                      {activeSection === 'map' && (
                        <Suspense fallback={<div className="h-32 flex items-center justify-center"><Loader /></div>}>
                          <OrderMap />
                        </Suspense>
                      )}
                      {activeSection === 'incident' && (
                        <Suspense fallback={<div className="h-32 flex items-center justify-center"><Loader /></div>}>
                          <OrderIncident />
                        </Suspense>
                      )}
                    </div>
                  </ScrollArea>
                )}
              </div>
            )
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
                      <TabsTrigger value="details" className="text-xs sm:text-sm whitespace-nowrap">Información</TabsTrigger>
                      <TabsTrigger value="products" className="text-xs sm:text-sm whitespace-nowrap">Previsión</TabsTrigger>
                      <TabsTrigger value="productDetails" className="text-xs sm:text-sm whitespace-nowrap">Detalle productos</TabsTrigger>
                      <TabsTrigger value="production" className="text-xs sm:text-sm whitespace-nowrap">Producción</TabsTrigger>
                      <TabsTrigger value="labels" className="text-xs sm:text-sm whitespace-nowrap">Etiquetas</TabsTrigger>
                      <TabsTrigger value="pallets" className="text-xs sm:text-sm whitespace-nowrap">Palets</TabsTrigger>
                      <TabsTrigger value="documents" className="text-xs sm:text-sm whitespace-nowrap">Envio de Documentos</TabsTrigger>
                      <TabsTrigger value="export" className="text-xs sm:text-sm whitespace-nowrap">Descargas</TabsTrigger>
                      <TabsTrigger value="map" className="text-xs sm:text-sm whitespace-nowrap">Ruta</TabsTrigger>
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




