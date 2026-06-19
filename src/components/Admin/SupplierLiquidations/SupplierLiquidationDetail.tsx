// @ts-nocheck
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Loader2,
  ArrowLeft,
  Download,
  FilePlus,
  ListFilter,
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  LayoutList,
  CalendarDays,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SupplierLiquidationPdfDialog } from '@/components/Admin/SupplierLiquidations/SupplierLiquidationPdfDialog';
import { SupplierLiquidationCalendarView } from '@/components/Admin/SupplierLiquidations/SupplierLiquidationCalendarView';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { supplierLiquidationKeys } from '@/lib/routes/queryKeys';
import { useSupplierLiquidationDetails } from '@/hooks/useSupplierLiquidationDetails';
import {
  createLiquidation,
  downloadLiquidationPreviewPdf,
} from '@/services/domain/supplier-liquidations/supplierLiquidationService';
import { rawMaterialReceptionService } from '@/services/domain/raw-material-receptions/rawMaterialReceptionService';
import { ceboDispatchService } from '@/services/domain/cebo-dispatches/ceboDispatchService';
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

function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '-';
  try {
    return format(new Date(dateString), 'dd/MM/yyyy');
  } catch {
    return String(dateString);
  }
}

// ─── Dialog: items sin liquidar ──────────────────────────────────────────────

function PendingItemsDialog({
  supplierId,
  supplierName,
  open,
  onClose,
}: {
  supplierId: number;
  supplierName: string;
  open: boolean;
  onClose: () => void;
}) {
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  const { data: receptionsData, isLoading: loadingReceptions } = useQuery({
    queryKey: ['pending-receptions', tenantId, supplierId],
    queryFn: () =>
      rawMaterialReceptionService.list(
        { suppliers: [supplierId], liquidation_status: 'open' },
        { page: 1, perPage: 100 }
      ),
    enabled: open && !!tenantId,
  });

  const { data: dispatchesData, isLoading: loadingDispatches } = useQuery({
    queryKey: ['pending-dispatches', tenantId, supplierId],
    queryFn: () =>
      ceboDispatchService.list(
        { suppliers: [supplierId], liquidation_status: 'open' },
        { page: 1, perPage: 100 }
      ),
    enabled: open && !!tenantId,
  });

  const receptions = receptionsData?.data ?? [];
  const dispatches = dispatchesData?.data ?? [];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent size="4xl">
        <DialogHeader>
          <DialogTitle>Pendientes sin liquidar</DialogTitle>
          <DialogDescription>{supplierName}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="receptions">
          <TabsList>
            <TabsTrigger value="receptions">
              Recepciones
              {!loadingReceptions && (
                <Badge variant="secondary">{receptions.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="dispatches">
              Salidas de cebo
              {!loadingDispatches && (
                <Badge variant="secondary">{dispatches.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="receptions">
            {loadingReceptions ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-md" />
                ))}
              </div>
            ) : receptions.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                No hay recepciones sin liquidar para este proveedor
              </p>
            ) : (
              <div className="max-h-[400px] overflow-auto rounded-md border">
                <Table>
                  <TableHeader className="bg-background sticky top-0">
                    <TableRow>
                      <TableHead className="w-16">#</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Peso Neto</TableHead>
                      <TableHead className="text-right">Importe</TableHead>
                      <TableHead className="text-right">Importe Declarado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receptions.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-bold">#{r.id}</TableCell>
                        <TableCell>{formatDate(r.date)}</TableCell>
                        <TableCell className="text-right">
                          {r.netWeight != null
                            ? formatWeight(r.netWeight)
                            : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          {r.totalAmount != null
                            ? formatCurrency(r.totalAmount)
                            : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          {r.declaredTotalAmount != null
                            ? formatCurrency(r.declaredTotalAmount)
                            : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="dispatches">
            {loadingDispatches ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-md" />
                ))}
              </div>
            ) : dispatches.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                No hay salidas de cebo sin liquidar para este proveedor
              </p>
            ) : (
              <div className="max-h-[400px] overflow-auto rounded-md border">
                <Table>
                  <TableHeader className="bg-background sticky top-0">
                    <TableRow>
                      <TableHead className="w-16">#</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Peso Neto</TableHead>
                      <TableHead className="text-right">Notas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dispatches.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-bold">#{d.id}</TableCell>
                        <TableCell>{formatDate(d.date)}</TableCell>
                        <TableCell className="text-right">
                          {d.netWeight != null ? formatWeight(d.netWeight) : '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-right text-sm">
                          {d.notes || '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

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
  });

  const [creatingLiquidation, setCreatingLiquidation] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [pendingDialogOpen, setPendingDialogOpen] = useState(false);
  const [pdfPreviewDialogOpen, setPdfPreviewDialogOpen] = useState(false);
  const [selectedReceptions, setSelectedReceptions] = useState<number[]>([]);
  const [selectedDispatches, setSelectedDispatches] = useState<number[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [hasManagementFee, setHasManagementFee] = useState(false);
  const [showTransferPayment, setShowTransferPayment] = useState(true);
  const [expandedReceptions, setExpandedReceptions] = useState<Set<number>>(() => new Set());
  const [expandedDispatches, setExpandedDispatches] = useState<Set<number>>(() => new Set());
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');

  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  useEffect(() => {
    if (!data) return;
    const allReceptionIds =
      data.receptions?.filter((r) => !r.supplier_liquidation_id).map((r) => r.id) ?? [];
    const allDispatchIds =
      data.dispatches?.filter((d) => !d.supplier_liquidation_id).map((d) => d.id) ?? [];
    const relatedDispatchIds =
      data.receptions?.flatMap(
        (r) =>
          r.related_dispatches
            ?.filter((d) => !d.supplier_liquidation_id)
            .map((d) => d.id) ?? []
      ) ?? [];
    setSelectedReceptions(allReceptionIds);
    setSelectedDispatches([...new Set([...allDispatchIds, ...relatedDispatchIds])]);
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

  // Lógica para determinar qué IDs enviar (igual que antes para el PDF de preview)
  const buildPdfIds = () => {
    const allDispatches = [...(data?.dispatches ?? [])];
    const relatedDispatches = data?.receptions?.flatMap((r) => r.related_dispatches ?? []) ?? [];
    const totalDispatches = [
      ...new Set([...allDispatches.map((d) => d.id), ...relatedDispatches.map((d) => d.id)]),
    ];
    const independentDispatchIds = allDispatches.map((d) => d.id);
    const relatedDispatchIds = [...new Set(relatedDispatches.map((d) => d.id))];
    const allReceptionsSelected =
      selectedReceptions.length === (data?.receptions?.length ?? 0) &&
      selectedReceptions.length > 0;
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

    return { receptionsToSend, dispatchesToSend };
  };

  const resolvedStartDate = startDate ?? data?.date_range?.start ?? undefined;
  const resolvedEndDate = endDate ?? data?.date_range?.end ?? undefined;

  const handlePreviewPdf = async () => {
    if (!data) return;
    if (!paymentMethod) {
      notify.error({ title: 'Selecciona un método de pago antes de previsualizar' });
      return;
    }
    setDownloadingPdf(true);
    const { receptionsToSend, dispatchesToSend } = buildPdfIds();
    try {
      await notify.promise(
        downloadLiquidationPreviewPdf({
          supplierId,
          startDate: resolvedStartDate ?? '',
          endDate: resolvedEndDate ?? '',
          supplierName: data.supplier?.name ?? 'Proveedor',
          selectedReceptions: receptionsToSend,
          selectedDispatches: dispatchesToSend,
          paymentMethod,
          hasManagementFee,
          showTransferPayment,
        }),
        {
          loading: 'Generando previsualización...',
          success: 'PDF descargado',
          error: (err: unknown) => {
            const e = err as { status?: number; message?: string };
            if (e?.status === 422) return 'IDs inválidos. Recarga la página.';
            if (e?.status === 404) return 'Proveedor no encontrado';
            return e?.message ?? 'Error al descargar el PDF';
          },
        }
      );
      setPdfPreviewDialogOpen(false);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleCreateLiquidation = async () => {
    if (!data) return;
    if (selectedReceptions.length === 0 && selectedDispatches.length === 0) {
      notify.error({ title: 'Selecciona al menos una recepción o salida de cebo' });
      return;
    }

    setCreatingLiquidation(true);
    try {
      const result = await notify.promise(
        createLiquidation({
          supplier_id: supplierId,
          start_date: resolvedStartDate ?? '',
          end_date: resolvedEndDate ?? '',
          reception_ids: selectedReceptions,
          dispatch_ids: selectedDispatches,
        }),
        {
          loading: 'Creando liquidación...',
          success: 'Liquidación creada correctamente',
          error: (err: unknown) => {
            const e = err as { status?: number; message?: string; data?: { message?: string } };
            if (e?.status === 422)
              return e?.data?.message ?? 'Algún registro ya pertenece a otra liquidación.';
            return e?.message ?? 'Error al crear la liquidación';
          },
        }
      );
      queryClient.invalidateQueries({
        queryKey: supplierLiquidationKeys.closedListPrefix(tenantId),
      });
      router.push(`/admin/supplier-liquidations/show/${result.id}`);
    } finally {
      setCreatingLiquidation(false);
    }
  };

  const toggleReception = (id: number) =>
    setSelectedReceptions((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const toggleDispatch = (id: number) =>
    setSelectedDispatches((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

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

  const selectAllReceptions = () =>
    setSelectedReceptions(
      data?.receptions?.filter((r) => !r.supplier_liquidation_id).map((r) => r.id) ?? []
    );
  const deselectAllReceptions = () => setSelectedReceptions([]);

  const selectAllDispatches = () => {
    const direct =
      data?.dispatches?.filter((d) => !d.supplier_liquidation_id).map((d) => d.id) ?? [];
    const related =
      data?.receptions?.flatMap(
        (r) =>
          r.related_dispatches
            ?.filter((d) => !d.supplier_liquidation_id)
            .map((d) => d.id) ?? []
      ) ?? [];
    setSelectedDispatches([...new Set([...direct, ...related])]);
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
                    {(error as Error)?.message ?? 'Error al cargar los datos'}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/admin/supplier-liquidations/nueva')}
                  >
                    <ArrowLeft data-icon="inline-start" />
                    Volver
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
  const allRelatedDispatches =
    receptions?.flatMap((reception) => reception.related_dispatches ?? []) ?? [];
  const allDispatches = [...allRelatedDispatches, ...(dispatches ?? [])];

  const allReceptionIds = receptions?.map((r) => r.id) ?? [];
  const allDispatchIds = allDispatches.map((d) => d.id);

  const allReceptionsExpanded =
    allReceptionIds.length > 0 && allReceptionIds.every((id) => expandedReceptions.has(id));
  const allDispatchesExpanded =
    allDispatchIds.length > 0 && allDispatchIds.every((id) => expandedDispatches.has(id));

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
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex flex-shrink-0 items-center justify-between p-6 pb-2">
        <Button
          variant="ghost"
          onClick={() => router.push('/admin/supplier-liquidations/nueva')}
        >
          <ArrowLeft data-icon="inline-start" />
          Volver
        </Button>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center rounded-md border">
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="rounded-r-none border-r"
            >
              <LayoutList className="h-4 w-4" />
              Tabla
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className="rounded-l-none"
            >
              <CalendarDays className="h-4 w-4" />
              Calendario
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={() => setPendingDialogOpen(true)}
          >
            <ListFilter data-icon="inline-start" />
            Ver pendientes
          </Button>

          <Button variant="outline" onClick={() => setPdfPreviewDialogOpen(true)}>
            <Download data-icon="inline-start" />
            Vista previa PDF
          </Button>

          <Button onClick={handleCreateLiquidation} disabled={creatingLiquidation}>
            {creatingLiquidation ? (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            ) : (
              <FilePlus data-icon="inline-start" />
            )}
            Crear Liquidación
          </Button>
        </div>
      </div>

      {/* Dialog: items sin liquidar */}
      <PendingItemsDialog
        supplierId={supplierId}
        supplierName={data?.supplier?.name ?? ''}
        open={pendingDialogOpen}
        onClose={() => setPendingDialogOpen(false)}
      />

      <SupplierLiquidationPdfDialog
        open={pdfPreviewDialogOpen}
        onClose={() => setPdfPreviewDialogOpen(false)}
        idPrefix="preview"
        paymentMethod={paymentMethod}
        onPaymentMethodChange={setPaymentMethod}
        hasManagementFee={hasManagementFee}
        onHasManagementFeeChange={setHasManagementFee}
        showTransferPayment={showTransferPayment}
        onShowTransferPaymentChange={setShowTransferPayment}
        downloadingPdf={downloadingPdf}
        onDownload={handlePreviewPdf}
      />

      {/* Info proveedor */}
      <div className="bg-muted/50 mx-6 mb-2 flex-shrink-0 rounded-lg p-4">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="text-base font-semibold">{supplier?.name ?? '-'}</div>
          {supplier?.contact_person && (
            <span className="text-muted-foreground">• {supplier.contact_person}</span>
          )}
          {supplier?.phone && <span className="text-muted-foreground">• {supplier.phone}</span>}
          <span className="text-muted-foreground ml-auto">
            {formatDate(date_range?.start)} — {formatDate(date_range?.end)}
          </span>
        </div>
      </div>

      <ScrollArea className="h-full min-h-0 w-full flex-1">
        {/* Calendar view */}
        {viewMode === 'calendar' && resolvedStartDate && resolvedEndDate && (
          <SupplierLiquidationCalendarView
            receptions={receptions ?? []}
            dispatches={allDispatches}
            startDate={resolvedStartDate}
            endDate={resolvedEndDate}
          />
        )}

        {/* Table view */}
        <div className={viewMode === 'table' ? 'space-y-6 p-6 pt-2' : 'hidden'}>
          {/* Tabla recepciones */}
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
              <div className="space-y-1.5">
                <CardTitle>Recepciones</CardTitle>
                <CardDescription>
                  Recepciones de materia prima con sus productos y salidas relacionadas
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
                      <TableHead className="w-12">
                        <Checkbox
                          checked={(() => {
                            const selectable = data?.receptions?.filter((r) => !r.supplier_liquidation_id) ?? [];
                            return selectable.length > 0 && selectable.every((r) => selectedReceptions.includes(r.id));
                          })()}
                          onCheckedChange={(checked) =>
                            checked ? selectAllReceptions() : deselectAllReceptions()
                          }
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
                        const isReceptionExpanded = expandedReceptions.has(reception.id);
                        const isReceptionLiquidated = !!reception.supplier_liquidation_id;
                        return (
                        <React.Fragment key={`reception-${reception.id}`}>
                          <TableRow
                            className={`bg-blue-200/50 cursor-pointer font-bold dark:bg-blue-800/30 ${isReceptionLiquidated ? 'opacity-50' : ''}`}
                            aria-expanded={isReceptionExpanded}
                            onClick={() => toggleReceptionExpanded(reception.id)}
                          >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedReceptions.includes(reception.id)}
                                disabled={isReceptionLiquidated}
                                onCheckedChange={() => !isReceptionLiquidated && toggleReception(reception.id)}
                              />
                            </TableCell>
                            <TableCell colSpan={4}>
                              <span className="flex items-center gap-2">
                                {isReceptionExpanded ? (
                                  <ChevronDown className="text-muted-foreground h-4 w-4 shrink-0" />
                                ) : (
                                  <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
                                )}
                                Recepción #{reception.id} - {formatDate(reception.date)}
                                {reception.supplier_liquidation_id && (
                                  <Badge variant="outline" className="border-amber-400 text-xs text-amber-600 dark:text-amber-400">
                                    Liq. #{reception.supplier_liquidation_id}
                                  </Badge>
                                )}
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
                                    : '-'}
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
                          No hay recepciones en este período
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
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div className="space-y-1.5">
                  <CardTitle>Salidas de Cebo</CardTitle>
                  <CardDescription>Todas las salidas de cebo del período</CardDescription>
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
                        <TableHead className="w-12">
                          <Checkbox
                            checked={(() => {
                              const selectable = allDispatches.filter((d) => !d.supplier_liquidation_id);
                              return selectable.length > 0 && selectable.every((d) => selectedDispatches.includes(d.id));
                            })()}
                            onCheckedChange={(checked) =>
                              checked ? selectAllDispatches() : deselectAllDispatches()
                            }
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
                        const isDispatchExpanded = expandedDispatches.has(dispatch.id);
                        const isDispatchLiquidated = !!dispatch.supplier_liquidation_id;
                        return (
                        <React.Fragment key={`dispatch-${dispatch.id}`}>
                          <TableRow
                            className={`bg-orange-200/50 cursor-pointer font-bold dark:bg-orange-800/30 ${isDispatchLiquidated ? 'opacity-50' : ''}`}
                            aria-expanded={isDispatchExpanded}
                            onClick={() => toggleDispatchExpanded(dispatch.id)}
                          >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedDispatches.includes(dispatch.id)}
                                disabled={isDispatchLiquidated}
                                onCheckedChange={() => !isDispatchLiquidated && toggleDispatch(dispatch.id)}
                              />
                            </TableCell>
                            <TableCell colSpan={5}>
                              <div className="flex items-center gap-2">
                                {isDispatchExpanded ? (
                                  <ChevronDown className="text-muted-foreground h-4 w-4 shrink-0" />
                                ) : (
                                  <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
                                )}
                                <span>
                                  Salida #{dispatch.id} - {formatDate(dispatch.date)}
                                </span>
                                {dispatch.supplier_liquidation_id && (
                                  <Badge variant="outline" className="border-amber-400 text-xs text-amber-600 dark:text-amber-400">
                                    Liq. #{dispatch.supplier_liquidation_id}
                                  </Badge>
                                )}
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

