// @ts-nocheck
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Loader2, ArrowLeft, Download, Lock, LockOpen, CheckCircle2 } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
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
import { useSupplierLiquidationDetails } from '@/hooks/useSupplierLiquidationDetails';
import {
  downloadSupplierLiquidationPdf,
  closeLiquidation,
  reopenLiquidation,
} from '@/services/domain/supplier-liquidations/supplierLiquidationService';
import type { LiquidationReception, LiquidationDispatch } from '@/types/supplierLiquidation';

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

function formatPricePerKg(value: number | undefined | null): string {
  return (
    new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(value ?? 0) + '/kg'
  );
}

function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '-';
  try {
    return format(new Date(dateString), 'dd/MM/yyyy');
  } catch {
    return String(dateString);
  }
}

export function SupplierLiquidationDetail({ supplierId }: { supplierId: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const startDate = searchParams.get('start') ?? undefined;
  const endDate = searchParams.get('end') ?? undefined;

  const { data, isLoading, error } = useSupplierLiquidationDetails({
    supplierId,
    startDate,
    endDate,
    enabled: !!startDate && !!endDate,
  });

  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [closingLiquidation, setClosingLiquidation] = useState(false);
  const [reopeningLiquidation, setReopeningLiquidation] = useState(false);
  const [selectedReceptions, setSelectedReceptions] = useState<number[]>([]);
  const [selectedDispatches, setSelectedDispatches] = useState<number[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [hasManagementFee, setHasManagementFee] = useState(false);
  const [showTransferPayment, setShowTransferPayment] = useState(true);

  // Inicializar selecciones cuando cargan los datos — solo items sin liquidar
  useEffect(() => {
    if (!data) return;
    const freeReceptionIds =
      data.receptions
        ?.filter((r) => !r.supplier_liquidation_id)
        .map((r) => r.id) ?? [];
    const freeDispatchIds =
      data.dispatches
        ?.filter((d) => !d.supplier_liquidation_id)
        .map((d) => d.id) ?? [];
    const freeRelatedDispatchIds =
      data.receptions?.flatMap(
        (r) => r.related_dispatches?.filter((d) => !d.supplier_liquidation_id).map((d) => d.id) ?? []
      ) ?? [];
    const freeAllDispatches = [...new Set([...freeDispatchIds, ...freeRelatedDispatchIds])];
    setSelectedReceptions(freeReceptionIds);
    setSelectedDispatches(freeAllDispatches);
  }, [data]);

  useEffect(() => {
    if (error) {
      const msg =
        (error as { userMessage?: string; data?: { userMessage?: string }; message?: string })
          ?.userMessage ??
        (error as { data?: { userMessage?: string } })?.data?.userMessage ??
        (error as Error).message ??
        'Error al obtener el detalle de la liquidación';
      notify.error({ title: msg });
    }
  }, [error]);

  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const liquidationQueryKey = supplierLiquidationKeys.detail(tenantId, supplierId, startDate, endDate);

  const handleDownloadPdf = async () => {
    if (!startDate || !endDate || !data) return;

    if (!paymentMethod) {
      notify.error({ title: 'Debe seleccionar un método de pago (Efectivo o Transferencia)' });
      return;
    }

    setDownloadingPdf(true);
    const allDispatches = [...(data.dispatches ?? [])];
    const relatedDispatches = data.receptions?.flatMap((r) => r.related_dispatches ?? []) ?? [];
    const totalDispatches = [
      ...new Set([...allDispatches.map((d) => d.id), ...relatedDispatches.map((d) => d.id)]),
    ];
    const independentDispatchIds = allDispatches.map((d) => d.id);
    const relatedDispatchIds = [...new Set(relatedDispatches.map((d) => d.id))];
    const allReceptionsSelected =
      selectedReceptions.length === (data.receptions?.length ?? 0) && selectedReceptions.length > 0;
    const allDispatchesSelected =
      selectedDispatches.length === totalDispatches.length && selectedDispatches.length > 0;
    const receptionsToSend = allReceptionsSelected ? [] : selectedReceptions;
    let dispatchesToSend: number[];
    if (allReceptionsSelected && allDispatchesSelected) {
      dispatchesToSend = [];
    } else if (allReceptionsSelected && !allDispatchesSelected) {
      dispatchesToSend = selectedDispatches;
    } else {
      const selectedRelated = selectedDispatches.filter((id) => relatedDispatchIds.includes(id));
      dispatchesToSend = [...new Set([...independentDispatchIds, ...selectedRelated])];
    }

    try {
      await notify.promise(
        downloadSupplierLiquidationPdf({
          supplierId,
          startDate,
          endDate,
          supplierName: data.supplier?.name ?? 'Proveedor',
          selectedReceptions: receptionsToSend,
          selectedDispatches: dispatchesToSend,
          paymentMethod,
          hasManagementFee,
          showTransferPayment,
        }),
        {
          loading: 'Generando PDF...',
          success: 'PDF descargado correctamente',
          error: (err: unknown) => {
            const e = err as { status?: number; message?: string };
            if (e?.status === 422)
              return 'Algunos IDs seleccionados no existen. Por favor, recargue la página.';
            if (e?.status === 404) return 'Proveedor no encontrado';
            return e?.message ?? 'Error al descargar el PDF';
          },
        }
      );
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleCloseLiquidation = async () => {
    if (!startDate || !endDate || !data) return;
    if (selectedReceptions.length === 0 && selectedDispatches.length === 0) {
      notify.error({ title: 'Selecciona al menos una recepción o salida de cebo para cerrar' });
      return;
    }

    setClosingLiquidation(true);
    try {
      await notify.promise(
        closeLiquidation({
          supplier_id: supplierId,
          start_date: startDate,
          end_date: endDate,
          reception_ids: selectedReceptions,
          dispatch_ids: selectedDispatches,
        }),
        {
          loading: 'Cerrando liquidación...',
          success: 'Liquidación cerrada correctamente',
          error: (err: unknown) => {
            const e = err as { status?: number; message?: string; data?: { message?: string } };
            if (e?.status === 422)
              return (
                e?.data?.message ??
                'Algún registro ya pertenece a otra liquidación. Recarga la página.'
              );
            return e?.message ?? 'Error al cerrar la liquidación';
          },
        }
      );
      queryClient.invalidateQueries({ queryKey: liquidationQueryKey });
    } finally {
      setClosingLiquidation(false);
    }
  };

  const handleReopenLiquidation = async () => {
    if (!data?.existing_liquidation) return;

    setReopeningLiquidation(true);
    try {
      await notify.promise(reopenLiquidation(data.existing_liquidation.id), {
        loading: 'Reabriendo liquidación...',
        success: 'Liquidación reabierta correctamente',
        error: (err: unknown) => {
          const e = err as { status?: number; message?: string };
          return e?.message ?? 'Error al reabrir la liquidación';
        },
      });
      queryClient.invalidateQueries({ queryKey: liquidationQueryKey });
    } finally {
      setReopeningLiquidation(false);
    }
  };

  const toggleReception = (receptionId: number, isLiquidated: boolean) => {
    if (isLiquidated) return;
    setSelectedReceptions((prev) =>
      prev.includes(receptionId) ? prev.filter((id) => id !== receptionId) : [...prev, receptionId]
    );
  };

  const toggleDispatch = (dispatchId: number, isLiquidated: boolean) => {
    if (isLiquidated) return;
    setSelectedDispatches((prev) =>
      prev.includes(dispatchId) ? prev.filter((id) => id !== dispatchId) : [...prev, dispatchId]
    );
  };

  const selectAllReceptions = () => {
    const freeIds = data?.receptions?.filter((r) => !r.supplier_liquidation_id).map((r) => r.id) ?? [];
    setSelectedReceptions(freeIds);
  };

  const deselectAllReceptions = () => setSelectedReceptions([]);

  const selectAllDispatches = () => {
    const freeDirectIds =
      data?.dispatches?.filter((d) => !d.supplier_liquidation_id).map((d) => d.id) ?? [];
    const freeRelatedIds =
      data?.receptions?.flatMap(
        (r) => r.related_dispatches?.filter((d) => !d.supplier_liquidation_id).map((d) => d.id) ?? []
      ) ?? [];
    setSelectedDispatches([...new Set([...freeDirectIds, ...freeRelatedIds])]);
  };

  const deselectAllDispatches = () => setSelectedDispatches([]);

  if (isLoading) {
    return (
      <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
        <ScrollArea className="h-full min-h-0 w-full flex-1">
          <div className="flex min-h-[400px] items-center justify-center p-6">
            <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          </div>
        </ScrollArea>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
        <ScrollArea className="h-full min-h-0 w-full flex-1">
          <div className="p-6">
            <Card>
              <CardContent className="pt-6">
                <div className="py-12 text-center">
                  <p className="text-destructive mb-2 text-lg font-medium">
                    {!startDate || !endDate
                      ? 'Fechas no especificadas'
                      : ((error as Error)?.message ?? 'Error al cargar los datos')}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/admin/supplier-liquidations')}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al listado
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </div>
    );
  }

  const { supplier, date_range, receptions, dispatches } = data;
  const existingLiquidation = data.existing_liquidation ?? null;
  const isClosed = !!existingLiquidation;

  const allRelatedDispatches =
    receptions?.flatMap((reception) => reception.related_dispatches ?? []) ?? [];
  const allDispatches = [...allRelatedDispatches, ...(dispatches ?? [])];

  // Para el checkbox "seleccionar todos" — solo cuenta los libres
  const freeReceptions = receptions?.filter((r) => !r.supplier_liquidation_id) ?? [];
  const freeDispatches = allDispatches.filter((d) => !d.supplier_liquidation_id);

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <div className="flex flex-shrink-0 items-center justify-between p-6 pb-2">
        <Button variant="outline" onClick={() => router.push('/admin/supplier-liquidations')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>

        <div className="flex items-center gap-2">
          {isClosed ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={reopeningLiquidation}>
                  {reopeningLiquidation ? (
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
                  <AlertDialogAction onClick={handleReopenLiquidation}>
                    Reabrir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button
              variant="outline"
              onClick={handleCloseLiquidation}
              disabled={closingLiquidation}
            >
              {closingLiquidation ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Lock className="mr-2 h-4 w-4" />
              )}
              Cerrar Liquidación
            </Button>
          )}

          <Button onClick={handleDownloadPdf} disabled={downloadingPdf}>
            {downloadingPdf ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Generar PDF
              </>
            )}
          </Button>
        </div>
      </div>

      {data && (
        <div className="bg-muted/50 mx-6 mb-2 flex-shrink-0 rounded-lg p-4">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="text-base font-semibold">{supplier?.name ?? '-'}</div>
            {supplier?.contact_person && (
              <span className="text-muted-foreground">• {supplier.contact_person}</span>
            )}
            {supplier?.phone && <span className="text-muted-foreground">• {supplier.phone}</span>}
            {supplier?.address && (
              <span className="text-muted-foreground">• {supplier.address}</span>
            )}
            <span className="text-muted-foreground ml-auto">
              {formatDate(date_range?.start)} - {formatDate(date_range?.end)}
            </span>
            {isClosed && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Liquidación cerrada el {formatDate(existingLiquidation.closed_at)}
              </Badge>
            )}
          </div>
        </div>
      )}

      {data?.summary && (
        <div className="bg-muted/50 mx-6 mb-2 flex-shrink-0 rounded-lg p-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium whitespace-nowrap">Método de pago cebo:</label>
              <div
                className="bg-muted relative inline-flex h-9 w-[180px] cursor-pointer items-center rounded-lg p-1"
                onClick={() => setPaymentMethod((m) => (m === 'cash' ? 'transfer' : 'cash'))}
              >
                <div
                  className={`bg-background absolute h-7 w-[86px] rounded-md shadow-sm transition-transform duration-200 ease-in-out ${
                    paymentMethod === 'cash' ? 'translate-x-0' : 'translate-x-[88px]'
                  }`}
                />
                <div className="relative flex h-full w-full items-center justify-center">
                  <span
                    className={`z-10 flex-1 text-center text-sm font-medium transition-colors duration-200 ${
                      paymentMethod === 'cash' ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    Efectivo
                  </span>
                  <span
                    className={`z-10 flex-1 text-center text-sm font-medium transition-colors duration-200 ${
                      paymentMethod === 'transfer' ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    Transferencia
                  </span>
                </div>
              </div>
            </div>
            <div className="border-border/50 border-t" />
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="hasManagementFee"
                  checked={hasManagementFee}
                  onCheckedChange={(checked) => setHasManagementFee(!!checked)}
                />
                <label htmlFor="hasManagementFee" className="cursor-pointer text-sm">
                  Lleva gasto de gestión (2.5% sobre declarado sin IVA)
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="showTransferPayment"
                  checked={showTransferPayment}
                  onCheckedChange={(checked) => setShowTransferPayment(!!checked)}
                />
                <label htmlFor="showTransferPayment" className="cursor-pointer text-sm">
                  Mostrar pago por transferencia
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      <ScrollArea className="h-full min-h-0 w-full flex-1">
        <div className="space-y-6 p-6 pt-2">
          <Card>
            <CardHeader>
              <CardTitle>Recepciones</CardTitle>
              <CardDescription>
                Recepciones de materia prima con sus productos y salidas relacionadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            freeReceptions.length > 0 &&
                            selectedReceptions.length === freeReceptions.length
                          }
                          onCheckedChange={(checked) =>
                            checked ? selectAllReceptions() : deselectAllReceptions()
                          }
                          disabled={freeReceptions.length === 0}
                        />
                      </TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Peso Neto</TableHead>
                      <TableHead className="text-right">Precio</TableHead>
                      <TableHead className="text-right">Importe</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receptions && receptions.length > 0 ? (
                      receptions.map((reception: LiquidationReception) => {
                        const isLiquidated = !!reception.supplier_liquidation_id;
                        return (
                          <React.Fragment key={`reception-${reception.id}`}>
                            <TableRow
                              className={
                                isLiquidated
                                  ? 'bg-muted/60 font-bold opacity-70'
                                  : 'bg-blue-200/50 font-bold dark:bg-blue-800/30'
                              }
                            >
                              <TableCell>
                                {isLiquidated ? (
                                  <Lock className="text-muted-foreground h-4 w-4" />
                                ) : (
                                  <Checkbox
                                    checked={selectedReceptions.includes(reception.id)}
                                    onCheckedChange={() =>
                                      toggleReception(reception.id, isLiquidated)
                                    }
                                  />
                                )}
                              </TableCell>
                              <TableCell colSpan={4}>
                                <div className="flex items-center gap-2">
                                  <span>
                                    Recepción #{reception.id} - {formatDate(reception.date)}
                                  </span>
                                  {isLiquidated && (
                                    <Badge variant="secondary" className="text-xs font-normal">
                                      Liquidada
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                            {reception.products?.map((product, productIndex) => (
                              <TableRow
                                key={`reception-${reception.id}-product-${product.id ?? productIndex}`}
                                className={
                                  isLiquidated
                                    ? 'bg-muted/30 opacity-70'
                                    : 'bg-blue-50/50 dark:bg-blue-950/20'
                                }
                              >
                                <TableCell />
                                <TableCell className="pl-8">
                                  <span className="text-muted-foreground mr-2">└─</span>
                                  {product.product?.name ?? '-'}
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
                                <TableRow
                                  className={
                                    isLiquidated
                                      ? 'bg-muted/40 font-semibold opacity-70'
                                      : 'bg-blue-100/50 font-semibold dark:bg-blue-900/30'
                                  }
                                >
                                  <TableCell />
                                  <TableCell>Total</TableCell>
                                  <TableCell className="text-right">
                                    {formatWeight(reception.calculated_total_net_weight)}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {reception.average_price
                                      ? formatPricePerKg(reception.average_price)
                                      : '-'}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {formatCurrency(reception.calculated_total_amount)}
                                  </TableCell>
                                </TableRow>
                                {reception.declared_total_net_weight != null &&
                                  reception.declared_total_net_weight !== undefined && (
                                    <TableRow
                                      className={
                                        isLiquidated
                                          ? 'bg-muted/30 text-sm opacity-70'
                                          : 'bg-blue-50/50 text-sm dark:bg-blue-950/20'
                                      }
                                    >
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
                          No hay recepciones en este período
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {allDispatches.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Salidas de Cebo</CardTitle>
                <CardDescription>Todas las salidas de cebo del período</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={
                              freeDispatches.length > 0 &&
                              selectedDispatches.length === freeDispatches.length
                            }
                            onCheckedChange={(checked) =>
                              checked ? selectAllDispatches() : deselectAllDispatches()
                            }
                            disabled={freeDispatches.length === 0}
                          />
                        </TableHead>
                        <TableHead>Producto</TableHead>
                        <TableHead className="text-right">Peso Neto</TableHead>
                        <TableHead className="text-right">Precio</TableHead>
                        <TableHead className="text-right">Base</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allDispatches.map((dispatch: LiquidationDispatch) => {
                        const isLiquidated = !!dispatch.supplier_liquidation_id;
                        return (
                          <React.Fragment key={`dispatch-${dispatch.id}`}>
                            <TableRow
                              className={
                                isLiquidated
                                  ? 'bg-muted/60 font-bold opacity-70'
                                  : 'bg-orange-200/50 font-bold dark:bg-orange-800/30'
                              }
                            >
                              <TableCell>
                                {isLiquidated ? (
                                  <Lock className="text-muted-foreground h-4 w-4" />
                                ) : (
                                  <Checkbox
                                    checked={selectedDispatches.includes(dispatch.id)}
                                    onCheckedChange={() =>
                                      toggleDispatch(dispatch.id, isLiquidated)
                                    }
                                  />
                                )}
                              </TableCell>
                              <TableCell colSpan={5}>
                                <div className="flex items-center gap-2">
                                  <span>
                                    Salida #{dispatch.id} - {formatDate(dispatch.date)}
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
                                  {isLiquidated && (
                                    <Badge variant="secondary" className="text-xs font-normal">
                                      Liquidada
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                            {dispatch.products?.map((product, productIndex) => {
                              let productAmountWithIva = product.amount;
                              if (
                                (dispatch.iva_amount ?? 0) > 0 &&
                                (dispatch.base_amount ?? 0) > 0
                              ) {
                                const ivaProportional =
                                  (product.amount / (dispatch.base_amount ?? 1)) *
                                  (dispatch.iva_amount ?? 0);
                                productAmountWithIva = product.amount + ivaProportional;
                              }
                              return (
                                <TableRow
                                  key={`dispatch-${dispatch.id}-product-${product.id ?? productIndex}`}
                                  className={
                                    isLiquidated
                                      ? 'bg-muted/30 opacity-70'
                                      : 'bg-orange-50/50 dark:bg-orange-950/20'
                                  }
                                >
                                  <TableCell />
                                  <TableCell className="pl-8">
                                    <span className="text-muted-foreground mr-2">└─</span>
                                    {product.product?.name ?? '-'}
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
                                    {formatCurrency(productAmountWithIva)}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                            {dispatch.products && dispatch.products.length > 0 && (
                              <TableRow
                                className={
                                  isLiquidated
                                    ? 'bg-muted/40 font-semibold opacity-70'
                                    : 'bg-orange-100/50 font-semibold dark:bg-orange-900/30'
                                }
                              >
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
