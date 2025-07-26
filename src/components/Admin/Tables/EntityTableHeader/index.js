'use client'

import React from 'react';
import { Button } from '@/components/ui/button';
import { EllipsisVertical, PlusIcon, Download, ChartPieIcon, TrashIcon } from 'lucide-react';
import { Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@nextui-org/react';
import { PiMicrosoftExcelLogoFill } from 'react-icons/pi';
import { FaRegFilePdf } from 'react-icons/fa';

export const EntityTableHeader = ({
  title = '',
  description = '',
  onCreate,
  filtersComponent,
  actions = [],
  exports: exportOptions = [],
  reports: reportOptions = [],
  selectedRows = [],
  onSelectedRowsDelete,
  onSelectedRowsExport,
  onSelectedRowsReport,
  onExport,
  onReport,
}) => {
  return (
    <div className="px-6 py-4 pt-6 grid gap-3 md:flex md:justify-between md:items-center">
      {/* Título y descripción */}
      <div>
        {title && <h2 className="text-xl font-medium">{title}</h2>}
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>

      {/* Barra de acciones */}
      <div>
        <div className="inline-flex gap-x-2">
          {/* Acciones masivas si hay selección */}
          {selectedRows.length > 0 && (
            <>
              {onSelectedRowsDelete && (
                <Button onClick={onSelectedRowsDelete} variant="destructive">
                  <TrashIcon className="h-4 w-4" aria-hidden="true" />
                  <span className='hidden xl:flex'>Eliminar</span>
                </Button>
              )}
              {/* Reportes por selección */}
              {reportOptions.length > 0 && onSelectedRowsReport && (
                <Dropdown backdrop="opaque">
                  <DropdownTrigger>
                    <Button variant='outline'>
                      <ChartPieIcon className="h-4 w-4" aria-hidden="true" />
                      <span className='hidden xl:flex'>Reportes</span>
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu variant="faded" aria-label="Dropdown menu with icons">
                    {reportOptions.map((reportOption) => (
                      <DropdownItem
                        key={reportOption.title}
                        onClick={() => onSelectedRowsReport(reportOption)}
                      >
                        {reportOption.title}
                      </DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>
              )}
              {/* Exportar por selección */}
              {exportOptions.length > 0 && onSelectedRowsExport && (
                <Dropdown backdrop="opaque">
                  <DropdownTrigger>
                    <Button variant='outline'>
                      <Download className="h-4 w-4" aria-hidden="true" />
                      <span className='hidden xl:flex'>Exportar</span>
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu variant="faded" aria-label="Dropdown menu with icons">
                    {exportOptions.map((exportOption) => (
                      <DropdownItem
                        key={exportOption.title}
                        onClick={() => onSelectedRowsExport(exportOption)}
                        startContent={
                          exportOption.type === 'excel'
                            ? <PiMicrosoftExcelLogoFill className="text-green-700 w-6 h-6" />
                            : <FaRegFilePdf className="text-red-800 w-5 h-5" />
                        }
                      >
                        {exportOption.title}
                      </DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>
              )}
            </>
          )}
          {/* Acciones globales si NO hay selección */}
          {selectedRows.length === 0 && (
            <>
              {/* Reportes globales */}
              {reportOptions.length > 0 && onReport && (
                <Dropdown backdrop="opaque">
                  <DropdownTrigger>
                    <Button variant='outline'>
                      <ChartPieIcon className="h-4 w-4" aria-hidden="true" />
                      <span className='hidden xl:flex'>Reportes</span>
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu variant="faded" aria-label="Dropdown menu with icons">
                    {reportOptions.map((reportOption) => (
                      <DropdownItem
                        key={reportOption.title}
                        onClick={() => onReport(reportOption)}
                      >
                        {reportOption.title}
                      </DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>
              )}
              {/* Exportar global */}
              {exportOptions.length > 0 && onExport && (
                <Dropdown backdrop="opaque">
                  <DropdownTrigger>
                    <Button variant='outline'>
                      <Download className="h-4 w-4" aria-hidden="true" />
                      <span className='hidden xl:flex'>Exportar</span>
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu variant="faded" aria-label="Dropdown menu with icons">
                    {exportOptions.map((exportOption) => (
                      <DropdownItem
                        key={exportOption.title}
                        onClick={() => onExport(exportOption)}
                        startContent={
                          exportOption.type === 'excel'
                            ? <PiMicrosoftExcelLogoFill className="text-green-700 w-6 h-6" />
                            : <FaRegFilePdf className="text-red-800 w-5 h-5" />
                        }
                      >
                        {exportOption.title}
                      </DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>
              )}
              {/* Acciones globales */}
              {actions.length > 0 && (
                <Dropdown backdrop="opaque">
                  <DropdownTrigger>
                    <Button variant="outline" size="icon">
                      <EllipsisVertical className="h-5 w-5" aria-hidden="true" />
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu variant="faded" aria-label="Dropdown de acciones globales">
                    {actions.map((action) => (
                      <DropdownItem
                        key={action.title}
                        onClick={() => action.onClick?.(action)}
                      >
                        {action.title}
                      </DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>
              )}
            </>
          )}
          {/* Filtros */}
          {filtersComponent && filtersComponent}
          {/* Botón de crear */}
          {onCreate && (
            <Button onClick={onCreate}>
              <PlusIcon className="h-5 w-5" aria-hidden="true" />
              Nuevo
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}; 