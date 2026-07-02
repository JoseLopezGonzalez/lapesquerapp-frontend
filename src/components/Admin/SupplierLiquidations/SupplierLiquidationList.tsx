// @ts-nocheck
'use client';
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Loader2, Search, SearchX, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/Utilities/EmptyState';
import { notify } from '@/lib/notifications';
import { DateRangePicker } from '@/components/ui/dateRangePicker';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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

interface AppliedFilters {
  startDate: string | undefined;
  endDate: string | undefined;
  onlyUnliquidated: boolean;
}

export function SupplierLiquidationList() {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: undefined,
    to: undefined,
  });
  const [onlyUnliquidated, setOnlyUnliquidated] = useState(false);
  const [applied, setApplied] = useState<AppliedFilters | null>(null);

  const startDate = dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined;
  const endDate = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined;
  const hasValidRange = !!startDate && !!endDate && startDate <= endDate;
  const canSearch = hasValidRange || onlyUnliquidated;

  const {
    data: suppliers = [],
    isLoading,
    error,
  } = useSuppliersWithActivity({
    startDate: applied?.startDate,
    endDate: applied?.endDate,
    onlyUnliquidated: applied?.onlyUnliquidated ?? false,
    enabled: !!applied,
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
    if (!canSearch) {
      notify.error({
        title: 'Filtro requerido',
        description: 'Seleccione un rango de fechas o active "Solo no liquidadas".',
      });
      return;
    }
    if (dateRange.from && dateRange.to && dateRange.from > dateRange.to) {
      notify.error({
        title: 'Fechas inválidas',
        description: 'La fecha de inicio debe ser anterior a la fecha de fin.',
      });
      return;
    }
    setApplied({ startDate, endDate, onlyUnliquidated });
  };

  const handleSupplierClick = (supplierId: number, ev?: React.MouseEvent) => {
    const params = new URLSearchParams();
    if (applied?.startDate) params.set('start', applied.startDate);
    if (applied?.endDate) params.set('end', applied.endDate);
    const qs = params.toString();
    window.open(`/admin/supplier-liquidations/${supplierId}${qs ? `?${qs}` : ''}`, '_blank');
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
              <div className="flex items-center gap-2 pb-0.5">
                <Checkbox
                  id="only-unliquidated"
                  checked={onlyUnliquidated}
                  onCheckedChange={(checked) => setOnlyUnliquidated(Boolean(checked))}
                />
                <Label htmlFor="only-unliquidated" className="cursor-pointer text-sm">
                  Solo no liquidadas
                </Label>
              </div>
              <Button
                onClick={handleBuscar}
                disabled={!canSearch || isLoading}
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
          <div className="flex h-full flex-col gap-3 pt-2">
            <div className="flex gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-8 flex-1" />
              ))}
            </div>
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-md" />
            ))}
          </div>
        )}

        {!isLoading && !error && !!applied && (
          <>
            {suppliers.length === 0 ? (
              <EmptyState
                title="No se encontraron proveedores con actividad"
                description="No hay recepciones ni salidas de cebo en el rango de fechas seleccionado."
                icon={<SearchX />}
              />
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
                        <TableHead className="bg-background text-right">
                          Importe Recepciones
                        </TableHead>
                        <TableHead className="bg-background text-right">Peso Salidas</TableHead>
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
                            {formatCurrency(supplier.total_receptions_amount)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatWeight(supplier.total_dispatches_weight)}
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

        {!isLoading && !error && !applied && (
          <EmptyState
            title="Selecciona un rango de fechas"
            description="O activa «Solo no liquidadas» para ver proveedores pendientes."
            icon={<Search />}
          />
        )}
      </div>
    </div>
  );
}
