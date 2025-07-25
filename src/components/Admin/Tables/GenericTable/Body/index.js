'use client'

import React from "react";
import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { generateColumns } from "../generateColumns";
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/Utilities/EmptyState/index';
import { Checkbox } from '@/components/ui/checkbox';

export const Body = ({ table, data, emptyState, isSelectable = false, onSelectionChange, selectedRows = [], onEdit }) => {
  // columns se memoiza para evitar renders innecesarios
  const baseColumns = React.useMemo(() => generateColumns(table.headers, { onEdit }), [table.headers, onEdit]);

  // Añadir columna de selección si corresponde
  const columns = React.useMemo(() => {
    if (!isSelectable) return baseColumns;
    return [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Seleccionar todas"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={value => row.toggleSelected(!!value)}
            aria-label="Seleccionar fila"
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 32,
        meta: { cellClass: "!px-2 w-8" },
      },
      ...baseColumns,
    ];
  }, [isSelectable, baseColumns]);

  // Sincronizar el estado de selección interno de React Table con selectedRows externo
  const rowSelection = React.useMemo(() => {
    // selectedRows es un array de ids
    const selection = {};
    for (const row of data.rows) {
      if (selectedRows.includes(row.id)) selection[row.id] = true;
    }
    return selection;
  }, [selectedRows, data.rows]);

  const handleRowSelectionChange = React.useCallback(
    (updater) => {
      // updater puede ser un objeto o una función
      let newSelection = typeof updater === "function" ? updater(rowSelection) : updater;
      // newSelection es un objeto { [rowId]: true }
      const newSelectedRows = Object.keys(newSelection).filter((id) => newSelection[id]);
      onSelectionChange?.(newSelectedRows);
    },
    [onSelectionChange, rowSelection]
  );

  const reactTable = useReactTable({
    data: data.rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      rowSelection,
    },
    onRowSelectionChange: handleRowSelectionChange,
    enableRowSelection: isSelectable,
  });

  // Loading state
  if (data.loading) {
    return (
      <Table>
        <TableBody>
          {[...Array(14)].map((_, idx) => (
            <TableRow key={idx}>
              {columns.map((col, i) => (
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
      <div className="flex flex-col items-center justify-center mb-4 py-24">
        <EmptyState title={emptyState.title} description={emptyState.description} />
      </div>
    );
  }

  // Tabla normal
  return (
    <Table>
      <TableHeader>
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
          <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
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
