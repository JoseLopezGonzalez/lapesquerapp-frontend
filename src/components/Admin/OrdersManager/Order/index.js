'use client'

import React, { useState } from 'react'
import { Loader2, MoreVertical, Printer, ThermometerSnowflake } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import OrderEditSheet from './OrderEditSheet';
import OrderDetails from './OrderDetails';
import OrderPallets from './OrderPallets';
import OrderDocuments from './OrderDocuments';
import OrderExport from './OrderExport';
import OrderLabels from './OrderLabels';
import { OrderProvider, useOrderContext } from '@/context/OrderContext';
import OrderMap from './OrderMap';
import OrderProduction from './OrderProduction';
import OrderProductDetails from './OrderProductDetails';
import OrderPlannedProductDetails from './OrderPlannedProductDetails';
import toast from 'react-hot-toast';
import { darkToastTheme } from '@/customs/reactHotToast';
import OrderSkeleton from './OrderSkeleton';
import { formatDate } from '@/helpers/formats/dates/formatDates';
import OrderIncident from './OrderIncident';
import { Card } from '@/components/ui/card';
import Loader from '@/components/Utilities/Loader';

const OrderContent = () => {

  const { order, loading, error, updateOrderStatus, exportDocument, activeTab, setActiveTab, updateTemperatureOrder } = useOrderContext();

  // Función para cambiar el estado del pedido
  const handleStatusChange = async (newStatus) => {
    const toastId = toast.loading('Actualizando estado del pedido...', darkToastTheme);
    updateOrderStatus(newStatus)
      .then(() => {
        toast.success('Estado del pedido actualizado', { id: toastId, ...darkToastTheme });
      })
      .catch((error) => {
        toast.error(error.message || 'Error al actualizar el estado del pedido', { id: toastId, ...darkToastTheme });
      });
  };

  const handleTemperatureChange = async (newTemperature) => {
    const toastId = toast.loading('Actualizando temperatura del pedido...', darkToastTheme);
    updateTemperatureOrder(newTemperature)
      .then(() => {
        toast.success('Temperatura del pedido actualizada', { id: toastId, ...darkToastTheme });
      })
      .catch((error) => {
        toast.error(error.message || 'Error al actualizar la temperatura del pedido', { id: toastId, ...darkToastTheme });
      });
  };

  // Badge reutilizable con clases ya definidas (seguras para Tailwind)
  const StatusBadge = ({ color = 'green', label = 'Terminado' }) => {
    const colorVariants = {
      green: {
        bg: 'bg-green-100 dark:bg-green-900',
        text: 'text-green-800 dark:text-green-300',
        border: 'border-2 dark:border-green-500',
        dot: 'bg-green-500'
      },
      orange: {
        bg: 'bg-orange-100 dark:bg-orange-900',
        text: 'text-orange-800 dark:text-orange-300',
        border: 'border-2 dark:border-orange-500',
        dot: 'bg-orange-500'
      },
      red: {
        bg: 'bg-red-100 dark:bg-red-900',
        text: 'text-red-800 dark:text-red-300',
        border: 'border-2 dark:border-red-500',
        dot: 'bg-red-500'
      },
      // Puedes añadir más colores aquí
    };

    const { bg, text, border, dot } = colorVariants[color] || colorVariants.green; // Fallback a verde

    return (
      <span
        className={`inline-flex items-center ${bg} ${text} text-xs font-medium px-2.5 py-0.5 rounded-full ${border}`}
      >
        <span className={`w-2 h-2 me-1 ${dot} rounded-full`} />
        {label}
      </span>
    );
  };

  const renderStatusBadge = (status) => {
    const colors = {
      pending: 'orange',
      finished: 'green',
      incident: 'red',
    };

    const statusText = {
      pending: 'En producción',
      finished: 'Terminado',
      incident: 'Incidencia',
      // otros textos
    };

    return (
      <DropdownMenu>
        <DropdownMenuTrigger className="focus:outline-none">
          <StatusBadge color={colors[status]} label={statusText[status]} />
        </DropdownMenuTrigger>
        <DropdownMenuContent className='bg-neutral-950 flex flex-col items-end '>
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
  };

  const handleOnClickPrint = async () => {
    exportDocument('order-sheet', 'pdf', 'Hoja de pedido')
  }

  return (
    <>
      {loading ? (
        <div className="w-full h-full flex items-center justify-center">
          <Loader />
        </div>
      ) : (
        <Card className='p-9 h-full w-full '>
          <div className='h-full flex flex-col'>
            <div className='flex justify-between -mt-6 lg:-mt-2'>
              <div className='space-y-1 '>
                {renderStatusBadge(order.status)} {/* Aquí le pasas el status actual */}

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
                <h3 className='text-xl font-medium text-white'>#{order.id}</h3>
                <div className='text-white'>
                  <p className=''>
                    <span className='font-light text-3xl'>{order.customer.name}</span> <br />
                    <span className='text-lg font-medium'>Cliente Nº {order.customer.id}</span>
                  </p>
                </div>
                <div className='text-white'>
                  <p className='font-medium text-xs text-neutral-300'>Fecha de Carga:</p>
                  <p className='font-medium text-lg'>{formatDate(order.loadDate)}</p>
                </div>
                <div className='text-white'>
                  <p className='font-medium text-xs text-neutral-300'>Temperatura:</p>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="focus:outline-none">
                      <span className='font-medium text-lg flex gap-1 items-center hover:text-neutral-300'>
                        <ThermometerSnowflake className='h-5 w-5 inline-block' />
                        {order.temperature || '0'} ºC

                      </span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className='bg-neutral-950 '>
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
                  <div className='flex flex-col  items-end justify-center'>
                    {order.transport.name.toLowerCase().includes('olano') ? (
                      <img className="" src='/images/transports/trailer-olano.png' />) :
                      order.transport.name.toLowerCase().includes('tir') ? (
                        <img className="" src='/images/transports/trailer-tir.png' />) :
                        order.transport.name.toLowerCase().includes('tpo') ?
                          (<img className="" src='/images/transports/trailer-tpo.png' />) :
                          order.transport.name.toLowerCase().includes('distran') ?
                            (<img className="" src='/images/transports/trailer-distran.png' />)
                            : order.transport.name.toLowerCase().includes('narval') ?
                              (<img className="" src='/images/transports/trailer-narval.png' />)
                              : (
                                <img className="" src='/images/transports/trailer.png' />)
                    }
                    <h3 className='text-2xl font-light text-white'>{order.transport.name}</h3>
                  </div>
                </div>
              </div>
            </div>
            <div className='flex-1 w-full overflow-y-hidden '>
              <div className="container mx-auto py-3 space-y-8 h-full">
                <Tabs value={activeTab} onValueChange={setActiveTab} className='h-full flex flex-col'>
                  <TabsList className='w-fit'>
                    <TabsTrigger value="details">Detalles</TabsTrigger>
                    <TabsTrigger value="products">Previsión</TabsTrigger>
                    <TabsTrigger value="productDetails">Detalle productos</TabsTrigger>
                    <TabsTrigger value="production">Producción</TabsTrigger>
                    <TabsTrigger value="pallets">Palets</TabsTrigger>
                    <TabsTrigger value="documents">Envio de Documentos</TabsTrigger>
                    <TabsTrigger value="export">Exportar</TabsTrigger>
                    <TabsTrigger value="map">Mapa</TabsTrigger>
                    {/* Incident */}
                    <TabsTrigger value="incident">Incidencia</TabsTrigger>
                    {/*  <TabsTrigger value="labels">Etiquetas</TabsTrigger> */}
                  </TabsList>
                  <div className="flex-1 overflow-y-hidden">

                    <TabsContent value="details" className="space-y-4 w-full h-full overflow-y-auto">
                      <OrderDetails />
                    </TabsContent>

                    <TabsContent value="products" className="space-y-4 w-full h-full ">
                      <OrderPlannedProductDetails />
                    </TabsContent>

                    <TabsContent value="productDetails" className="space-y-4 w-full h-full ">
                      <OrderProductDetails />
                    </TabsContent>

                    <TabsContent value="production" className="space-y-4 w-full h-full ">
                      <OrderProduction />
                    </TabsContent>

                    <TabsContent value="pallets" className='h-full'>
                      <OrderPallets />
                    </TabsContent>

                    <TabsContent value="documents" className='h-full'>
                      <OrderDocuments />
                    </TabsContent>

                    <TabsContent value="export" className='h-full'>
                      <OrderExport />
                    </TabsContent>

                    <TabsContent value="labels" className='h-full'>
                      <OrderLabels />
                    </TabsContent>

                    <TabsContent value="map" className='h-full'>
                      <OrderMap />
                    </TabsContent>

                    <TabsContent value="incident" className='h-full'>
                      <OrderIncident />
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


const Order = ({ orderId, onChange }) => {


  return (
    <OrderProvider orderId={orderId} onChange={onChange} >
      <OrderContent />
    </OrderProvider>
  )
}

export default Order



