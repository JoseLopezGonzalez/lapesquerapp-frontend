import React, { useEffect, useState } from 'react'
import example from './example.json';
import { AlertCircle, MoreVertical, Printer } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import OrderEditSheet from './OrderEditSheet';
import OrderDetails from './OrderDetails';
import OrderProducts from './OrderProducts';
import OrderPallets from './OrderPallets';
import OrderDocuments from './OrderDocuments';
import OrderExport from './OrderExport';
import OrderLabels from './OrderLabels';
import { OrderProvider, useOrderContext } from '@/context/OrderContext';

const exampleOrder = example.data;

const OrderContent = () => {

  const { order, loading, error } = useOrderContext();

  console.log(order)
  return (
    <>
      {loading ? (
        <>
          {/* Loader */}
          <div className="h-full ">
            <div role="status" className="flex justify-center pt-96">
              <svg aria-hidden="true" className=" inline w-12 h-12 mr-2 text-neutral-200 animate-spin dark:text-neutral-600 fill-sky-500" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
              </svg>
              <br />
              <span className="text-white dark:text-neutral-400 pt-2 ml-2 sr-only">Cargando...</span>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className='h-full w-full '>

            <div className='h-full flex flex-col'>

              {/* options button section */}
              <div className='flex w-full justify-end items-center'>
                {/*  <DropdownWithSections title={<EllipsisVerticalIcon className='h-5 w-5' />} data={modifiedDropdownOptions} /> */}

              </div>

              {/* Order  Header */}
              <div className='flex justify-between -mt-6 lg:-mt-2'>
                <div className='space-y-1 '>
                  {order.status === 'pending' && (
                    <span className="inline-flex items-center bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-orange-900 dark:text-orange-300">
                      <span className="me-1 relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                      </span>
                      En producción
                    </span>)
                  }
                  {order.status === 'finished' && (
                    <span className="inline-flex items-center bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-green-900 dark:text-green-300">
                      <span className="w-2 h-2 me-1 bg-green-500 rounded-full"></span>
                      Terminado
                    </span>)
                  }

                  <h3 className='text-xl font-medium text-white'>#{order.id}</h3>
                  <div className='text-white'>
                    <p className=''>
                      <span className='font-light text-3xl'>{order.customer.name}</span> <br />
                      <span className='text-lg font-medium'>Cliente Nº {order.customer.id}</span>
                    </p>
                  </div>
                  <div className='text-white'>
                    <p className='font-medium text-xs text-neutral-300'>Fecha de Carga:</p>
                    <p className='font-medium text-lg'>{order.loadDate}</p>
                  </div>
                  <div className='text-white'>
                    <p className='font-medium text-xs text-neutral-300'>Palets:</p>
                    <p className='font-medium text-lg'>{order.numberOfPallets || '-'}</p>
                  </div>
                </div>
                <div className='hidden lg:flex flex-row gap-2 h-fit pt-2'>
                  <div className='flex flex-col max-w-sm justify-end items-end gap-3'>

                    <div className="flex gap-2">
                      <OrderEditSheet />
                      <Button variant="outline">
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


              {/* Form */}
              <div className='flex-1 w-full overflow-y-hidden '>
                <div className="container mx-auto py-3 space-y-8 h-full">
                  {/* Header Section */}

                  {/* Main Content */}
                  <Tabs defaultValue="details" className='h-full flex flex-col'>
                    <TabsList className='w-fit'>
                      <TabsTrigger value="details">Detalles</TabsTrigger>
                      <TabsTrigger value="products">Productos</TabsTrigger>
                      <TabsTrigger value="pallets">Palets</TabsTrigger>
                      <TabsTrigger value="documents">Documentos</TabsTrigger>
                      <TabsTrigger value="export">Exportar</TabsTrigger>
                      <TabsTrigger value="labels">Etiquetas</TabsTrigger>
                    </TabsList>

                    <div className="flex-1 overflow-y-hidden">

                      <TabsContent value="details" className="space-y-4 w-full h-full overflow-y-auto">
                        <OrderDetails />
                      </TabsContent>

                      <TabsContent value="products" className="space-y-4 w-full h-full ">
                        <OrderProducts />
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

                    </div>
                  </Tabs>

                  {/* Alert for important notifications */}
                  {/* <div className="flex items-center gap-2 p-4 border rounded-lg bg-muted">
                    <AlertCircle className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Este pedido requiere temperatura controlada durante el transporte
                    </span>
                  </div> */}
                </div>
              </div>
            </div>

          </div>


          {/* Print Container (All documents) */}
          {/* {OrderPrintContainer}

          {createPortal(<Toaster />, document.body)} */}


        </>

      )

      }


    </>
  )
}


const Order = ({ orderId, onReloadList }) => {


  return (
    <OrderProvider orderId={orderId}>
      <OrderContent />
    </OrderProvider>
  )
}

export default Order



