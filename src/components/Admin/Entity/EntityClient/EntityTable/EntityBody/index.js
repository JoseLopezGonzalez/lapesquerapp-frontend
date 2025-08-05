'use client'

import React from "react";
import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/Utilities/EmptyState/index';
import { Checkbox } from '@/components/ui/checkbox';

export const EntityBody = ({ 
    data, 
    columns, 
    loading = false, 
    emptyState, 
    isSelectable = false, 
    selectedRows = [], 
    onSelectionChange,
    onEdit 
}) => {
    // Añadir columna de selección si corresponde
    const tableColumns = React.useMemo(() => {
        if (!isSelectable) return columns;
        
        return [
            {
                id: "select",
                header: ({ table }) => (
                    <Checkbox
                        checked={
                            selectedRows.length > 0 &&
                            selectedRows.length === data.rows.length
                        }
                        onCheckedChange={checked => {
        if (checked) {
                                const allIds = data.rows.map(row => row.id);
                                onSelectionChange?.(allIds);
                            } else {
                                onSelectionChange?.([]);
                            }
                        }}
                        aria-label="Seleccionar todas"
                    />
                ),
                cell: ({ row }) => (
                    <Checkbox
                        checked={selectedRows.includes(row.original.id)}
                        onCheckedChange={() => {
                            const id = row.original.id;
                            if (selectedRows.includes(id)) {
                                onSelectionChange?.(selectedRows.filter(rid => rid !== id));
        } else {
                                onSelectionChange?.([...selectedRows, id]);
                            }
                        }}
                        aria-label="Seleccionar fila"
                    />
                ),
                enableSorting: false,
                enableHiding: false,
                size: 32,
                meta: { cellClass: "!px-2 w-8" },
            },
            ...columns,
        ];
    }, [isSelectable, columns, selectedRows, data.rows, onSelectionChange]);

    const reactTable = useReactTable({
        data: data.rows,
        columns: tableColumns,
        getCoreRowModel: getCoreRowModel(),
    });

    // Loading state
    if (loading) {
        return (
            <Table>
                <TableBody>
                    {[...Array(17)].map((_, idx) => (
                        <TableRow key={idx}>
                            {tableColumns.map((col, i) => (
                                <TableCell key={i}>
                                    <Skeleton className="w-full h-6 rounded-lg" />
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        );
    }

    // Empty state
    if (!data.rows.length) {
        return (
            <div className="flex flex-col items-center justify-center mb-4 py-24 h-full">
                <EmptyState title={emptyState.title} description={emptyState.description} />
            </div>
        );
    }

    // Tabla normal
    return (
        <Table>
            <TableHeader className="sticky top-0 z-10 bg-foreground-50">
                {reactTable.getHeaderGroups().map(headerGroup => (
                    <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map(header => (
                            <TableHead key={header.id} className={header.column.columnDef.meta?.cellClass}>
                                {flexRender(header.column.columnDef.header, header.getContext())}
                            </TableHead>
                        ))}
                    </TableRow>
                ))}
            </TableHeader>
            <TableBody>
                {reactTable.getRowModel().rows.map(row => (
                    <TableRow key={row.id}>
                        {row.getVisibleCells().map(cell => (
                            <TableCell key={cell.id} className={cell.column.columnDef.meta?.cellClass}>
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};
