import { ArrowRightIcon, TrashIcon } from '@heroicons/react/24/outline';
import React from 'react'

export const Body = ({ table, data }) => {
    const { headers } = table;

    return (
        <div className='grow overflow-y-auto overflow-x-auto w-full'>
            <table className="min-w-full divide-y divide-neutral-700">
                {/* Head sticky */}
                <thead className="bg-neutral-800 sticky top-0 z-10">
                    <tr>
                        {headers.map((header) => header.type === 'button' ? (
                            <th key={header.name} scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-white sm:pl-6 whitespace-nowrap">
                                <span className="sr-only">{header.label}</span>
                            </th>
                        ) : (
                            <th key={header.name} scope="col" className="px-6 py-3 text-start">
                                <a className="group inline-flex items-center gap-x-2" href="#">
                                    <span className="text-xs font-semibold uppercase tracking-wide text-neutral-200">
                                        {header.label}
                                    </span>
                                    {header.label.length > 0 && (
                                        <svg className="flex-shrink-0 size-3.5 text-neutral-200" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7 15 5 5 5-5" /><path d="m7 9 5-5 5 5" /></svg>
                                    )}
                                </a>
                            </th>
                        ))}
                    </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-neutral-700">
                    {data.loading ? (
                        // Skeleton rows for loading state
                        [...Array(Object.keys(headers).length)].map((_, index) => (
                            <tr key={index}>
                                {headers.map((_, index) => (
                                    <td key={index} className="px-6 py-3">
                                        {/* IMPLEMENTAR: skeleton */}
                                        <div className="w-full h-6 bg-neutral-600 rounded-md animate-pulse"></div>
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : data.rows.length > 0 ? (
                        data.rows.map((row, rowIndex) => (
                            <tr
                                key={rowIndex}
                                className="hover:bg-neutral-800 transition-colors"
                            >
                                {headers.map((header, index) => (
                                    <td
                                        key={header.name}
                                        className={` ${index === 0 && 'font-bold'} print:w-fit w-full py-2 pl-4 pr-3 text-sm text-white sm:w-auto sm:max-w-none sm:pl-6 `}>

                                        {/* Badge type */}
                                        {header.type === 'badge' && (
                                            header.options[row[header.name]].type === 'warning' ? (
                                                <span className="cursor-pointer flex items-center text-xs text-orange-500">
                                                    <span className="flex w-1.5 h-1.5 bg-orange-600 rounded-full mr-1.5 flex-shrink-0"></span>
                                                    {header.options[row[header.name]].label}
                                                </span>
                                            ) : header.options[row[header.name]].type === 'success' ? (
                                                <span className="cursor-pointer flex items-center text-xs text-lime-500">
                                                    <span className="flex w-1.5 h-1.5 bg-lime-600 rounded-full mr-1.5 flex-shrink-0"></span>
                                                    {header.options[row[header.name]].label}
                                                </span>
                                            ) : null
                                        )}

                                        {/* Button type */}
                                        {header.type === 'button' && (
                                            <div className="flex rounded-md shadow-sm">
                                                <button onClick={row[header.name].delete.onClick} type="button" className=" group inline-flex items-center px-2 py-2 text-sm font-medium   border  rounded-l-lg  border-neutral-600 hover:border-red-600 text-white hover:text-white dark:hover:bg-red-700 ">
                                                    <TrashIcon className="h-4 w-4 text-white" aria-hidden="true" />
                                                </button>
                                                <button onClick={row[header.name].view.onClick} type="button" className="group inline-flex items-center px-2 py-1 text-sm font-medium   border  rounded-r-md  bg-neutral-700 border-neutral-600 hover:border-sky-600 text-white hover:text-white hover:bg-sky-700 ">
                                                    <ArrowRightIcon className="h-4 w-4 text-white" aria-hidden="true" />
                                                </button>
                                            </div>)
                                        }

                                        {/* Text type */}
                                        {header.type === 'text' && (
                                            <span className="text-white">
                                                {row[header.name]}
                                            </span>
                                        )}

                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            {/* Empty State */}
                            <td className="h-full py-48" colSpan={headers.length}> {/* colSpan calculado desde columnas */}
                                <div className="flex flex-col items-center justify-center mb-4">
                                    {/* IMPLEMENTAR: EmptyState */}
                                    {/* <EmptyState title="No existen pedidos con esas características" description="Intenta con otros filtros o crea un nuevo pedido." /> */}
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div >
    )
}
