// @ts-nocheck
'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Loader2, ArrowLeft, Trash2, Download, Calendar, Lock, ChevronDown, ChevronRight, ChevronsDownUp, LayoutList, CalendarDays } from 'lucide-react';
import { notify } from '@/lib/notifications';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
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
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { supplierLiquidationKeys } from '@/lib/routes/queryKeys';
import { useSupplierLiquidationShow } from '@/hooks/useSupplierLiquidationShow';
import {
  deleteLiquidation,
  downloadLiquidationPdf,
} from '@/services/domain/supplier-liquidations/supplierLiquidationService';
import { SupplierLiquidationPdfDialog } from '@/components/Admin/SupplierLiquidations/SupplierLiquidationPdfDialog';
import { SupplierLiquidationCalendarView } from '@/components/Admin/SupplierLiquidations/SupplierLiquidationCalendarView';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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

  const [deleting, setDeleting] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [pdfPreviewDialogOpen, setPdfPreviewDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [hasManagementFee, setHasManagementFee] = useState(false);
  const [showTransferPayment, setShowTransferPayment] = useState(true);
  const [expandedReceptions, setExpandedReceptions] = useState<Set<number>>(() => new Set());
  const [expandedDispatches, setExpandedDispatches] = useState<Set<number>>(() => new Set());

  const { data, isLoading, error } = useSupplierLiquidationShow(liquidationId);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await notify.promise(deleteLiquidation(liquidationId), {
        loading: 'Eliminando liquidación...',
        success: 'Liquidación eliminada. Las recepciones y salidas han quedado libres.',
        error: (err: unknown) => {
          const e = err as { message?: string };
          return e?.message ?? 'Error al eliminar la liquidación';
        },
      });
      queryClient.invalidateQueries({
        queryKey: supplierLiquidationKeys.closedListPrefix(tenantId),
      });
      router.push('/admin/supplier-liquidations');
    } finally {
      setDeleting(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!data) return;
    if (!paymentMethod) {
      notify.error({ title: 'Selecciona un método de pago' });
      return;
    }
    setDownloadingPdf(true);
    try {
      await notify.promise(
        downloadLiquidationPdf({
          liquidationId,
          supplierName: data.supplier?.name ?? 'Liquidacion',
          paymentMethod,
          hasManagementFee,
          showTransferPayment,
        }),
        {
          loading: 'Generando PDF...',
          success: 'PDF descargado',
          error: (err: unknown) => {
            const e = err as { message?: string };
            return e?.message ?? 'Error al descargar el PDF';
          },
        }
      );
      setPdfPreviewDialogOpen(false);
    } finally {
      setDownloadingPdf(false);
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
            <Button
              variant="outline"
              onClick={() => router.push('/admin/supplier-liquidations')}
            >
              <ArrowLeft data-icon="inline-start" />
              Volver
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

  const allReceptionIds = receptions?.map((r) => r.id) ?? [];
  const allDispatchIds = allDispatches.map((d) => d.id);

  const allReceptionsExpanded =
    allReceptionIds.length > 0 && allReceptionIds.every((id) => expandedReceptions.has(id));
  const allDispatchesExpanded =
    allDispatchIds.length > 0 && allDispatchIds.every((id) => expandedDispatches.has(id));

  const toggleReceptionExpanded = (id: number) =>
    setExpandedReceptions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleDispatchExpanded = (id: number) =>
    setExpandedDispatches((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleExpandAllReceptions = () => {
    if (allReceptionsExpanded) {
      setExpandedReceptions(new Set());
    } else {
      setExpandedReceptions(new Set(allReceptionIds));
    }
  };

  const toggleExpandAllDispatches = () => {
    if (allDispatchesExpanded) {
      setExpandedDispatches(new Set());
    } else {
      setExpandedDispatches(new Set(allDispatchIds));
    }
  };

  return (
    <Tabs defaultValue="calendar" className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex flex-shrink-0 items-center justify-between p-6 pb-2">
        <Button variant="outline" onClick={() => router.push('/admin/supplier-liquidations')}>
          <ArrowLeft data-icon="inline-start" />
          Volver
        </Button>

        <div className="flex items-center gap-2">
          <TabsList>
            <TabsTrigger value="table">
              <LayoutList />
              Detalle
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <CalendarDays />
              Calendario
            </TabsTrigger>
          </TabsList>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={deleting}>
                {deleting ? (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : (
                  <Trash2 data-icon="inline-start" />
                )}
                Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar esta liquidación?</AlertDialogTitle>
                <AlertDialogDescription>
                  Las recepciones y salidas de cebo vinculadas quedarán disponibles de nuevo para
                  incluirse en futuras liquidaciones. Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button onClick={() => setPdfPreviewDialogOpen(true)}>
            <Download data-icon="inline-start" />
            Generar PDF
          </Button>
        </div>
      </div>

      <SupplierLiquidationPdfDialog
        open={pdfPreviewDialogOpen}
        onClose={() => setPdfPreviewDialogOpen(false)}
        title="Generar PDF"
        idPrefix="show"
        paymentMethod={paymentMethod}
        onPaymentMethodChange={setPaymentMethod}
        hasManagementFee={hasManagementFee}
        onHasManagementFeeChange={setHasManagementFee}
        showTransferPayment={showTransferPayment}
        onShowTransferPaymentChange={setShowTransferPayment}
        downloadingPdf={downloadingPdf}
        onDownload={handleDownloadPdf}
      />

      {/* Info proveedor + metadata */}
      <div className="bg-muted/50 mx-6 mb-2 flex-shrink-0 rounded-lg p-4">
        <div className="flex flex-wrap items-start gap-4 text-sm">
          <div>
            <p className="text-base font-semibold">{supplier?.name ?? '—'}</p>
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
              Creada el {formatDateTime(liquidation.closed_at)}
            </span>
          </div>
          <div className="ml-auto">
            <Badge variant="secondary">Liquidación #{liquidation.id}</Badge>
          </div>
        </div>
      </div>

      {/* Resumen de totales — barra compacta */}
      {summary && (
        <div className="mx-6 mb-2 flex-shrink-0">
          <div className="bg-muted/50 flex flex-wrap items-center gap-x-1 gap-y-1 rounded-lg px-4 py-2 text-sm">
            {/* Recepciones */}
            <span className="text-muted-foreground text-xs font-medium">Recepciones</span>
            <span className="font-semibold">{formatWeight(summary.total_receptions_weight)}</span>
            <span className="text-muted-foreground">·</span>
            <span className="font-semibold">{formatCurrency(summary.total_receptions_amount)}</span>

            {/* Declarado */}
            <Separator orientation="vertical" className="mx-2 h-4 shrink-0" />
            <span className="text-muted-foreground text-xs font-medium">Declarado</span>
            <span className={cn(
              'font-semibold',
              summary.weight_difference != null && Math.abs(summary.weight_difference) > 0.01
                ? 'text-amber-600 dark:text-amber-400'
                : ''
            )}>
              {formatWeight(summary.total_declared_weight)}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="font-semibold">{formatCurrency(summary.total_declared_amount)}</span>

            {/* Salidas cebo */}
            {(summary.total_dispatches ?? 0) > 0 && (
              <>
                <Separator orientation="vertical" className="mx-2 h-4 shrink-0" />
                <span className="text-muted-foreground text-xs font-medium">Salidas cebo</span>
                <span className="font-semibold">{formatWeight(summary.total_dispatches_weight)}</span>
                <span className="text-muted-foreground">·</span>
                {summary.has_iva_in_dispatches ? (
                  <>
                    <span className="text-muted-foreground text-xs">Base</span>
                    <span className="font-semibold">{formatCurrency(summary.total_dispatches_base_amount)}</span>
                    <span className="text-muted-foreground text-xs">IVA</span>
                    <span className="font-semibold">{formatCurrency(summary.total_dispatches_iva_amount)}</span>
                    <span className="text-muted-foreground">·</span>
                  </>
                ) : null}
                <span className="font-semibold">{formatCurrency(summary.total_dispatches_amount)}</span>
              </>
            )}

            {/* Resultado neto */}
            {summary.net_amount != null && (
              <>
                <Separator orientation="vertical" className="mx-2 h-4 shrink-0" />
                <span className="text-muted-foreground text-xs font-medium">Resultado neto</span>
                <span className={cn(
                  'font-bold',
                  summary.net_amount >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                )}>
                  {formatCurrency(summary.net_amount)}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      <ScrollArea className="h-full min-h-0 w-full flex-1">
        <TabsContent value="calendar" className="m-0">
          <SupplierLiquidationCalendarView
            receptions={receptions ?? []}
            dispatches={allDispatches}
            startDate={liquidation.start_date}
            endDate={liquidation.end_date}
          />
        </TabsContent>

        <TabsContent value="table" className="m-0 space-y-6 p-6 pt-2">
          {/* Tabla recepciones */}
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
              <div className="space-y-1.5">
                <CardTitle className="flex items-center gap-2">
                  Recepciones
                  <Badge variant="outline" className="text-xs font-normal">
                    {receptions?.length ?? 0}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Recepciones de materia prima incluidas en esta liquidación
                </CardDescription>
              </div>
              {allReceptionIds.length > 0 && (
                <Button variant="outline" size="sm" className="shrink-0" onClick={toggleExpandAllReceptions}>
                  <ChevronsDownUp data-icon="inline-start" />
                  {allReceptionsExpanded ? 'Contraer todo' : 'Expandir todo'}
                </Button>
              )}
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
                      receptions.map((reception: LiquidationReception) => {
                        const isReceptionExpanded = expandedReceptions.has(reception.id);
                        return (
                        <React.Fragment key={`reception-${reception.id}`}>
                          <TableRow
                            className="bg-blue-200/50 cursor-pointer font-bold dark:bg-blue-800/30"
                            aria-expanded={isReceptionExpanded}
                            onClick={() => toggleReceptionExpanded(reception.id)}
                          >
                            <TableCell>
                              <Lock className="text-muted-foreground h-3.5 w-3.5" />
                            </TableCell>
                            <TableCell colSpan={4}>
                              <span className="flex items-center gap-2">
                                {isReceptionExpanded ? (
                                  <ChevronDown className="text-muted-foreground h-4 w-4 shrink-0" />
                                ) : (
                                  <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
                                )}
                                Recepción #{reception.id} — {formatDate(reception.date)}
                              </span>
                            </TableCell>
                          </TableRow>
                          {isReceptionExpanded && reception.products?.map((product, i) => (
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
                          {isReceptionExpanded && reception.products && reception.products.length > 0 && (
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
                      );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                          No hay recepciones en esta liquidación
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                  {summary && (receptions?.length ?? 0) > 0 && (
                    <TableFooter>
                      <TableRow>
                        <TableCell />
                        <TableCell className="text-sm font-semibold">
                          Total — {summary.total_receptions ?? receptions?.length ?? 0}{' '}
                          {(summary.total_receptions ?? receptions?.length ?? 0) === 1
                            ? 'recepción'
                            : 'recepciones'}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatWeight(summary.total_receptions_weight)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-right text-xs">
                          {summary.total_declared_weight != null
                            ? `Decl: ${formatWeight(summary.total_declared_weight)}`
                            : '—'}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(summary.total_receptions_amount)}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  )}
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Tabla salidas de cebo */}
          {allDispatches.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div className="space-y-1.5">
                  <CardTitle className="flex items-center gap-2">
                    Salidas de Cebo
                    <Badge variant="outline" className="text-xs font-normal">
                      {allDispatches.length}
                    </Badge>
                  </CardTitle>
                  <CardDescription>Salidas de cebo incluidas en esta liquidación</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="shrink-0" onClick={toggleExpandAllDispatches}>
                  <ChevronsDownUp data-icon="inline-start" />
                  {allDispatchesExpanded ? 'Contraer todo' : 'Expandir todo'}
                </Button>
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
                      {allDispatches.map((dispatch: LiquidationDispatch) => {
                        const isDispatchExpanded = expandedDispatches.has(dispatch.id);
                        return (
                        <React.Fragment key={`dispatch-${dispatch.id}`}>
                          <TableRow
                            className="bg-orange-200/50 cursor-pointer font-bold dark:bg-orange-800/30"
                            aria-expanded={isDispatchExpanded}
                            onClick={() => toggleDispatchExpanded(dispatch.id)}
                          >
                            <TableCell>
                              <Lock className="text-muted-foreground h-3.5 w-3.5" />
                            </TableCell>
                            <TableCell colSpan={5}>
                              <div className="flex items-center gap-2">
                                {isDispatchExpanded ? (
                                  <ChevronDown className="text-muted-foreground h-4 w-4 shrink-0" />
                                ) : (
                                  <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
                                )}
                                <span>
                                  Salida #{dispatch.id} — {formatDate(dispatch.date)}
                                </span>
                                {dispatch.export_type && (
                                  <Badge
                                    variant={
                                      dispatch.export_type === 'a3erp' ? 'default' : 'secondary'
                                    }
                                    className="text-xs"
                                  >
                                    {dispatch.export_type === 'a3erp' ? 'A3ERP' : 'FACILCOM'}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                          {isDispatchExpanded && dispatch.products?.map((product, i) => {
                            let amountWithIva = product.amount;
                            if (
                              (dispatch.iva_amount ?? 0) > 0 &&
                              (dispatch.base_amount ?? 0) > 0
                            ) {
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
                          {isDispatchExpanded && dispatch.products && dispatch.products.length > 0 && (
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
                      );
                      })}
                    </TableBody>
                    {summary && (summary.total_dispatches ?? 0) > 0 && (
                      <TableFooter>
                        <TableRow>
                          <TableCell />
                          <TableCell className="text-sm font-semibold">
                            Total — {summary.total_dispatches ?? allDispatches.length}{' '}
                            {(summary.total_dispatches ?? allDispatches.length) === 1
                              ? 'salida'
                              : 'salidas'}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatWeight(summary.total_dispatches_weight)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-right text-xs">
                            {summary.has_iva_in_dispatches
                              ? `IVA: ${formatCurrency(summary.total_dispatches_iva_amount)}`
                              : '—'}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(summary.total_dispatches_base_amount)}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(summary.total_dispatches_amount)}
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    )}
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </ScrollArea>
    </Tabs>
  );
}
