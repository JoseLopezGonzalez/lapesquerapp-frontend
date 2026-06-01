'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/Utilities/EmptyState/index';
import { useOrderContext } from '@/context/OrderContext';
import {
  formatDecimalCurrency,
  formatDecimalWeight,
  formatInteger,
} from '@/helpers/formats/numbers/formatNumbers';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Info } from 'lucide-react';

const OrderProductDetails = () => {
  const { order } = useOrderContext();
  const isMobile = useIsMobile();
  const [showTotalsDialog, setShowTotalsDialog] = useState(false);

  // Memoizar el cálculo de totales para evitar recálculos innecesarios
  const totals = useMemo(() => {
    if (!order?.productDetails || order.productDetails.length === 0) {
      return { subtotal: 0, total: 0, netWeight: 0, boxes: 0, averagePrice: 0 };
    }

    const calculated = order.productDetails.reduce(
      (acc, detail) => {
        acc.boxes += detail.boxes;
        acc.netWeight += detail.netWeight;
        acc.subtotal += detail.subtotal;
        acc.total += detail.total;
        return acc;
      },
      { subtotal: 0, total: 0, netWeight: 0, boxes: 0 }
    );

    calculated.averagePrice =
      calculated.netWeight > 0 ? calculated.subtotal / calculated.netWeight : 0;

    return calculated;
  }, [order?.productDetails]);

  return (
    <div className={isMobile ? 'flex min-h-0 flex-1 flex-col' : 'h-full pb-2'}>
      {isMobile ? (
        <div className="flex min-h-0 flex-1 flex-col">
          {!order?.productDetails || order.productDetails.length === 0 ? (
            <div className="flex min-h-0 flex-1 items-center justify-center">
              <EmptyState
                title={'No existen detalles'}
                description={'No se ha producido actualmente nada para este pedido'}
              />
            </div>
          ) : (
            <ScrollArea className="min-h-0 flex-1">
              <div className="space-y-4 pb-3">
                {/* Vista Mobile: Cards */}
                {order.productDetails.map((detail) => (
                  <Card
                    key={detail.id || `${detail.product?.id}-${detail.product?.name}`}
                    className="border"
                  >
                    <CardContent className="space-y-3 p-4">
                      {/* Nombre del producto */}
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">
                          {detail?.product?.name || 'Sin producto'}
                        </p>
                      </div>

                      {/* Información en grid */}
                      <div className="grid grid-cols-2 gap-3 border-t pt-2">
                        <div className="space-y-1">
                          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                            Cajas
                          </p>
                          <p className="text-sm font-semibold">{formatInteger(detail.boxes)}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                            Cantidad
                          </p>
                          <p className="text-sm font-semibold">
                            {formatDecimalWeight(detail.netWeight)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                            Precio
                          </p>
                          <p className="text-sm font-semibold">
                            {formatDecimalCurrency(detail.unitPrice)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                            Impuesto
                          </p>
                          <p className="text-sm font-semibold">{`${detail?.tax?.rate ?? 0}%`}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                            Subtotal
                          </p>
                          <p className="text-sm font-semibold">
                            {formatDecimalCurrency(detail.subtotal)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                            Total
                          </p>
                          <p className="text-sm font-semibold">
                            {formatDecimalCurrency(detail.total)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Footer con botón de totales */}
          <div
            className="bg-background fixed right-0 bottom-0 left-0 z-50 flex items-center gap-2 border-t p-3"
            style={{ paddingBottom: `calc(0.75rem + env(safe-area-inset-bottom))` }}
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
                  Resumen de cajas, cantidad, precio promedio y totales del pedido.
                </DialogDescription>
              </DialogHeader>
              <div
                className={`${isMobile ? 'flex flex-1 flex-col items-center justify-center px-4' : ''}`}
              >
                <div className={`space-y-6 ${isMobile ? 'w-full max-w-md' : ''}`}>
                  <div className="flex flex-col space-y-6">
                    <div className="space-y-2 text-center">
                      <p className="text-muted-foreground text-xs font-normal tracking-wide uppercase">
                        Cajas
                      </p>
                      <p className="text-foreground text-xl font-medium">
                        {formatInteger(totals.boxes)}
                      </p>
                    </div>
                    <div className="space-y-2 border-t pt-4 text-center">
                      <p className="text-muted-foreground text-xs font-normal tracking-wide uppercase">
                        Cantidad
                      </p>
                      <p className="text-foreground text-xl font-medium">
                        {formatDecimalWeight(totals.netWeight)}
                      </p>
                    </div>
                    <div className="space-y-2 border-t pt-4 text-center">
                      <p className="text-muted-foreground text-xs font-normal tracking-wide uppercase">
                        Precio promedio
                      </p>
                      <p className="text-foreground text-xl font-medium">
                        {formatDecimalCurrency(totals.averagePrice)}
                      </p>
                    </div>
                    <div className="space-y-2 border-t pt-4 text-center">
                      <p className="text-muted-foreground text-xs font-normal tracking-wide uppercase">
                        Subtotal
                      </p>
                      <p className="text-foreground text-xl font-medium">
                        {formatDecimalCurrency(totals.subtotal)}
                      </p>
                    </div>
                    <div className="space-y-2 border-t pt-4 text-center">
                      <p className="text-muted-foreground text-xs font-normal tracking-wide uppercase">
                        Total
                      </p>
                      <p className="text-foreground text-xl font-medium">
                        {formatDecimalCurrency(totals.total)}
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
              <CardTitle className="text-lg font-medium">Detalle de productos</CardTitle>
              <p className="text-muted-foreground mt-1 text-sm">
                Desglose de productos con precio y cantidad
              </p>
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-6 overflow-y-auto">
            {!order?.productDetails || order.productDetails.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <EmptyState
                  title={'No existen detalles'}
                  description={'No se ha producido actualmente nada para este pedido'}
                />
              </div>
            ) : (
              /* Vista Desktop: Tabla */
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="text-nowrap">
                      <TableHead>Artículo</TableHead>
                      <TableHead>Cajas</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Impuesto (%)</TableHead>
                      <TableHead>Subtotal</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.productDetails.map((detail) => (
                      <TableRow
                        key={detail.id || `${detail.product?.id}-${detail.product?.name}`}
                        className="text-nowrap"
                      >
                        <TableCell>{detail?.product?.name || 'Sin producto'}</TableCell>
                        <TableCell>{formatInteger(detail.boxes)}</TableCell>
                        <TableCell>{formatDecimalWeight(detail.netWeight)}</TableCell>
                        <TableCell>{formatDecimalCurrency(detail.unitPrice)}</TableCell>
                        <TableCell>{`${detail?.tax?.rate ?? 0}%`}</TableCell>
                        <TableCell>{formatDecimalCurrency(detail.subtotal)}</TableCell>
                        <TableCell>{formatDecimalCurrency(detail.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell>Total</TableCell>
                      <TableCell>{formatInteger(totals.boxes)}</TableCell>
                      <TableCell>{formatDecimalWeight(totals.netWeight)}</TableCell>
                      <TableCell>{formatDecimalCurrency(totals.averagePrice)}</TableCell>
                      <TableCell></TableCell>
                      <TableCell>{formatDecimalCurrency(totals.subtotal)}</TableCell>
                      <TableCell>{formatDecimalCurrency(totals.total)}</TableCell>
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

export default OrderProductDetails;
