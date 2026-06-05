// @ts-nocheck
'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Loader2, ArrowLeft, LockOpen, Lock, User, Calendar } from 'lucide-react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
import { supplierLiquidationKeys } from '@/lib/routes/queryKeys';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { useSupplierLiquidationShow } from '@/hooks/useSupplierLiquidationShow';
import { reopenLiquidation } from '@/services/domain/supplier-liquidations/supplierLiquidationService';
import type { LiquidationReception, LiquidationDispatch } from '@/types/supplierLiquidation';

function formatCurrency(value: number | undefined | null): string {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value ?? 0);
}

function formatWeight(value: number | undefined | null): string {
  return (
    new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
      value ?? 0
    ) + ' kg'
  );
}

function formatPricePerKg(value: number | undefined | null): string {
  return (
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value ?? 0) +
    '/kg'
  );
}

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
    return format(new Date(dateString), "dd/MM/yyyy 'a las' HH:mm");
  } catch {
    return String(dateString);
  }
}

export function SupplierLiquidationShowDetail({ liquidationId }: { liquidationId: number }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const [reopening, setReopening] = useState(false);

  const { data, isLoading, error } = useSupplierLiquidationShow(liquidationId);

  const handleReopen = async () => {
    setReopening(true);
    try {
      await notify.promise(reopenLiquidation(liquidationId), {
        loading: 'Reabriendo liquidación...',
        success: 'Liquidación reabierta. Redirigiendo...',
        error: (err: unknown) => {
          const e = err as { message?: string };
          return e?.message ?? 'Error al reabrir la liquidación';
        },
      });
      queryClient.invalidateQueries({
        queryKey: supplierLiquidationKeys.closedListPrefix(tenantId),
      });
      router.push('/admin/supplier-liquidations?tab=historial');
    } finally {
      setReopening(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full min-h-0 w-full items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-full min-h-0 w-full items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive mb-4">
              {(error as Error)?.message ?? 'No se pudo cargar la liquidación'}
            </p>
            <Button variant="outline" onClick={() => router.push('/admin/supplier-liquidations?tab=historial')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al historial
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { liquidation, supplier, receptions, dispatches, summary } = data;
  const allRelatedDispatches =
    receptions?.flatMap((r) => r.related_dispatches ?? []) ?? [];
  const allDispatches = [...allRelatedDispatches, ...(dispatches ?? [])];

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex flex-shrink-0 items-center justify-between p-6 pb-2">
        <Button
          variant="outline"
          onClick={() => router.push('/admin/supplier-liquidations?tab=historial')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al historial
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" disabled={reopening}>
              {reopening ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LockOpen className="mr-2 h-4 w-4" />
              )}
              Reabrir Liquidación
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Reabrir esta liquidación?</AlertDialogTitle>
              <AlertDialogDescription>
                Las recepciones y salidas de cebo vinculadas quedarán disponibles de nuevo para
                incluirse en futuras liquidaciones. Esta acción no se puede deshacer
                automáticamente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleReopen}>Reabrir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Info del proveedor y liquidación */}
      <div className="bg-muted/50 mx-6 mb-2 flex-shrink-0 rounded-lg p-4">
        <div className="flex flex-wrap items-start gap-4 text-sm">
          <div>
            <p className="text-lg font-semibold">{supplier?.name ?? '—'}</p>
            {supplier?.contact_person && (
              <p className="text-muted-foreground text-xs">{supplier.contact_person}</p>
            )}
            {supplier?.phone && (
              <p className="text-muted-foreground text-xs">{supplier.phone}</p>
            )}
          </div>
          <Separator orientation="vertical" className="hidden h-10 sm:block" />
          <div className="flex items-center gap-1.5">
            <Calendar className="text-muted-foreground h-4 w-4 shrink-0" />
            <span className="text-muted-foreground">
              {formatDate(liquidation.start_date)} — {formatDate(liquidation.end_date)}
            </span>
          </div>
          <Separator orientation="vertical" className="hidden h-10 sm:block" />
          <div className="flex items-center gap-1.5">
            <Lock className="text-muted-foreground h-4 w-4 shrink-0" />
            <span className="text-muted-foreground">
              Cerrada el {formatDateTime(liquidation.closed_at)}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <Badge variant="secondary" className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {/* closed_by no está en el show response actualmente — se puede añadir */}
              Liquidación #{liquidation.id}
            </Badge>
          </div>
        </div>
      </div>

      {/* Resumen */}
      {summary && (
        <div className="mx-6 mb-2 flex-shrink-0">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-muted-foreground text-xs">Peso recepcionado</p>
              <p className="mt-0.5 font-semibold">{formatWeight(summary.total_receptions_weight)}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-muted-foreground text-xs">Importe recepcionado</p>
              <p className="mt-0.5 font-semibold">{formatCurrency(summary.total_receptions_amount)}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-muted-foreground text-xs">Peso declarado</p>
              <p className="mt-0.5 font-semibold">{formatWeight(summary.total_declared_weight)}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-muted-foreground text-xs">Importe declarado</p>
              <p className="mt-0.5 font-semibold">{formatCurrency(summary.total_declared_amount)}</p>
            </div>
            {summary.total_dispatches > 0 && (
              <>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs">Peso salidas cebo</p>
                  <p className="mt-0.5 font-semibold">{formatWeight(summary.total_dispatches_weight)}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs">Base salidas cebo</p>
                  <p className="mt-0.5 font-semibold">{formatCurrency(summary.total_dispatches_base_amount)}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs">IVA salidas cebo</p>
                  <p className="mt-0.5 font-semibold">{formatCurrency(summary.total_dispatches_iva_amount)}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs">Total salidas cebo</p>
                  <p className="mt-0.5 font-semibold">{formatCurrency(summary.total_dispatches_amount)}</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <ScrollArea className="h-full min-h-0 w-full flex-1">
        <div className="space-y-6 p-6 pt-2">
          {/* Tabla recepciones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Recepciones
                <Badge variant="outline" className="text-xs font-normal">
                  {receptions?.length ?? 0}
                </Badge>
              </CardTitle>
              <CardDescription>
                Recepciones de materia prima con sus productos y salidas relacionadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8" />
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Peso Neto</TableHead>
                      <TableHead className="text-right">Precio</TableHead>
                      <TableHead className="text-right">Importe</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receptions && receptions.length > 0 ? (
                      receptions.map((reception: LiquidationReception) => (
                        <React.Fragment key={`reception-${reception.id}`}>
                          <TableRow className="bg-blue-200/50 font-bold dark:bg-blue-800/30">
                            <TableCell>
                              <Lock className="text-muted-foreground h-3.5 w-3.5" />
                            </TableCell>
                            <TableCell colSpan={4}>
                              Recepción #{reception.id} — {formatDate(reception.date)}
                            </TableCell>
                          </TableRow>
                          {reception.products?.map((product, i) => (
                            <TableRow
                              key={`rec-${reception.id}-p-${product.id ?? i}`}
                              className="bg-blue-50/50 dark:bg-blue-950/20"
                            >
                              <TableCell />
                              <TableCell className="pl-8">
                                <span className="text-muted-foreground mr-2">└─</span>
                                {product.product?.name ?? '—'}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatWeight(product.net_weight)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatPricePerKg(product.price)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(product.amount)}
                              </TableCell>
                            </TableRow>
                          ))}
                          {reception.products && reception.products.length > 0 && (
                            <>
                              <TableRow className="bg-blue-100/50 font-semibold dark:bg-blue-900/30">
                                <TableCell />
                                <TableCell>Total</TableCell>
                                <TableCell className="text-right">
                                  {formatWeight(reception.calculated_total_net_weight)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {reception.average_price
                                    ? formatPricePerKg(reception.average_price)
                                    : '—'}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(reception.calculated_total_amount)}
                                </TableCell>
                              </TableRow>
                              {reception.declared_total_net_weight != null && (
                                <TableRow className="bg-blue-50/50 text-sm dark:bg-blue-950/20">
                                  <TableCell />
                                  <TableCell>Total Declarado</TableCell>
                                  <TableCell className="text-right">
                                    {formatWeight(reception.declared_total_net_weight)}
                                  </TableCell>
                                  <TableCell />
                                  <TableCell className="text-right">
                                    {formatCurrency(reception.declared_total_amount)}
                                  </TableCell>
                                </TableRow>
                              )}
                            </>
                          )}
                        </React.Fragment>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                          No hay recepciones en esta liquidación
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Tabla salidas de cebo */}
          {allDispatches.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Salidas de Cebo
                  <Badge variant="outline" className="text-xs font-normal">
                    {allDispatches.length}
                  </Badge>
                </CardTitle>
                <CardDescription>Todas las salidas de cebo del período</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8" />
                        <TableHead>Producto</TableHead>
                        <TableHead className="text-right">Peso Neto</TableHead>
                        <TableHead className="text-right">Precio</TableHead>
                        <TableHead className="text-right">Base</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allDispatches.map((dispatch: LiquidationDispatch) => (
                        <React.Fragment key={`dispatch-${dispatch.id}`}>
                          <TableRow className="bg-orange-200/50 font-bold dark:bg-orange-800/30">
                            <TableCell>
                              <Lock className="text-muted-foreground h-3.5 w-3.5" />
                            </TableCell>
                            <TableCell colSpan={5}>
                              <div className="flex items-center gap-2">
                                <span>
                                  Salida #{dispatch.id} — {formatDate(dispatch.date)}
                                </span>
                                {dispatch.export_type && (
                                  <Badge
                                    variant={dispatch.export_type === 'a3erp' ? 'default' : 'secondary'}
                                    className="text-xs"
                                  >
                                    {dispatch.export_type === 'a3erp' ? 'A3ERP' : 'FACILCOM'}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                          {dispatch.products?.map((product, i) => {
                            let amountWithIva = product.amount;
                            if ((dispatch.iva_amount ?? 0) > 0 && (dispatch.base_amount ?? 0) > 0) {
                              amountWithIva +=
                                (product.amount / dispatch.base_amount) * dispatch.iva_amount;
                            }
                            return (
                              <TableRow
                                key={`dispatch-${dispatch.id}-p-${product.id ?? i}`}
                                className="bg-orange-50/50 dark:bg-orange-950/20"
                              >
                                <TableCell />
                                <TableCell className="pl-8">
                                  <span className="text-muted-foreground mr-2">└─</span>
                                  {product.product?.name ?? '—'}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatWeight(product.net_weight)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatPricePerKg(product.price)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(product.amount)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(amountWithIva)}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          {dispatch.products && dispatch.products.length > 0 && (
                            <TableRow className="bg-orange-100/50 font-semibold dark:bg-orange-900/30">
                              <TableCell />
                              <TableCell>Total</TableCell>
                              <TableCell className="text-right">
                                {formatWeight(dispatch.total_net_weight)}
                              </TableCell>
                              <TableCell />
                              <TableCell className="text-right">
                                {formatCurrency(dispatch.base_amount ?? dispatch.total_amount)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(dispatch.total_amount)}
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
