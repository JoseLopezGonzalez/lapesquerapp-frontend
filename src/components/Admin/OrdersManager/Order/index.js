import React, { useEffect, useState } from 'react'
import { AdjustmentsHorizontalIcon, ArchiveBoxIcon, ArrowPathIcon, ClipboardDocumentIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { Toaster } from 'react-hot-toast';
import { createPortal } from 'react-dom';
import { MdPallet } from 'react-icons/md';
import { Button } from '@nextui-org/react';

import { TfiSave } from "react-icons/tfi";

import example from './example.json';

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

              {/* Tab */}
              <div className='flex gap-5 bg-black/20 w-fit p-1 rounded-2xl'>
                <div className='flex  gap-2 py-2 px-6 rounded-t-2xl items-center justify-center'>
                  <ArchiveBoxIcon className='w-4 h-4 text-white' />
                  <span className=' text-white text-sm '>Producción</span>
                </div>
                <div className='flex  gap-2 py-2 px-6 rounded-t-2xl items-center justify-center'>
                  <AdjustmentsHorizontalIcon className='w-4 h-4 text-white' />
                  <span className=' text-white text-sm'>Generales</span>
                </div>
                <div className='flex  gap-2 py-2 px-6 rounded-2xl items-center justify-center bg-black/30'>
                  <MapPinIcon className='w-4 h-4 text-white' />
                  <span className=' text-white text-sm'>Direcciones</span>
                </div>
                <div className='flex  gap-2 py-2 px-6 rounded-t-2xl items-center justify-center'>
                  <ClipboardDocumentIcon className='w-4 h-4 text-white' />
                  <span className=' text-white text-sm'>Observaciones</span>
                </div>

              </div>
             


              {/* Form */}
              <div className='grow w-full grid grid-cols-2 pr-0 lg:pr-2 mt-5 gap-y-4 gap-x-4 overflow-y-auto'>

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

                {/* <div className='col-span-2 lg:col-span-1 '>
                  <label className="block mb-2 text-sm font-medium text-white">Empresa de transporte:</label>
                  <select onChange={handleOnChangeTransport} name="transport" className=" border text-sm rounded-lg block w-full p-2.5 bg-neutral-600 border-neutral-600 placeholder-neutral-400 text-white focus:ring-sky-500 focus:border-sky-500">
                    {transports.map((transport, index) =>
                      transport.id === order.transport.id ? (
                        <option key={index} value={transport.id} selected>{transport.name}</option>
                      ) : (
                        <option key={index} value={transport.id}>{transport.name}</option>
                      ))
                    }
                  </select>
                </div> */}

                {/* <div className='col-span-2 lg:col-span-1 '>
                  <label className="block mb-2 text-sm font-medium text-white">Incoterm:</label>
                  <select onChange={handleOnChangeIncoterm} name="incoterm" className=" border text-sm rounded-lg block w-full p-2.5 bg-neutral-600 border-neutral-600 placeholder-neutral-400 text-white focus:ring-sky-500 focus:border-sky-500">
                    {incoterms.map((incoterm, index) =>
                      incoterm.id === order.incoterm.id ? (
                        <option key={index} value={incoterm.id} selected>{incoterm.code} - ({incoterm.description})</option>
                      ) : (
                        <option key={index} value={incoterm.id}>{incoterm.code} - ({incoterm.description})</option>
                      ))
                    }
                  </select>
                </div> */}

                {/* <div className='col-span-2 lg:col-span-1'>
                  <label className="block mb-2 text-sm font-medium text-white">Comercial:</label>
                  <select onChange={handleOnChangeSalesperson} name="salesperson" className="border text-sm rounded-lg block w-full p-2.5 bg-neutral-600 border-neutral-600 placeholder-neutral-400 text-white focus:ring-sky-500 focus:border-sky-500">
                    {salespeople.map((salesperson, index) =>
                      salesperson.id === order.salesperson.id ? (
                        <option key={index} value={salesperson.id} selected>{salesperson.name}</option>
                      ) : (
                        <option key={index} value={salesperson.id}>{salesperson.name}</option>
                      ))
                    }
                  </select>
                </div> */}

                {/* <div className='col-span-2 lg:col-span-1'>
                  <label className="block mb-2 text-sm font-medium text-white">Forma de pago:</label>
                  <select onChange={handleOnChangePaymentTerm} name="paymentTerm" className="border text-sm rounded-lg block w-full p-2.5 bg-neutral-600 border-neutral-600 placeholder-neutral-400 text-white focus:ring-sky-500 focus:border-sky-500">
                    {paymentTerms.map((paymentTerm, index) =>
                      paymentTerm.id === order.paymentTerm.id ? (
                        <option key={index} value={paymentTerm.id} selected>{paymentTerm.name}</option>
                      ) : (
                        <option key={index} value={paymentTerm.id}>{paymentTerm.name}</option>
                      ))
                    }
                  </select>
                </div> */}

                {/* <div className='col-span-2'>
                  <label className="block mb-2 text-sm font-medium text-white">Buyer Reference:</label>
                  <input onChange={handleOnChange} name="buyerReference" type="text" value={temporalOrder.buyerReference} className="border text-sm rounded-lg block w-full p-2.5 bg-neutral-600 border-neutral-600 placeholder-neutral-100 text-white focus:ring-sky-500 focus:border-sky-500" placeholder="John" required />
                </div>

                <div className='col-span-2 lg:col-span-1'>
                  <label className="block mb-2 text-sm font-medium text-white">Fecha de entrada:</label>
                  <input onChange={handleOnChange} name="entryDate" type="date" value={temporalOrder.entryDate} className="border text-sm rounded-lg block w-full p-2.5 bg-neutral-600 border-neutral-600 placeholder-neutral-100 text-white focus:ring-sky-500 focus:border-sky-500" placeholder="John" required />
                </div>

                <div className='col-span-2 lg:col-span-1'>
                  <label className="block mb-2 text-sm font-medium text-white">Fecha de salida:</label>
                  <input onChange={handleOnChange} name="loadDate" type="date" value={temporalOrder.loadDate} className="border text-sm rounded-lg block w-full p-2.5 bg-neutral-600 border-neutral-600 placeholder-neutral-100 text-white focus:ring-sky-500 focus:border-sky-500" placeholder="John" required />
                </div> */}

                {/* <div className='col-span-2 lg:col-span-1'>
                  <p className='block mb-2 text-sm font-medium text-white'>Dirección de Facturación:</p>
                  <textarea
                    id="message"
                    name="billingAddress"
                    onChange={handleOnChange}
                    rows="4"
                    className="block p-2.5 w-full text-sm rounded-lg border bg-neutral-600 border-neutral-600 placeholder-neutral-400 text-white focus:ring-sky-500 focus:border-sky-500"
                    placeholder="Introduce la información..."
                    value={temporalOrder.billingAddress}
                  />
                </div> */}

                {/* <div className='col-span-2 lg:col-span-1'>
                  <p className='block mb-2 text-sm font-medium text-white'>Dirección de Entrega:</p>
                  <textarea
                    id="message"
                    name="shippingAddress"
                    onChange={handleOnChange}
                    rows="4"
                    className="block p-2.5 w-full text-sm rounded-lg border bg-neutral-600 border-neutral-600 placeholder-neutral-400 text-white focus:ring-sky-500 focus:border-sky-500"
                    placeholder="Introduce la información..."
                    value={temporalOrder.shippingAddress}
                  />
                </div> */}

                {/* <div className='col-span-2 lg:col-span-1'>
                  <p className='block mb-2 text-sm font-medium text-white'>Observaciones de Producción:</p>
                  <textarea
                    id="message"
                    name="productionNotes"
                    onChange={handleOnChange}
                    rows="4"
                    className="block p-2.5 w-full text-sm rounded-lg border bg-neutral-600 border-neutral-600 placeholder-neutral-400 text-white focus:ring-sky-500 focus:border-sky-500"
                    placeholder="Introduce la información..."
                    value={temporalOrder.productionNotes}
                  />
                </div> */}

                {/* <div className='col-span-2 lg:col-span-1'>
                  <p className='block mb-2 text-sm font-medium text-white'>Observaciones de Contabilidad:</p>
                  <textarea
                    id="message"
                    name="accountingNotes"
                    onChange={handleOnChange}
                    rows="4"
                    className="block p-2.5 w-full text-sm rounded-lg border bg-neutral-600 border-neutral-600 placeholder-neutral-400 text-white focus:ring-sky-500 focus:border-sky-500"
                    placeholder="Introduce la información..."
                    value={temporalOrder.accountingNotes}
                  />
                </div> */}

                {/* <div className='col-span-2 lg:col-span-1'>
                  <p className='block mb-2 text-sm font-medium text-white'>Emails:</p>
                  <textarea
                    id="message"
                    name="emails"
                    onChange={handleOnChange}
                    rows="4"
                    className="block p-2.5 w-full text-sm rounded-lg border bg-neutral-600 border-neutral-600 placeholder-neutral-400 text-white focus:ring-sky-500 focus:border-sky-500"
                    placeholder="Introduce la información..."
                    value={temporalOrder.emails}
                  />
                </div> */}


              </div>



              {/* Button Footer */}
              <div className='w-full flex flex-col md:flex-row items-center justify-end pt-5 gap-2'>
                {/* {!isOrderUpdated() && (
                  <>
                    <Button
                      color="primary"
                      onClick={handleReset}
                      startContent={<ArrowPathIcon className='w-5 h-5' />}
                      className=' text-white w-full md:w-auto'

                    >
                      Restablecer
                    </Button>

                    <Button
                      color="success"
                      startContent={<TfiSave className='w-4 h-4' />}
                      className='animate-pulse text-white w-full md:w-auto'
                      onClick={handleOnClickSave}
                    >
                      Guardar
                    </Button>
                  </>
                )} */}
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



