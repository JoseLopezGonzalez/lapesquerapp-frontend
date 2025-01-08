'use client'

import { EmptyState } from '@/components/Utilities/EmptyState';
import { formatDate } from '@/helpers/formats/dates/formatDates';
import { formatNumberEsKg } from '@/helpers/formats/numbers/formatNumberES';
import { ArrowRightIcon, TrashIcon } from '@heroicons/react/24/outline';
import React, { useState, useEffect } from 'react';

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
        base: " text-yellow-500",
        outline: "text-yellow-400 border border-yellow-300 bg-yellow-800/25",
    },
    danger: {
        base: " text-red-800",
        outline: "text-red-400 border border-red-300 bg-red-800/25 ",
    },
    neutral: {
        base: " text-gray-800",
        outline: "text-gray-400 border border-gray-300 bg-gray-800/25",
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
        const style = badgeStyles[option.color] || badgeStyles.neutral;
        const className = option.outline ? style.outline : style.base;

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
                {option.label}
            </span>
        );
    };

    return (
        <div className="grow overflow-y-auto overflow-x-auto w-full">
            <table className="min-w-full divide-y divide-neutral-700">
                <thead className="bg-neutral-800 sticky top-0 z-10">
                    <tr>
                        {isSelectable && (
                            <th className="py-3.5 px-4 text-left text-sm font-semibold text-white">
                                <input
                                    type="checkbox"
                                    onChange={(e) => toggleSelectAll(e.target.checked)}
                                    checked={
                                        selectedRows.length > 0 &&
                                        selectedRows.length === data.rows.length
                                    }
                                />
                            </th>
                        )}
                        {headers.map((header) => (
                            <th key={header.name} scope="col" className="px-6 py-3 text-start">
                                <a className="group inline-flex items-center gap-x-2" href="#">
                                    <span className="text-xs font-semibold uppercase tracking-wide text-neutral-200">
                                        {header.label}
                                    </span>
                                </a>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-neutral-700">
                    {data.loading ? (
                        [...Array(Object.keys(headers).length)].map((_, index) => (
                            <tr key={index}>
                                {headers.map((_, idx) => (
                                    <td key={idx} className="px-6 py-3">
                                        <div className="w-full h-6 bg-neutral-600 rounded-md animate-pulse"></div>
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : data.rows.length > 0 ? (
                        data.rows.map((row, rowIndex) => (
                            <tr
                                key={rowIndex}
                                className={`hover:bg-neutral-800 transition-colors ${selectedRows.includes(row.id) ? 'bg-neutral-700' : ''}`}
                            >
                                {isSelectable && (
                                    <td className="py-2 px-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedRows.includes(row.id)}
                                            onChange={() => toggleSelectRow(row.id)}
                                        />
                                    </td>
                                )}
                                {headers.map((header, index) => (
                                    <td key={header.name} className="px-6 py-3 text-white">
                                        {header.type === 'badge' && renderBadge(header, row[header.name])}
                                        {header.type !== 'badge' && <span>{row[header.name]}</span>}
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td className="h-full py-48" colSpan={headers.length + (isSelectable ? 1 : 0)}>
                                <div className="flex flex-col items-center justify-center mb-4">
                                    <EmptyState
                                        title={emptyState.title}
                                        description={emptyState.description}
                                    />
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};
