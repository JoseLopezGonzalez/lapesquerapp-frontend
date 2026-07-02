// @ts-nocheck
'use client';
import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Loader2,
  Eye,
  LockOpen,
  Filter,
  X,
  ChevronRight,
  FileX,
} from 'lucide-react';
import { notify } from '@/lib/notifications';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DateRangePicker } from '@/components/ui/dateRangePicker';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/Shadcn/Combobox';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { supplierLiquidationKeys } from '@/lib/routes/queryKeys';
import { useSupplierLiquidationsList } from '@/hooks/useSupplierLiquidationsList';
import { useSupplierOptions } from '@/hooks/useSupplierOptions';
import { reopenLiquidation } from '@/services/domain/supplier-liquidations/supplierLiquidationService';
import { PaginationFooter } from '@/components/Admin/Entity/EntityClient/EntityTable/EntityFooter/PaginationFooter';
import { EmptyState } from '@/components/Utilities/EmptyState';
import type { SupplierLiquidationListFilters } from '@/types/supplierLiquidation';

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    return format(new Date(dateString), 'dd/MM/yyyy');
  } catch {
    return String(dateString);
  }
}

function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
  } catch {
    return String(dateString);
  }
}

interface ActiveFilters {
  suppliers: number[];
  dates: { from?: Date; to?: Date };
  closedAt: { from?: Date; to?: Date };
}

export function SupplierLiquidationsCrudList() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  const [page, setPage] = useState(1);
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
    suppliers: [],
    dates: {},
    closedAt: {},
  });
  const [draftFilters, setDraftFilters] = useState<ActiveFilters>({
    suppliers: [],
    dates: {},
    closedAt: {},
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const [reopeningId, setReopeningId] = useState<number | null>(null);

  const { supplierOptions } = useSupplierOptions();

  const queryFilters: SupplierLiquidationListFilters = {
    suppliers: activeFilters.suppliers.length ? activeFilters.suppliers : undefined,
    dates:
      activeFilters.dates.from || activeFilters.dates.to
        ? {
            start: activeFilters.dates.from
              ? format(activeFilters.dates.from, 'yyyy-MM-dd')
              : undefined,
            end: activeFilters.dates.to
              ? format(activeFilters.dates.to, 'yyyy-MM-dd')
              : undefined,
          }
        : undefined,
    closed_at:
      activeFilters.closedAt.from || activeFilters.closedAt.to
        ? {
            start: activeFilters.closedAt.from
              ? format(activeFilters.closedAt.from, 'yyyy-MM-dd')
              : undefined,
            end: activeFilters.closedAt.to
              ? format(activeFilters.closedAt.to, 'yyyy-MM-dd')
              : undefined,
          }
        : undefined,
    page,
    perPage: 15,
  };

  const { data, meta, isLoading, error } = useSupplierLiquidationsList(queryFilters);

  const hasActiveFilters =
    activeFilters.suppliers.length > 0 ||
    activeFilters.dates.from ||
    activeFilters.dates.to ||
    activeFilters.closedAt.from ||
    activeFilters.closedAt.to;

  const applyFilters = useCallback(() => {
    setActiveFilters(draftFilters);
    setPage(1);
    setFilterOpen(false);
  }, [draftFilters]);

  const clearFilters = useCallback(() => {
    const empty: ActiveFilters = { suppliers: [], dates: {}, closedAt: {} };
    setDraftFilters(empty);
    setActiveFilters(empty);
    setPage(1);
  }, []);

  const handleReopen = async (liquidationId: number) => {
    setReopeningId(liquidationId);
    try {
      await notify.promise(reopenLiquidation(liquidationId), {
        loading: 'Reabriendo liquidación...',
        success: 'Liquidación reabierta correctamente',
        error: (err: unknown) => {
          const e = err as { message?: string };
          return e?.message ?? 'Error al reabrir la liquidación';
        },
      });
      queryClient.invalidateQueries({
        queryKey: supplierLiquidationKeys.closedListPrefix(tenantId),
      });
    } finally {
      setReopeningId(null);
    }
  };

  const handleViewDetail = (liquidationId: number) => {
    router.push(`/admin/supplier-liquidations/show/${liquidationId}`);
  };

  const selectedSupplierOptions = draftFilters.suppliers.map((id) => {
    const found = supplierOptions?.find((o) => Number(o.value) === id);
    return found ?? { value: id, label: String(id) };
  });

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex flex-shrink-0 items-center justify-between border-b px-6 py-4">
        <div>
          <p className="text-muted-foreground text-sm">
            {meta.total > 0
              ? `${meta.total} liquidación${meta.total !== 1 ? 'es' : ''} cerrada${meta.total !== 1 ? 's' : ''}`
              : 'Sin resultados'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
              <X className="mr-1 h-3.5 w-3.5" />
              Limpiar filtros
            </Button>
          )}
          <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filtros
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2 h-5 rounded-full px-1.5 text-xs">
                    {
                      [
                        activeFilters.suppliers.length > 0,
                        !!(activeFilters.dates.from || activeFilters.dates.to),
                        !!(activeFilters.closedAt.from || activeFilters.closedAt.to),
                      ].filter(Boolean).length
                    }
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filtros</SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-6">
                {/* Proveedor */}
                <div className="space-y-2">
                  <Label>Proveedor</Label>
                  <Combobox
                    options={supplierOptions ?? []}
                    value={
                      draftFilters.suppliers.length ? String(draftFilters.suppliers[0]) : null
                    }
                    onChange={(val) =>
                      setDraftFilters((prev) => ({
                        ...prev,
                        suppliers: val ? [Number(val)] : [],
                      }))
                    }
                    placeholder="Todos los proveedores"
                    searchPlaceholder="Buscar proveedor..."
                    notFoundMessage="No encontrado"
                  />
                </div>

                {/* Período de liquidación */}
                <div className="space-y-2">
                  <Label>Período de liquidación</Label>
                  <DateRangePicker
                    dateRange={draftFilters.dates}
                    onChange={(range) =>
                      setDraftFilters((prev) => ({ ...prev, dates: range }))
                    }
                  />
                </div>

                {/* Fecha de cierre */}
                <div className="space-y-2">
                  <Label>Fecha de cierre</Label>
                  <DateRangePicker
                    dateRange={draftFilters.closedAt}
                    onChange={(range) =>
                      setDraftFilters((prev) => ({ ...prev, closedAt: range }))
                    }
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button className="flex-1" onClick={applyFilters}>
                    Aplicar
                  </Button>
                  <Button variant="outline" onClick={() => setFilterOpen(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Tabla */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md" />
            ))}
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center p-6">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        ) : data.length === 0 ? (
          <EmptyState
            title="No hay liquidaciones cerradas"
            description={
              hasActiveFilters
                ? 'Prueba a ajustar los filtros.'
                : 'Aún no se ha cerrado ninguna liquidación.'
            }
            icon={<FileX />}
          />
        ) : (
          <Table>
            <TableHeader className="bg-background sticky top-0 z-10">
              <TableRow>
                <TableHead>Proveedor</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Fecha de cierre</TableHead>
                <TableHead>Cerrada por</TableHead>
                <TableHead className="text-right">Recepciones</TableHead>
                <TableHead className="text-right">Salidas cebo</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow
                  key={item.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleViewDetail(item.id)}
                >
                  <TableCell className="font-medium">{item.supplier?.name ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(item.start_date)} — {formatDate(item.end_date)}
                  </TableCell>
                  <TableCell className="text-sm">{formatDateTime(item.closed_at)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {item.closed_by?.name ?? '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="text-xs">
                      {item.receptions_count}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="text-xs">
                      {item.dispatches_count}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div
                      className="flex items-center justify-end gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetail(item.id)}
                        title="Ver detalle"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={reopeningId === item.id}
                            title="Reabrir liquidación"
                          >
                            {reopeningId === item.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <LockOpen className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Reabrir esta liquidación?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Las recepciones y salidas de cebo vinculadas quedarán disponibles
                              de nuevo para incluirse en futuras liquidaciones.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleReopen(item.id)}>
                              Reabrir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <ChevronRight className="text-muted-foreground h-4 w-4" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Paginación */}
      {!isLoading && meta.totalPages > 1 && (
        <div className="border-t px-6 py-3">
          <PaginationFooter
            meta={meta}
            currentPage={page}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
