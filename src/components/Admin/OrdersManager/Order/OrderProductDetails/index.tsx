'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { MOBILE_SAFE_AREAS } from '@/lib/design-tokens-mobile';
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
import { useIsMobileSafe } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { OrderTotalsSummaryDialog } from '@/components/Admin/OrdersManager/Order/components/OrderTotalsSummaryDialog';
import { Info } from 'lucide-react';

interface ProductDetail {
  id?: number | string;
  product?: { id: number | string; name: string } | null;
  boxes: number;
  netWeight: number;
  unitPrice: number;
  tax?: { rate?: number } | null;
  subtotal: number;
  total: number;
}

const OrderProductDetails = () => {
  const { order } = useOrderContext();
  const productDetails = order?.productDetails as ProductDetail[] | undefined;
  const { isMobile, mounted } = useIsMobileSafe();
  const [showTotalsDialog, setShowTotalsDialog] = useState(false);

  // Memoizar el cálculo de totales para evitar recálculos innecesarios
  const totals = useMemo(() => {
    if (!productDetails || productDetails.length === 0) {
      return { subtotal: 0, total: 0, netWeight: 0, boxes: 0, averagePrice: 0 };
    }

    const calculated = productDetails.reduce(
      (acc, detail) => {
        acc.boxes += detail.boxes;
        acc.netWeight += detail.netWeight;
        acc.subtotal += detail.subtotal;
        acc.total += detail.total;
        return acc;
      },
      { subtotal: 0, total: 0, netWeight: 0, boxes: 0 }
    );

    return {
      ...calculated,
      averagePrice: calculated.netWeight > 0 ? calculated.subtotal / calculated.netWeight : 0,
    };
  }, [productDetails]);

  if (!mounted) return null;

  return (
    <div className={isMobile ? 'flex min-h-0 flex-1 flex-col' : 'h-full pb-2'}>
      {isMobile ? (
        <div className="flex min-h-0 flex-1 flex-col">
          {!productDetails || productDetails.length === 0 ? (
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
                {productDetails.map((detail) => (
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
                          <p className="text-muted-foreground text-xs">Cajas</p>
                          <p className="text-sm font-semibold tabular-nums">
                            {formatInteger(detail.boxes)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground text-xs">Cantidad</p>
                          <p className="text-sm font-semibold tabular-nums">
                            {formatDecimalWeight(detail.netWeight)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground text-xs">Precio</p>
                          <p className="text-sm font-semibold tabular-nums">
                            {formatDecimalCurrency(detail.unitPrice)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground text-xs">Impuesto</p>
                          <p className="text-sm font-semibold tabular-nums">{`${detail?.tax?.rate ?? 0}%`}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground text-xs">Subtotal</p>
                          <p className="text-sm font-semibold tabular-nums">
                            {formatDecimalCurrency(detail.subtotal)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground text-xs">Total</p>
                          <p className="text-sm font-semibold tabular-nums">
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
          <OrderTotalsSummaryDialog
            open={showTotalsDialog}
            onOpenChange={setShowTotalsDialog}
            title="Totales"
            description="Resumen de cajas, cantidad, precio promedio y totales del pedido."
            isMobile={isMobile}
            items={[
              { key: 'boxes', label: 'Cajas', value: formatInteger(totals.boxes) },
              {
                key: 'netWeight',
                label: 'Cantidad',
                value: formatDecimalWeight(totals.netWeight),
              },
              {
                key: 'averagePrice',
                label: 'Precio promedio',
                value: formatDecimalCurrency(totals.averagePrice),
              },
              {
                key: 'subtotal',
                label: 'Subtotal',
                value: formatDecimalCurrency(totals.subtotal),
              },
              { key: 'total', label: 'Total', value: formatDecimalCurrency(totals.total) },
            ]}
          />
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
            {!productDetails || productDetails.length === 0 ? (
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
                      <TableHead className="text-right">Cajas</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="text-right">Precio</TableHead>
                      <TableHead className="text-right">Impuesto (%)</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productDetails.map((detail) => (
                      <TableRow
                        key={detail.id || `${detail.product?.id}-${detail.product?.name}`}
                        className="text-nowrap"
                      >
                        <TableCell>{detail?.product?.name || 'Sin producto'}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatInteger(detail.boxes)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatDecimalWeight(detail.netWeight)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatDecimalCurrency(detail.unitPrice)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{`${detail?.tax?.rate ?? 0}%`}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatDecimalCurrency(detail.subtotal)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatDecimalCurrency(detail.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell>Total</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatInteger(totals.boxes)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatDecimalWeight(totals.netWeight)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatDecimalCurrency(totals.averagePrice)}
                      </TableCell>
                      <TableCell></TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatDecimalCurrency(totals.subtotal)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatDecimalCurrency(totals.total)}
                      </TableCell>
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
