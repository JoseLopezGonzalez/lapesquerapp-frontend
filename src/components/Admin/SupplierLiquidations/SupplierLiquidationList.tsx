// @ts-nocheck
'use client';
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Loader2, Search, ChevronRight } from 'lucide-react';
import { notify } from '@/lib/notifications';
import { DateRangePicker } from '@/components/ui/dateRangePicker';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSuppliersWithActivity } from '@/hooks/useSuppliersWithActivity';
function formatCurrency(value: number | undefined | null): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(value ?? 0);
}

function formatWeight(value: number | undefined | null): string {
  return (
    new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value ?? 0) + ' kg'
  );
}

export function SupplierLiquidationList() {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: undefined,
    to: undefined,
  });

  const startDate = dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined;
  const endDate = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined;
  const hasValidRange = !!startDate && !!endDate && startDate <= endDate;

  const {
    data: suppliers = [],
    isLoading,
    error,
    refetch,
  } = useSuppliersWithActivity({
    startDate,
    endDate,
    enabled: hasValidRange,
  });

  useEffect(() => {
    if (error) {
      const msg =
        (error as { userMessage?: string; data?: { userMessage?: string }; message?: string })
          ?.userMessage ??
        (error as { data?: { userMessage?: string } })?.data?.userMessage ??
        (error as Error).message ??
        'Error al obtener la lista de proveedores';
      notify.error({ title: 'Error al cargar liquidaciones', description: msg });
    }
  }, [error]);

  const handleBuscar = () => {
    if (!dateRange.from || !dateRange.to) {
      notify.error({
        title: 'Rango de fechas requerido',
        description: 'Seleccione fecha de inicio y fin para buscar.',
      });
      return;
    }
    if (dateRange.from > dateRange.to) {
      notify.error({
        title: 'Fechas inválidas',
        description: 'La fecha de inicio debe ser anterior a la fecha de fin.',
      });
      return;
    }
    refetch();
  };

  const handleSupplierClick = (supplierId: number, ev?: React.MouseEvent) => {
    if (!dateRange.from || !dateRange.to) {
      notify.error({
        title: 'Rango de fechas requerido',
        description: 'Seleccione fecha de inicio y fin.',
      });
      return;
    }
    const s = format(dateRange.from, 'yyyy-MM-dd');
    const end = format(dateRange.to, 'yyyy-MM-dd');
    window.open(`/admin/supplier-liquidations/${supplierId}?start=${s}&end=${end}`, '_blank');
    ev?.stopPropagation();
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="flex-shrink-0 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Liquidación de Proveedores</CardTitle>
            <CardDescription>
              Seleccione un rango de fechas para ver los proveedores con actividad
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end">
              <div className="max-w-md flex-1">
                <label className="mb-2 block text-sm font-medium">Rango de fechas</label>
                <DateRangePicker dateRange={dateRange} onChange={setDateRange} />
              </div>
              <Button
                onClick={handleBuscar}
                disabled={!dateRange.from || !dateRange.to || isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Buscar
                  </>
                )}
              </Button>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive rounded-md p-4">
                {(error as Error).message}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 overflow-hidden px-6 pb-6">
        {isLoading && (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          </div>
        )}

        {!isLoading && !error && dateRange.from && dateRange.to && (
          <>
            {suppliers.length === 0 ? (
              <div className="text-muted-foreground flex h-full items-center justify-center py-12 text-center">
                <div>
                  <p className="mb-2 text-lg font-medium">
                    No se encontraron proveedores con actividad
                  </p>
                  <p className="text-sm">
                    No hay recepciones ni salidas de cebo en el rango de fechas seleccionado.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col overflow-hidden rounded-md border">
                <div className="flex-1 overflow-x-auto overflow-y-auto">
                  <Table>
                    <TableHeader className="bg-background sticky top-0 z-10 shadow-sm">
                      <TableRow>
                        <TableHead className="bg-background">Proveedor</TableHead>
                        <TableHead className="bg-background text-right">Recepciones</TableHead>
                        <TableHead className="bg-background text-right">Salidas de Cebo</TableHead>
                        <TableHead className="bg-background text-right">Peso Recepciones</TableHead>
                        <TableHead className="bg-background text-right">Peso Salidas</TableHead>
                        <TableHead className="bg-background text-right">
                          Importe Recepciones
                        </TableHead>
                        <TableHead className="bg-background text-right">Importe Salidas</TableHead>
                        <TableHead className="bg-background text-center">Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {suppliers.map((supplier) => (
                        <TableRow key={supplier.id}>
                          <TableCell className="font-medium">{supplier.name}</TableCell>
                          <TableCell className="text-right">
                            {supplier.receptions_count ?? 0}
                          </TableCell>
                          <TableCell className="text-right">
                            {supplier.dispatches_count ?? 0}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatWeight(supplier.total_receptions_weight)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatWeight(supplier.total_dispatches_weight)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(supplier.total_receptions_amount)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(supplier.total_dispatches_amount)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(ev) => handleSupplierClick(supplier.id, ev)}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </>
        )}

        {!isLoading && !error && (!dateRange.from || !dateRange.to) && (
          <div className="text-muted-foreground flex h-full items-center justify-center py-12 text-center">
            <p className="text-sm">Seleccione un rango de fechas para comenzar</p>
          </div>
        )}
      </div>
    </div>
  );
}
