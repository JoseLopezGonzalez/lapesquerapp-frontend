'use client'

import React from 'react';
import { Button } from '@/components/ui/button';
import { EllipsisVertical, PlusIcon, ChartPieIcon, TrashIcon, RefreshCw } from 'lucide-react';
import { PiMicrosoftExcelLogoFill } from 'react-icons/pi';
import { FaRegFilePdf } from 'react-icons/fa';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


export const EntityTableHeader = ({
    title = '',
    description = '',
    onCreate,
    filtersComponent,
    exports: exportOptions = [],
    reports: reportOptions = [],
    selectedRows = [],
    onSelectedRowsDelete,
    onExport,
    onReport,
    onRefresh,
    actions = [],
}) => {

    const existsSelectedRows = selectedRows && selectedRows.length > 0;
    const existsAnyOptions = exportOptions.length > 0 || reportOptions.length > 0 || actions.length > 0;

    return (
        <div className="px-6 py-4 pt-6 grid gap-3 md:flex md:justify-between md:items-center">
            <div>
                {title && <h2 className="text-xl font-medium">{title}</h2>}
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>

            <div>
                <div className="inline-flex gap-x-2">
                    {onRefresh && (
                        <Button onClick={onRefresh} variant="outline" size="sm">
                            <RefreshCw className="h-4 w-4" aria-hidden="true" />
                            <span className='hidden xl:block'>Recargar</span>
                        </Button>
                    )}

                    {existsSelectedRows && onSelectedRowsDelete && (
                        <Button onClick={onSelectedRowsDelete} variant="destructive" size="sm">
                            <TrashIcon className="h-4 w-4" aria-hidden="true" />
                            <span className='hidden xl:block'>Eliminar</span>
                        </Button>
                    )}

                    {existsAnyOptions && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" >
                                    Opciones <EllipsisVertical className="w-5 h-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-64" align="end">
                                {/* ACCIONES */}
                                {actions.length > 0 && (
                                    <>
                                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                        <DropdownMenuGroup>
                                            {actions.map((action) => (
                                                <DropdownMenuItem
                                                    key={action.title}
                                                    onClick={() => action.onClick?.(existsSelectedRows)}
                                                    className="cursor-pointer"
                                                >
                                                    {action.title}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuGroup>
                                    </>
                                )}
                                {/* EXPORTAR */}
                                {exportOptions.length > 0 && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuLabel>Exportar</DropdownMenuLabel>
                                        <DropdownMenuGroup>
                                            {exportOptions.map((opt) => (
                                                <DropdownMenuItem
                                                    key={`export-${opt.title}`}
                                                    onClick={() => onExport(opt, existsSelectedRows)}
                                                    className="cursor-pointer"
                                                >
                                                    {opt.type === "excel" || opt.type === "xlsx" ? (
                                                        <PiMicrosoftExcelLogoFill className="w-5 h-5 text-green-700 " />
                                                    ) : (
                                                        <FaRegFilePdf className="w-5 h-5 text-red-700 " />
                                                    )}
                                                    {opt.title}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuGroup>
                                    </>
                                )}

                                {/* REPORTES */}
                                {reportOptions.length > 0 && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuLabel>Reportes</DropdownMenuLabel>
                                        <DropdownMenuGroup>
                                            {reportOptions.map((opt) => (
                                                <DropdownMenuItem
                                                    key={`report-${opt.title}`}
                                                    onClick={() => onReport(opt, existsSelectedRows)}
                                                >
                                                    <ChartPieIcon className="w-4 h-4 mr-2" />
                                                    {opt.title}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuGroup>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                    {filtersComponent && filtersComponent}

                    {onCreate && (
                        <Button onClick={onCreate} size="sm">
                            <PlusIcon className="h-5 w-5" aria-hidden="true" />
                            Nuevo
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}; 