'use client';

import { useMemo } from 'react';

import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatusBadge from '@/components/Admin/OrdersManager/StatusBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useOrderContext } from '@/context/OrderContext';
import { formatDecimalWeight, formatInteger } from '@/helpers/formats/numbers/formatNumbers';
import { EmptyState } from '@/components/Utilities/EmptyState/index';
import { useIsMobileSafe } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

interface MergedProductDetail {
  product?: { id: number | string; name: string } | null;
  plannedQuantity: number;
  plannedBoxes: number;
  productionQuantity: number;
  productionBoxes: number;
  quantityDifference: number;
  boxesDifference?: number;
  status: 'success' | 'difference' | 'pending' | 'noPlanned';
}

const productionStatusBadgeConfig = {
  success: {
    label: 'Correcto',
    color: 'green',
  },
  difference: {
    label: 'Diferencia',
    color: 'orange',
  },
  noPlanned: {
    label: 'No previsto',
    color: 'red',
  },
  pending: {
    label: 'Pendiente',
    color: undefined,
  },
} as const satisfies Record<
  MergedProductDetail['status'],
  { label: string; color: 'green' | 'orange' | 'red' | undefined }
>;

const productionItemBorderConfig: Partial<Record<MergedProductDetail['status'], string>> = {
  difference: 'border-orange-200 dark:border-orange-900',
  noPlanned: 'border-red-200 dark:border-red-900',
};

function ProductionStatusBadge({ status }: { status: MergedProductDetail['status'] }) {
  const config = productionStatusBadgeConfig[status] ?? productionStatusBadgeConfig.pending;

  if (!config.color) return <Badge>{config.label}</Badge>;

  return <StatusBadge color={config.color} label={config.label} />;
}

const OrderProduction = () => {
  const { isMobile, mounted } = useIsMobileSafe();
  const { mergedProductDetails: rawMergedProductDetails } = useOrderContext();
  const mergedProductDetails = rawMergedProductDetails as unknown as MergedProductDetail[];

  // Memoizar el cálculo de discrepancias
  const hasDiscrepancy = useMemo(() => {
    return mergedProductDetails.some((detail) => detail.status !== 'success');
  }, [mergedProductDetails]);

  // Memoizar el cálculo de totales
  const totals = useMemo(() => {
    return mergedProductDetails.reduce(
      (acc, detail) => {
        acc.plannedQuantity += detail.plannedQuantity;
        acc.productionQuantity += detail.productionQuantity;
        acc.quantityDifference += detail.quantityDifference;
        return acc;
      },
      { plannedQuantity: 0, productionQuantity: 0, quantityDifference: 0 }
    );
  }, [mergedProductDetails]);

  if (!mounted) return null;

  return (
    <div className={isMobile ? 'flex min-h-0 flex-1 flex-col' : 'h-full pb-2'}>
      {isMobile ? (
        <div className="flex min-h-0 flex-1 flex-col">
          {mergedProductDetails.length === 0 ? (
            <div className="flex min-h-0 flex-1 items-center justify-center">
              <EmptyState
                title={'No existen productos'}
                description={'No se han añadido productos a este pedido'}
              />
            </div>
          ) : (
            <ScrollArea className="min-h-0 flex-1">
              <div className="space-y-3 pb-4">
                {hasDiscrepancy && (
                  <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
                    <AlertTriangle />
                    <AlertTitle>Discrepancia detectada</AlertTitle>
                    <AlertDescription className="text-amber-800 dark:text-amber-200">
                      Se han encontrado diferencias entre los productos registrados y los
                      paletizados.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="border-border bg-card sticky top-0 z-10 rounded-lg border p-3 shadow-sm">
                  <p className="text-muted-foreground text-xs font-medium">Totales</p>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <div className="min-w-0">
                      <p className="text-muted-foreground text-[11px] leading-tight">Pedido</p>
                      <p className="text-sm font-medium tabular-nums">
                        {formatDecimalWeight(totals.plannedQuantity)}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-muted-foreground text-[11px] leading-tight">Producción</p>
                      <p className="text-sm font-medium tabular-nums">
                        {formatDecimalWeight(totals.productionQuantity)}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-muted-foreground text-[11px] leading-tight">Diferencia</p>
                      <p className="text-sm font-medium tabular-nums">
                        {formatDecimalWeight(totals.quantityDifference)}
                      </p>
                    </div>
                  </div>
                </div>

                <Accordion type="multiple" className="w-full space-y-2.5">
                  {mergedProductDetails.map((detail) => {
                    const hasDifference =
                      detail.status !== 'noPlanned' && detail.quantityDifference !== 0;

                    return (
                      <AccordionItem
                        key={`${detail?.product?.id ?? 'unknown'}-${detail.status}`}
                        value={`${detail?.product?.id ?? 'unknown'}-${detail.status}`}
                        className={cn(
                          'border-border bg-card overflow-hidden rounded-lg border',
                          productionItemBorderConfig[detail.status]
                        )}
                      >
                        <AccordionTrigger className="px-3">
                          <div className="flex w-full min-w-0 items-center justify-between gap-3">
                            <p className="min-w-0 flex-1 truncate text-left text-sm font-medium">
                              {detail?.product?.name || 'Sin producto'}
                            </p>
                            <div className="shrink-0">
                              <ProductionStatusBadge status={detail.status} />
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-3">
                          <div className="border-border grid grid-cols-3 gap-x-2 gap-y-2 border-t pt-3">
                            <div className="min-w-0">
                              <p className="text-muted-foreground text-[11px] leading-tight">
                                Pedido
                              </p>
                              {detail.status === 'noPlanned' ? (
                                <p className="text-sm font-medium tabular-nums">-</p>
                              ) : (
                                <>
                                  <p className="text-sm font-medium tabular-nums">
                                    {formatDecimalWeight(detail.plannedQuantity)}
                                  </p>
                                  <p className="text-muted-foreground text-xs tabular-nums">
                                    {formatInteger(detail.plannedBoxes)} cajas
                                  </p>
                                </>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-muted-foreground text-[11px] leading-tight">
                                Producción
                              </p>
                              {detail.productionQuantity === 0 && detail.productionBoxes === 0 ? (
                                <p className="text-sm font-medium tabular-nums">-</p>
                              ) : (
                                <>
                                  <p className="text-sm font-medium tabular-nums">
                                    {formatDecimalWeight(detail.productionQuantity)}
                                  </p>
                                  <p className="text-muted-foreground text-xs tabular-nums">
                                    {formatInteger(detail.productionBoxes)} cajas
                                  </p>
                                </>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-muted-foreground text-[11px] leading-tight">
                                Diferencia
                              </p>
                              <p
                                className={cn(
                                  'text-sm font-medium tabular-nums',
                                  hasDifference && 'text-destructive font-semibold'
                                )}
                              >
                                {detail.status === 'noPlanned'
                                  ? '-'
                                  : formatDecimalWeight(detail.quantityDifference)}
                              </p>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </div>
            </ScrollArea>
          )}
        </div>
      ) : (
        <Card className="flex h-full flex-col bg-transparent">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              {/* text-lg: sub-escala intencional para CardTitle de tarjeta dentro de un tab, alineada con GAP-084. */}
              <CardTitle className="text-lg font-medium">Productos del Pedido</CardTitle>
              <p className="text-muted-foreground mt-1 text-sm">
                Comparación entre productos registrados y paletizados
              </p>
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-6 overflow-y-auto">
            {hasDiscrepancy && (
              <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
                <AlertTriangle />
                <AlertTitle>Discrepancia detectada</AlertTitle>
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  Se han encontrado diferencias entre los productos registrados y los paletizados.
                </AlertDescription>
              </Alert>
            )}

            {mergedProductDetails.length === 0 ? (
              <div className="rounded-md border">
                <div className="flex h-full items-center justify-center">
                  <EmptyState
                    title={'No existen productos'}
                    description={'No se han añadido productos a este pedido'}
                  />
                </div>
              </div>
            ) : (
              /* Vista Desktop: Tabla */
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="">Artículo</TableHead>
                      <TableHead>Pedido</TableHead>
                      <TableHead>Producción</TableHead>
                      <TableHead>Diferencia</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mergedProductDetails.map((detail) => (
                      <TableRow
                        key={`${detail?.product?.id ?? 'unknown'}-${detail.status}`}
                        className="text-nowrap"
                      >
                        <TableCell className="font-medium">
                          {detail?.product?.name || 'Sin producto'}
                        </TableCell>
                        <TableCell>
                          {detail.status === 'noPlanned' ? (
                            <div className="space-y-1">
                              <div>-</div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <div>{formatDecimalWeight(detail.plannedQuantity)}</div>
                              <div className="text-muted-foreground text-sm">
                                {formatInteger(detail.plannedBoxes)} cajas
                              </div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {detail.productionQuantity === 0 && detail.productionBoxes === 0 ? (
                            '-'
                          ) : (
                            <div className="space-y-1">
                              <div>{formatDecimalWeight(detail.productionQuantity)}</div>
                              <div className="text-muted-foreground text-sm">
                                {formatInteger(detail.productionBoxes)} cajas
                              </div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {detail.status === 'noPlanned'
                            ? '-'
                            : formatDecimalWeight(detail.quantityDifference)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-end gap-2">
                            <ProductionStatusBadge status={detail.status} />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter className="text-nowrap">
                    <TableRow>
                      <TableCell className="font-medium">Total</TableCell>
                      <TableCell>{formatDecimalWeight(totals.plannedQuantity)}</TableCell>
                      <TableCell>{formatDecimalWeight(totals.productionQuantity)}</TableCell>
                      <TableCell>{formatDecimalWeight(totals.quantityDifference)}</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OrderProduction;
