'use client'

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/Utilities/EmptyState';
import { formatDate, formatDateHour } from '@/helpers/formats/dates/formatDates';
import { formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';
import { ArrowRightIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Checkbox } from '@nextui-org/react';
import React, { useEffect, useState } from 'react';

// Predefinir los colores y estilos para los badges
const badgeStyles = {
    primary: {
        base: " text-blue-800",
        outline: "text-blue-400 border border-blue-300 bg-blue-800/25",
    },
    success: {
        base: " text-green-800",
        outline: "text-green-400 border border-green-300 bg-green-800/25",
    },
    warning: {
        base: " text-orange-500",
        outline: "text-orange-400 border border-orange-300 bg-orange-800/25",
    },
    danger: {
        base: " text-red-800",
        outline: "text-red-400 border border-red-300 bg-red-800/25 ",
    },
    neutral: {
        base: " text-neutral-800",
        outline: "text-neutral-400 border border-neutral-300 bg-neutral-800/25",
    },
};

export const Body = ({ table, data, emptyState, isSelectable = false, onSelectionChange }) => {
    const { headers } = table;

    const [selectedRows, setSelectedRows] = useState([]);

    const toggleSelectAll = (checked) => {
        if (checked) {
            const visibleRowIds = data.rows.map((row) => row.id);
            setSelectedRows(visibleRowIds);
        } else {
            setSelectedRows([]);
        }
    };

    const toggleSelectRow = (rowId) => {
        setSelectedRows((prevSelected) =>
            prevSelected.includes(rowId)
                ? prevSelected.filter((id) => id !== rowId)
                : [...prevSelected, rowId]
        );
    };

    useEffect(() => {
        if (onSelectionChange) {
            onSelectionChange(selectedRows);
        }
    }, [selectedRows, onSelectionChange]);

    const renderBadge = (header, value) => {
        const option = header.options[value] || header.options.default;
        const style = badgeStyles[option.color] || badgeStyles.neutral; // Default color: neutral
        const className = option.outline ? style.outline : style.base;

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
                {option.label}
            </span>
        );
    };

    return (
        <div className="grow overflow-y-auto overflow-x-auto w-full">
            <table className="min-w-full divide-y divide-neutral-700/20"> {/* divide-y divide-neutral-700 */}
                {/* Head sticky */}
                <thead className="bg-neutral-950 sticky top-0 z-10">
                    <tr>
                        {isSelectable && (
                            <th className="py-3.5 px-4 text-left text-sm font-semibold text-white">
                                <Checkbox
                                    onValueChange={toggleSelectAll}
                                    isSelected={
                                        selectedRows.length > 0 &&
                                        selectedRows.length === data.rows.length
                                    }
                                    size="sm" />
                            </th>
                        )}
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
                <tbody className="divide-y divide-neutral-700/20">
                    {data.loading ? (
                        // Skeleton rows for loading state
                        [...Array(14)].map((_, index) => (
                            <tr key={index}>
                                <td className="py-2 px-4">
                                    <Checkbox
                                        disabled
                                        size="sm" />
                                </td>
                                {headers.map((_, index) => (
                                    <td key={index} className="px-6 py-3">
                                        <div className="w-full h-6 bg-neutral-600 rounded-lg animate-pulse"></div>
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : data.rows.length > 0 ? (
                        data.rows.map((row, rowIndex) => (
                            <tr
                                key={rowIndex}
                                className="hover:bg-neutral-800 transition-colors"
                                onClick={() => toggleSelectRow(row.id)}
                            >
                                {isSelectable && (
                                    <td className="py-2 px-4">
                                        <Checkbox
                                            onValueChange={() => toggleSelectRow(row.id)}
                                            isSelected={selectedRows.includes(row.id)}
                                            size="sm" />
                                    </td>
                                )}
                                {headers.map((header, index) => (
                                    <td
                                        key={header.name}
                                        className={` ${index === 0 && 'font-bold'} print:w-fit w-full py-2 pl-4 pr-3 text-sm text-white sm:w-auto sm:max-w-none sm:pl-6 `}
                                    >
                                        {/* Badge type */}
                                        {header.type === 'badge' && renderBadge(header, row[header.name])}

                                        {/* Button type */}
                                        {/* {header.type === 'button' && (
                                            <div className="flex rounded-md shadow-sm">
                                                <button onClick={row[header.name].delete.onClick} type="button" className=" group inline-flex items-center px-2 py-2 text-sm font-medium   border  rounded-l-lg  border-neutral-600 hover:border-red-600 text-white hover:text-white dark:hover:bg-red-700 ">
                                                    <TrashIcon className="h-4 w-4 text-white" aria-hidden="true" />
                                                </button>
                                                <button onClick={row[header.name].view.onClick} type="button" className="group inline-flex items-center px-2 py-1 text-sm font-medium   border  rounded-r-md  bg-neutral-700 border-neutral-600 hover:border-sky-600 text-white hover:text-white hover:bg-sky-700 ">
                                                    <ArrowRightIcon className="h-4 w-4 text-white" aria-hidden="true" />
                                                </button>
                                            </div>
                                        )} */}

                                        {header.type === "button" && (
                                            <div className="flex min-w-14  items-center justify-center">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={
                                                        (e) => {
                                                            e.stopPropagation();
                                                            row[header.name].view.onClick()
                                                        }
                                                    }
                                                    className="rounded-r-md"
                                                >
                                                    <ArrowRightIcon className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}

                                        {/* Text type */}
                                        {header.type === 'text' && (
                                            <span className="text-white">
                                                {row[header.name] === 'N/A' ? '-' : row[header.name]}
                                            </span>
                                        )}

                                        {/* id Type */}
                                        {header.type === 'id' && (
                                            <span className="text-wtite font-bold">
                                                {row[header.name]}
                                            </span>
                                        )}

                                        {/* weight type */}
                                        {header.type === 'weight' && (
                                            <span className="text-white">
                                                {formatDecimalWeight(row[header.name])}
                                            </span>
                                        )}

                                        {/* list type with bucle */}
                                        {header.type === 'list' && (
                                            <ul className="text-white text-nowrap">
                                                {row[header.name].length > 0 &&

                                                    row[header.name].map((item, index) => (
                                                        <li key={index}>
                                                            {item}
                                                        </li>
                                                    ))}
                                            </ul>
                                        )}

                                        {/* Date type */}
                                        {header.type === 'date' && (
                                            <span className="text-white">
                                                {/* si nes N/A devolver - */}
                                                {row[header.name] === 'N/A' ? '-' : formatDate(row[header.name])}
                                            </span>
                                        )}

                                        {/* DateHour type DD/MM/YYYY - HH:MM */}
                                        {header.type === 'dateHour' && (
                                            <span className="text-white text-nowrap">
                                                {row[header.name] === 'N/A' ? '-' : formatDateHour(row[header.name])}
                                            </span>
                                        )}

                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            {/* Empty State */}
                            <td className="h-full py-48" colSpan={headers.length}>
                                <div className="flex flex-col items-center justify-center mb-4">
                                    {/* EmptyState placeholder */}
                                    <div className="w-full h-full flex flex-col items-center justify-center">
                                        <EmptyState
                                            title={emptyState.title}
                                            description={emptyState.description}
                                        />
                                    </div>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};
