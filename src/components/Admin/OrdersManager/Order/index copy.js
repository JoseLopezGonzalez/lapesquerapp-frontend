import React, { useEffect, useState } from 'react'
import { AdjustmentsHorizontalIcon, ArchiveBoxIcon, ArrowPathIcon, ClipboardDocumentIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { Toaster } from 'react-hot-toast';
import { createPortal } from 'react-dom';
import { MdPallet } from 'react-icons/md';
import { Button, ScrollShadow } from '@nextui-org/react';

import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'


import { TfiSave } from "react-icons/tfi";

import example from './example.json';
import SlidingPanel from '../../SlidingPanel';
import { Badge } from 'lucide-react';

const exampleOrder = example.data;


const Order = ({ orderId, onReloadList }) => {

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setOrder(exampleOrder);
      setLoading(false);
    }, 2000);
  }, [])

  const handleOnClickSave = () => {
  }



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
                      {order.customer.alias && (<span className='text-lg font-medium'>{order.customer.alias}</span>)}
                    </p>
                  </div>
                  <div className='text-white'>
                    <p className='font-medium text-xs text-neutral-300'>Fecha de Carga:</p>
                    <p className='font-medium text-lg'>{order.loadDate}</p>
                  </div>
                  <div className='text-white'>
                    <p className='font-medium text-xs text-neutral-300'>Buyer Reference:</p>
                    <p className='font-medium text-lg'>{order.buyerReference || '-'}</p>
                  </div>
                </div>
                <div className='hidden lg:flex flex-row gap-2 h-fit p-5'>
                  <div className='flex flex-col max-w-sm justify-end items-end'>

                    {order.transport.name.toLowerCase().includes('olano') ? (
                      <img className="" src='/images/decoration/trailer-olano.png' />) :
                      order.transport.name.toLowerCase().includes('tir') ? (
                        <img className="" src='/images/decoration/trailer-tir.png' />) :
                        order.transport.name.toLowerCase().includes('tpo') ?
                          (<img className="" src='/images/decoration/trailer-tpo.png' />) :
                          order.transport.name.toLowerCase().includes('distran') ?
                            (<img className="" src='/images/decoration/trailer-distran.png' />)
                            : order.transport.name.toLowerCase().includes('narval') ?
                              (<img className="" src='/images/decoration/trailer-narval.png' />)
                              : (
                                <img className="" src='/images/decoration/trailer.png' />)
                    }
                    <h3 className='text-2xl font-light text-white'>{order.transport.name}</h3>
                  </div>
                </div>
              </div>






              {/* Form */}
              <div className='grow w-full h-full '>











              </div>



              {/* Button Footer */}
              <div className='w-full flex flex-col md:flex-row items-center justify-end pt-5 gap-2'>

                <SlidingPanel
                  title="Editar Pedido"
                  buttonTitle="Editar"
                  className={`bg-white text-neutral-900 font-medium px-4 py-2 w-fit rounded-2xl text-sm`}
                >
                  {/* Tabs */}
                  <TabGroup>
                    <ScrollShadow
                      onWheel={(e) => {
                        e.preventDefault();
                        e.currentTarget.scrollLeft += e.deltaY; // Permite desplazamiento horizontal con la rueda
                      }}
                      orientation='horizontal'
                      hideScrollBar
                    >
                      <TabList className="flex items-center gap-1  w-full p-1 rounded-2xl ">
                        <Tab className="
                  data-[selected]:bg-white/40 data-[selected]:text-white 
                  data-[hover]:bg-white/30
                  bg-white/10
                  flex gap-2 py-1.5 px-4 rounded-2xl items-center justify-center
                  ">
                          <ArchiveBoxIcon className='w-4 h-4 text-white' />
                          <span className=' text-white text-sm '>Producción</span>
                        </Tab>
                        <Tab className="
                  data-[selected]:bg-white/40 data-[selected]:text-white 
                  data-[hover]:bg-white/30
                  bg-white/10
                  flex gap-2 py-1.5 px-4 rounded-2xl items-center justify-center
                  ">
                          <AdjustmentsHorizontalIcon className='w-4 h-4 text-white' />
                          <span className=' text-white text-sm'>Generales</span>
                        </Tab>
                        <Tab className="
                  data-[selected]:bg-white/40 data-[selected]:text-white 
                  data-[hover]:bg-white/30
                  bg-white/10
                  flex gap-2 py-1.5 px-4 rounded-2xl items-center justify-center
                  ">
                          <MapPinIcon className='w-4 h-4 text-white' />
                          <span className=' text-white text-sm'>Direcciones</span>
                        </Tab>
                        <Tab className="
                  data-[selected]:bg-white/40 data-[selected]:text-white 
                  data-[hover]:bg-white/30
                  bg-white/10
                  flex gap-2 py-1.5 px-4 rounded-2xl items-center justify-center
                  ">
                          <ClipboardDocumentIcon className='w-4 h-4 text-white' />
                          <span className=' text-white text-sm'>Observaciones</span>
                        </Tab>
                      </TabList>
                    </ScrollShadow>
                    <TabPanels>
                      {/* Producción */}
                      <TabPanel className='py-4'>
                        {/* Tablas */}
                        <div className='flex flex-col col-span-2 gap-10'> {/* gap-2 mt-5  mb-5 */}

                          {1 === 0 ? (
                            <div className='h-full bg-neutral-700 rounded-lg'>
                              <div className=' h-full w-full flex flex-col justify-center items-center border-2 rounded-lg border-dashed border-neutral-400 p-5'>
                                <MdPallet className='w-7 h-7 text-neutral-400' />
                                <p className='text-md text-center font-light text-neutral-400'>No existen palets asociados a este pedido</p>
                              </div>
                            </div>) : (
                            <>
                              <div className="w-full">
                                <div className="-m-1.5 overflow-x-auto">
                                  <div className="p-1.5 min-w-full inline-block align-middle">
                                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden dark:bg-neutral-800 dark:border-neutral-700">
                                      {/* <!-- Header --> */}
                                      <div className="px-6 py-4 border-b border-gray-200 dark:border-neutral-700">
                                        <h2 className="text-xl font-semibold text-gray-800 dark:text-neutral-200">
                                          Resumen
                                        </h2>
                                        <p className="text-sm text-gray-600 dark:text-neutral-400">
                                          Detalles de los articulos y cantidades vinculados al pedido.
                                        </p>
                                      </div>
                                      {/* <!-- End Header --> */}
                                      <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
                                        <thead className="bg-gray-50 dark:bg-white/5">
                                          <tr>
                                            <th scope="col" className="px-6 py-3 text-start whitespace-nowrap">
                                              <span className="text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-neutral-200">
                                                Articulo
                                              </span>
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-start whitespace-nowrap">
                                              <span className="text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-neutral-200">
                                                Cajas
                                              </span>
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-start whitespace-nowrap">
                                              <span className="text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-neutral-200">
                                                Cantidad
                                              </span>
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">

                                          {/* {formattedOrder.summary.pallets().map((item, index) => (
                  <tr key={index}>
                    <td className="size-px whitespace-nowrap px-6 py-3">
                      <span className="text-sm font-semibold tracking-wide text-gray-800 dark:text-neutral-200">
                        {item.article.name}
                      </span>
                    </td>
                    <td className="size-px whitespace-nowrap px-6 py-3">
                      <span className="text-sm font-semibold tracking-wide text-gray-800 dark:text-neutral-200">
                        {item.boxes}
                      </span>
                    </td>
                    <td className="size-px whitespace-nowrap px-6 py-3">
                      <span className="text-sm font-semibold tracking-wide text-gray-800 dark:text-neutral-200">
                        {item.netWeight.toFixed(2)} kg
                      </span>
                    </td>
                  </tr>
                ))} */}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className=' col-span-2'>
                                <div className="w-full">
                                  <div className="-m-1.5 overflow-x-auto">
                                    <div className="p-1.5 min-w-full inline-block align-middle">
                                      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden dark:bg-neutral-800 dark:border-neutral-700">
                                        {/* <!-- Header --> */}
                                        <div className="px-6 py-4 border-b border-gray-200 dark:border-neutral-700">
                                          <h2 className="text-xl font-semibold text-gray-800 dark:text-neutral-200">
                                            Palets
                                          </h2>
                                          <p className="text-sm text-gray-600 dark:text-neutral-400">
                                            Detalles de los palets vinculados al pedido.
                                          </p>
                                        </div>
                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
                                          <thead className="bg-gray-50 dark:bg-white/5">
                                            <tr>
                                              <th scope="col" className="px-6 py-3 text-start whitespace-nowrap">
                                                <span className="text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-neutral-200">
                                                  Numero
                                                </span>
                                              </th>
                                              <th scope="col" className="px-6 py-3 text-start whitespace-nowrap">
                                                <span className="text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-neutral-200">

                                                  Productos
                                                </span>
                                              </th>
                                              <th scope="col" className="px-6 py-3 text-start whitespace-nowrap">
                                                <span className="text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-neutral-200">

                                                  Lotes
                                                </span>
                                              </th>
                                              <th scope="col" className="px-6 py-3 text-start whitespace-nowrap">
                                                <span className="text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-neutral-200">

                                                  Cajas
                                                </span>
                                              </th>
                                              <th scope="col" className="px-6 py-3 text-start whitespace-nowrap">
                                                <span className="text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-neutral-200">

                                                  Peso
                                                </span>
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
                                            {order?.pallets.map((pallet, index) => (
                                              <tr key={index}>
                                                <td className="size-px whitespace-nowrap px-6 py-3">
                                                  <span className="text-sm font-semibold tracking-wide text-gray-800 dark:text-neutral-200">
                                                    {pallet.id}
                                                  </span>
                                                </td>
                                                <td className="size-px whitespace-nowrap px-6 py-3">
                                                  <span className="text-sm font-semibold tracking-wide text-gray-800 dark:text-neutral-200">
                                                    <ul>
                                                      {/* {pallet.articles.map((articulo, index) =>
                              <li key={index} className='mb-1'>
                                <span key={index} className=" bg-sky-100 mr-1 text-sky-800 text-xs font-medium  px-2.5 py-0.5 rounded-full dark:bg-sky-900 dark:text-sky-300 truncate">{articulo}</span>
                              </li>
                            )} */}
                                                    </ul>
                                                  </span>
                                                </td>
                                                <td className="size-px whitespace-nowrap px-6 py-3">
                                                  <span className="text-sm font-semibold tracking-wide text-gray-800 dark:text-neutral-200">
                                                    <ul>
                                                      {/* {pallet.lots.map((lote, index) =>
                              <li key={index} className='mb-1'>
                                <span key={index} className="bg-slate-100 mr-1 text-slate-800 text-xs font-medium  px-2.5 py-0.5 rounded-full dark:bg-slate-900 dark:text-slate-300 truncate">{lote}</span>
                              </li>
                            )} */}
                                                    </ul>
                                                  </span>
                                                </td>
                                                <td className="size-px whitespace-nowrap px-6 py-3">
                                                  <span className="text-sm font-semibold tracking-wide text-gray-800 dark:text-neutral-200">
                                                    {pallet.boxes.length}
                                                  </span>
                                                </td>
                                                <td className="size-px whitespace-nowrap px-6 py-3">
                                                  <span className="text-sm font-semibold tracking-wide text-gray-800 dark:text-neutral-200">
                                                    {pallet.netWeight.toFixed(2)} kg
                                                  </span>
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </TabPanel>
                      {/* Generales */}
                      <TabPanel className='py-4'>
                        <div className='w-full grid grid-cols-2 gap-y-4 gap-x-2'>

                          <div className='col-span-2 flex flex-col gap-1.5 '>
                            <label className="text-xs text-neutral-300">Empresa de transporte</label>
                            <select
                              name="transport"
                              className="border text-sm rounded-2xl w-full p-2 bg-black/35 border-neutral-600 placeholder-neutral-600 text-white focus:ring-sky-500 focus:border-sky-500"
                            >
                              <option value="Prueba1">Prueba 1</option>
                              <option value="Prueba2">Prueba 2</option>
                              <option value="Prueba3">Prueba 3</option>
                            </select>
                          </div>

                          <div className='col-span-1 flex flex-col gap-1.5 '>
                            <label className="text-xs text-neutral-300">Incoterm</label>
                            <select name="incoterm" className="border text-sm rounded-2xl w-full p-2 bg-black/35 border-neutral-600 placeholder-neutral-600 text-white focus:ring-sky-500 focus:border-sky-500">
                              <option value="Prueba1">Prueba 1</option>
                              <option value="Prueba2">Prueba 2</option>
                              <option value="Prueba3">Prueba 3</option>
                            </select>
                          </div>

                          <div className='col-span-1 flex flex-col gap-1.5'>
                            <label className="text-xs text-neutral-300">Comercial</label>
                            <select name="salesperson" className="border text-sm rounded-2xl w-full p-2 bg-black/35 border-neutral-600 placeholder-neutral-600 text-white focus:ring-sky-500 focus:border-sky-500">
                              <option value="Prueba1">Prueba 1</option>
                              <option value="Prueba2">Prueba 2</option>
                              <option value="Prueba3">Prueba 3</option>
                            </select>
                          </div>

                          <div className='col-span-2 flex flex-col gap-1.5'>
                            <label className="text-xs text-neutral-300">Forma de pago</label>
                            <select name="paymentTerm" className="border text-sm rounded-2xl w-full p-2 bg-black/35 border-neutral-600 placeholder-neutral-600 text-white focus:ring-sky-500 focus:border-sky-500">
                              <option value="Prueba1">Prueba 1</option>
                              <option value="Prueba2">Prueba 2</option>
                            </select>
                          </div>

                          <div className='col-span-2 flex flex-col gap-1.5'>
                            <label className="text-xs text-neutral-300">Buyer Reference</label>
                            <input
                              name="buyerReference"
                              type="text"
                              className="border text-sm rounded-2xl w-full p-2 bg-black/35 border-neutral-600 placeholder-neutral-600 text-white focus:ring-sky-500 focus:border-sky-500"
                              placeholder="186987236"
                              required
                            />
                          </div>

                          <div className='col-span-1 flex flex-col gap-1.5'>
                            <label className="text-xs text-neutral-300">Fecha de entrada</label>
                            <input
                              name="entryDate"
                              type="date"
                              className="border text-sm rounded-2xl w-full p-2 bg-black/35 border-neutral-600 placeholder-neutral-600 text-white focus:ring-sky-500 focus:border-sky-500"
                              required
                            />
                          </div>

                          <div className='col-span-1 flex flex-col gap-1.5'>
                            <label className="text-xs text-neutral-300">Fecha de salida</label>
                            <input
                              name="loadDate"
                              type="date"
                              className="border text-sm rounded-2xl w-full p-2 bg-black/35 border-neutral-600 placeholder-neutral-600 text-white focus:ring-sky-500 focus:border-sky-500"
                              required />
                          </div>
                        </div>

                        <div className='col-span-1 flex flex-col gap-1.5 py-2.5'>
                          <p className='text-xs text-neutral-300'>Emails</p>
                          <textarea
                            name="emails"
                            rows="4"
                            className="border text-sm rounded-2xl w-full p-2.5 bg-black/35 border-neutral-600 placeholder-neutral-600 placeholder:font-light text-white focus:ring-sky-500 focus:border-sky-500"
                            placeholder={`ejemplo@ejemplo.com;\nejemplo2@ejemplo.com;\nCC:ejemplo3@ejemplo.com;\n`}
                          />
                        </div>
                      </TabPanel>
                      {/* Direcciones */}
                      <TabPanel className='py-4'>
                        <div className='w-full grid grid-cols-2 gap-y-4 gap-x-2'>

                          <div className='col-span-2 flex flex-col gap-1.5 '>
                            <p className='text-xs text-neutral-300'>Dirección de Facturación</p>
                            <textarea
                              name="billingAddress"
                              rows="5"
                              className="border text-sm rounded-2xl w-full p-2.5 bg-black/35 border-neutral-600 placeholder-neutral-600 placeholder:font-light text-white focus:ring-sky-500 focus:border-sky-500"
                              placeholder={`Ejemplo S.L.\nB215468698 \nC/ Ejemplo, 1\n28000 Madrid \nEspaña`}
                            />
                          </div>

                          <div className='col-span-2 flex flex-col gap-1.5 '>
                            <p className='text-xs text-neutral-300'>Dirección de Entrega</p>
                            <textarea
                              name="shippingAddress"
                              rows="5"
                              className="border text-sm rounded-2xl w-full p-2.5 bg-black/35 border-neutral-600 placeholder-neutral-600 placeholder:font-light text-white focus:ring-sky-500 focus:border-sky-500"
                              placeholder={`Ejemplo S.L. \nC/ Ejemplo, 1\n28000 Madrid \nEspaña`}
                            />
                          </div>
                        </div>
                      </TabPanel>
                      {/* Observaciones */}
                      <TabPanel>
                        <div className='grow w-full grid grid-cols-2 pr-0 lg:pr-2 mt-5 gap-y-4 gap-x-4 overflow-y-auto'>
                          <div className='col-span-2 flex flex-col gap-1.5 '>
                            <p className='text-xs text-neutral-300'>Observaciones de Producción</p>
                            <textarea
                              name="productionNotes"
                              rows="4"
                              className="border text-sm rounded-2xl w-full p-2.5 bg-black/35 border-neutral-600 placeholder-neutral-600 placeholder:font-light text-white focus:ring-sky-500 focus:border-sky-500"
                              placeholder={`Pulpo eviscerado T3: 56 cajas x 20kg \nHasta 1.000kg\nEtiqueta española`}
                            />
                          </div>
                          <div className='col-span-2 flex flex-col gap-1.5 '>
                            <p className='text-xs text-neutral-300'>Observaciones de Contabilidad</p>
                            <textarea
                              name="accountingNotes"
                              rows="4"
                              className="border text-sm rounded-2xl w-full p-2.5 bg-black/35 border-neutral-600 placeholder-neutral-600 placeholder:font-light text-white focus:ring-sky-500 focus:border-sky-500"
                              placeholder={`Precio: 12,30$/kg\nComision: 4%`}
                            />
                          </div>
                        </div>
                      </TabPanel>
                    </TabPanels>
                  </TabGroup>
                </SlidingPanel>


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

export default Order



