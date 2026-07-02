import { useMemo, useState } from 'react';

import { cn } from '@/lib/utils';
import { MOBILE_SAFE_AREAS } from '@/lib/design-tokens-mobile';
import { AlertTriangle, Info } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

function ProductionStatusBadge({ status }: { status: MergedProductDetail['status'] }) {
  const config = productionStatusBadgeConfig[status] ?? productionStatusBadgeConfig.pending;

  if (!config.color) return <Badge>{config.label}</Badge>;

  return <StatusBadge color={config.color} label={config.label} />;
}

const OrderProduction = () => {
  const { isMobile, mounted } = useIsMobileSafe();
  const { mergedProductDetails: rawMergedProductDetails } = useOrderContext();
  const mergedProductDetails = rawMergedProductDetails as unknown as MergedProductDetail[];
  const [showTotalsDialog, setShowTotalsDialog] = useState(false);

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
              <div className="space-y-4 pb-0">
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

                {/* Vista Mobile: Cards */}
                {mergedProductDetails.map((detail) => (
                  <Card
                    key={`${detail?.product?.id ?? 'unknown'}-${detail.status}`}
                    className="p-4"
                  >
                    <div className="space-y-3">
                      {/* Artículo y Estado */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-muted-foreground mb-1.5 text-xs tracking-wide uppercase">
                            Artículo
                          </p>
                          <p className="text-sm font-semibold">
                            {detail?.product?.name || 'Sin producto'}
                          </p>
                        </div>
                        <div>
                          <ProductionStatusBadge status={detail.status} />
                        </div>
                      </div>

                      {/* Información en grid */}
                      <div className="grid grid-cols-2 gap-3 border-t pt-2">
                        <div className="space-y-1">
                          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                            Pedido
                          </p>
                          {detail.status === 'noPlanned' ? (
                            <p className="text-sm font-semibold">-</p>
                          ) : (
                            <>
                              <p className="text-sm font-semibold">
                                {formatDecimalWeight(detail.plannedQuantity)}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {formatInteger(detail.plannedBoxes)} cajas
                              </p>
                            </>
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                            Producción
                          </p>
                          {detail.productionQuantity === 0 && detail.productionBoxes === 0 ? (
                            <p className="text-sm font-semibold">-</p>
                          ) : (
                            <>
                              <p className="text-sm font-semibold">
                                {formatDecimalWeight(detail.productionQuantity)}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {formatInteger(detail.productionBoxes)} cajas
                              </p>
                            </>
                          )}
                        </div>
                        <div className="col-span-2 space-y-1">
                          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                            Diferencia
                          </p>
                          <p className="text-sm font-semibold">
                            {detail.status === 'noPlanned'
                              ? '-'
                              : formatDecimalWeight(detail.quantityDifference)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Footer con botón de totales */}
          <div
            className={cn(
              'bg-background fixed right-0 bottom-0 left-0 z-50 flex items-center gap-2 border-t p-3',
              MOBILE_SAFE_AREAS.BOTTOM_INSET
            )}
          >
            <Button
              onClick={() => setShowTotalsDialog(true)}
              variant="outline"
              size="sm"
              className="min-h-[44px] flex-1"
            >
              <Info className="mr-2 h-4 w-4" />
              Totales
            </Button>
          </div>

          {/* Dialog de Totales */}
          <Dialog open={showTotalsDialog} onOpenChange={setShowTotalsDialog}>
            <DialogContent
              className={`${isMobile ? 'm-0 flex h-full max-h-full w-full max-w-full flex-col rounded-none' : ''}`}
            >
              <DialogHeader>
                <DialogTitle>Totales</DialogTitle>
                <DialogDescription>
                  Comparativa total entre cantidades previstas y producidas.
                </DialogDescription>
              </DialogHeader>
              <div
                className={`${isMobile ? 'flex flex-1 flex-col items-center justify-center px-4' : ''}`}
              >
                <div className={`space-y-6 ${isMobile ? 'w-full max-w-md' : ''}`}>
                  <div className="flex flex-col space-y-6">
                    <div className="space-y-2 text-center">
                      <p className="text-muted-foreground text-xs font-normal tracking-wide uppercase">
                        Pedido
                      </p>
                      <p className="text-foreground text-xl font-medium">
                        {formatDecimalWeight(totals.plannedQuantity)}
                      </p>
                    </div>
                    <div className="space-y-2 border-t pt-4 text-center">
                      <p className="text-muted-foreground text-xs font-normal tracking-wide uppercase">
                        Producción
                      </p>
                      <p className="text-foreground text-xl font-medium">
                        {formatDecimalWeight(totals.productionQuantity)}
                      </p>
                    </div>
                    <div className="space-y-2 border-t pt-4 text-center">
                      <p className="text-muted-foreground text-xs font-normal tracking-wide uppercase">
                        Diferencia
                      </p>
                      <p className="text-foreground text-xl font-medium">
                        {formatDecimalWeight(totals.quantityDifference)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
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
