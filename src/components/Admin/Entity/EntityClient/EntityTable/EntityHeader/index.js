'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  EllipsisVertical,
  PlusIcon,
  ChartPieIcon,
  TrashIcon,
  RefreshCw,
  Loader2,
} from 'lucide-react';
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
} from '@/components/ui/dropdown-menu';

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
  isRefreshing = false,
  isDeleting = false,
  isGeneratingReport = false,
  isExporting = false,
}) => {
  const existsSelectedRows = selectedRows && selectedRows.length > 0;
  const existsAnyOptions =
    exportOptions.length > 0 || reportOptions.length > 0 || actions.length > 0;

  return (
    <div className="grid gap-3 px-4 py-4 pt-6 sm:px-6 md:flex md:items-center md:justify-between">
      <div>
        {title && <h2 className="text-xl font-medium">{title}</h2>}
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
      </div>

      <div>
        <div className="flex flex-wrap justify-end gap-2">
          {onRefresh && (
            <Button
              onClick={onRefresh}
              variant="outline"
              size="sm"
              disabled={isRefreshing || isDeleting || isGeneratingReport || isExporting}
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
              )}
              <span className="hidden xl:block">Recargar</span>
            </Button>
          )}

          {existsSelectedRows && onSelectedRowsDelete && (
            <Button
              onClick={onSelectedRowsDelete}
              variant="destructive"
              size="sm"
              disabled={isRefreshing || isDeleting || isGeneratingReport || isExporting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <TrashIcon className="h-4 w-4" aria-hidden="true" />
              )}
              <span className="hidden xl:block">Eliminar</span>
            </Button>
          )}

          {existsAnyOptions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isRefreshing || isDeleting || isGeneratingReport || isExporting}
                >
                  {isGeneratingReport || isExporting ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : null}
                  Opciones <EllipsisVertical className="h-5 w-5" />
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
                          disabled={isRefreshing || isDeleting || isGeneratingReport || isExporting}
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
                          disabled={isRefreshing || isDeleting || isGeneratingReport || isExporting}
                        >
                          {opt.type === 'excel' || opt.type === 'xlsx' ? (
                            <PiMicrosoftExcelLogoFill className="h-5 w-5 text-green-700" />
                          ) : (
                            <FaRegFilePdf className="h-5 w-5 text-red-700" />
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
                          disabled={isRefreshing || isDeleting || isGeneratingReport || isExporting}
                        >
                          <ChartPieIcon className="mr-2 h-4 w-4" />
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
            <Button
              onClick={() => {
                if (typeof onCreate === 'string') {
                  window.open(onCreate, '_blank');
                } else if (onCreate && typeof onCreate === 'object' && onCreate.href) {
                  window.open(onCreate.href, '_blank');
                } else if (typeof onCreate === 'function') {
                  onCreate();
                }
              }}
              size="sm"
              disabled={isRefreshing || isDeleting || isGeneratingReport || isExporting}
            >
              <PlusIcon className="h-5 w-5" aria-hidden="true" />
              <span className="hidden sm:inline">Nuevo</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
