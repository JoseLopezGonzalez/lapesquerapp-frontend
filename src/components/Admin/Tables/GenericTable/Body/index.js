'use client'

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/Utilities/EmptyState/index';
import { formatDate, formatDateHour } from '@/helpers/formats/dates/formatDates';
import { formatDecimalCurrency, formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';
import { ArrowRightIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Checkbox } from '@nextui-org/react';
import { Pencil } from 'lucide-react';
import React, { useEffect, useState } from 'react';

// Predefinir los colores y estilos para los badges
const badgeStyles = {
    primary: {
        base: " text-blue-800",
        outline: "text-blue-100 border-blue-400 bg-blue-500 dark:text-blue-400 border dark:border-blue-300 dark:bg-blue-800/25",
    },
    success: {
        base: " text-green-800",
        outline: " text-green-200 border-green-400 bg-green-600 dark:text-green-400 border  dark:border-green-300  dark:bg-green-800/25",
    },
    warning: {
        base: " text-orange-500",
        outline: "text-orange-100 border-orange-400 bg-orange-400 dark:text-orange-400 border dark:border-orange-300 dark:bg-orange-800/25",
    },
    danger: {
        base: " text-red-800",
        outline: "text-red-100 border-red-400 bg-red-500 dark:text-red-400 border dark:border-red-300 dark:bg-red-800/25 ",
    },
    neutral: {
        base: " text-neutral-800",
        outline: "text-neutral-100 border-neutral-400 bg-neutral-500 dark:text-neutral-400 border dark:border-neutral-300 dark:bg-neutral-800/25",
    },
};

export const Body = ({ table, data, emptyState, isSelectable = false, onSelectionChange, selectedRows, onEdit }) => {
    const { headers } = table;

    console.log(table);
    console.log(data);


    const toggleSelectAll = (checked) => {
        if (checked) {
            const visibleRowIds = data.rows.map((row) => row.id);
            onSelectionChange(visibleRowIds);
        } else {
            onSelectionChange([]);
        }
    };

    const toggleSelectRow = (rowId) => {
        onSelectionChange((prevSelected) =>
            prevSelected.includes(rowId)
                ? prevSelected.filter((id) => id !== rowId)
                : [...prevSelected, rowId]
        );
    };


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
            <table className="min-w-full divide-y divide-neutral-700/20">
                <thead className="bg-foreground-50 sticky top-0 z-10">
                    <tr>
                        {isSelectable && (
                            <th className="py-3.5 px-4 text-left text-xs font-semibold ">
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
                            <th key={header.name} scope="col" className={`py-3.5 pl-4 pr-3 text-left text-xs font-semibold sm:pl-6 whitespace-nowrap${header.hideOnMobile ? ' hidden md:table-cell' : ''}`}>
                                <span className="sr-only">{header.label}</span>
                            </th>
                        ) : (
                            <th key={header.name} scope="col" className={`px-6 py-3 text-start text-xs whitespace-nowrap${header.hideOnMobile ? ' hidden md:table-cell' : ''}`}>
                                <a className="group inline-flex items-center gap-x-2" href="#">
                                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        {header.label}
                                    </span>
                                    {header.label.length > 0 && (
                                        <svg className="flex-shrink-0 size-3.5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7 15 5 5 5-5" /><path d="m7 9 5-5 5 5" /></svg>
                                    )}
                                </a>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-foreground-200">
                    {data.loading ? (
                        [...Array(14)].map((_, index) => (
                            <tr key={index}>
                                <td className="py-1 px-2">
                                    <Checkbox
                                        disabled
                                        size="sm" />
                                </td>
                                {headers.map((header, idx) => (
                                    <td key={idx} className={`text-sm px-2 py-1${header.hideOnMobile ? ' hidden md:table-cell' : ''} whitespace-nowrap max-w-[120px] truncate`}>
                                        <Skeleton className="w-full h-6 rounded-lg" />
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : data.rows.length > 0 ? (
                        data.rows.map((row, rowIndex) => (
                            <tr
                                key={rowIndex}
                                className="hover:bg-foreground-50 transition-colors"
                                onClick={() => toggleSelectRow(row.id)}
                            >
                                {isSelectable && (
                                    <td className="py-1 px-2">
                                        <Checkbox
                                            onValueChange={() => toggleSelectRow(row.id)}
                                            isSelected={selectedRows.includes(row.id)}
                                            size="sm" />
                                    </td>
                                )}
                                {headers.map((header, index) => (
                                    <td
                                        key={header.name}
                                        className={`text-sm px-2 py-1${header.hideOnMobile ? ' hidden md:table-cell' : ''} ${index === 0 && 'font-bold'} print:w-fit w-full sm:w-auto sm:max-w-none sm:pl-4 whitespace-nowrap max-w-[120px] truncate`}
                                        title={
                                            (header.type === 'text' || header.type === 'id' || header.type === 'currency' || header.type === 'date' || header.type === 'dateHour' || header.type === 'weight')
                                                ? (row[header.name] === 'N/A' ? '-' : String(row[header.name]))
                                                : undefined
                                        }
                                    >
                                        {header.type === 'badge' && renderBadge(header, row[header.name])}
                                        {header.type === "button" && (
                                            <div className="flex min-w-14  items-center justify-center gap-2">
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
                                                {onEdit && (
                                                    <Button
                                                        /* variant="outline" */
                                                        size="icon"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onEdit(row.id);
                                                        }}
                                                        className="rounded-l-md"
                                                    >
                                                        <span className="sr-only">Editar</span>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                        {header.type === 'text' && (
                                            <span>
                                                {row[header.name] === 'N/A' ? '-' : row[header.name]}
                                            </span>
                                        )}
                                        {header.type === 'id' && (
                                            <span className="text-wtite font-bold">
                                                {row[header.name]}
                                            </span>
                                        )}
                                        {header.type === 'weight' && (
                                            <span>
                                                {formatDecimalWeight(row[header.name])}
                                            </span>
                                        )}
                                        {header.type === 'list' && (
                                            <ul>
                                                {row[header.name].length > 0 &&
                                                    row[header.name].map((item, index) => (
                                                        <li key={index}>
                                                            {item}
                                                        </li>
                                                    ))}
                                            </ul>
                                        )}
                                        {header.type === 'date' && (
                                            <span>
                                                {row[header.name] === 'N/A' ? '-' : formatDate(row[header.name])}
                                            </span>
                                        )}
                                        {header.type === 'dateHour' && (
                                            <span>
                                                {row[header.name] === 'N/A' ? '-' : formatDateHour(row[header.name])}
                                            </span>
                                        )}
                                        {/* currency */}
                                        {header.type === 'currency' && (
                                            <span className="flex items-center justify-end">
                                                {row[header.name] === 'N/A' ? '-' : formatDecimalCurrency(row[header.name])}
                                            </span>
                                        )}
                                        {/* number */}
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td className="h-full py-24" colSpan={headers.length}>
                                <div className="flex flex-col items-center justify-center mb-4">
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
