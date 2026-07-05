'use client';

import { useMemo } from 'react';
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

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
                description={'Todavía no hay producción registrada para este pedido'}
              />
            </div>
          ) : (
            <ScrollArea className="min-h-0 flex-1">
              <div className="space-y-3 pb-4">
                <div className="border-border bg-card sticky top-0 z-10 rounded-lg border p-3 shadow-sm">
                  <div className="min-w-0">
                    <p className="text-muted-foreground text-xs font-medium">Total pedido</p>
                    <p className="text-2xl leading-tight font-bold tracking-tight tabular-nums">
                      {formatDecimalCurrency(totals.total)}
                    </p>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="min-w-0">
                      <p className="text-muted-foreground text-[11px] leading-tight">Cajas</p>
                      <p className="text-sm font-medium tabular-nums">
                        {formatInteger(totals.boxes)}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-muted-foreground text-[11px] leading-tight">Cantidad</p>
                      <p className="text-sm font-medium tabular-nums">
                        {formatDecimalWeight(totals.netWeight)}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-muted-foreground text-[11px] leading-tight">Precio med.</p>
                      <p className="text-sm font-medium tabular-nums">
                        {formatDecimalCurrency(totals.averagePrice)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-border bg-card overflow-hidden rounded-lg border">
                  <Accordion type="multiple" className="w-full">
                    {productDetails.map((detail) => (
                      <AccordionItem
                        key={detail.id || `${detail.product?.id}-${detail.product?.name}`}
                        value={String(detail.id || `${detail.product?.id}-${detail.product?.name}`)}
                        className=""
                      >
                        <AccordionTrigger className="px-3">
                          <div className="flex w-full min-w-0 items-start justify-between gap-3">
                            <p className="min-w-0 flex-1 text-left text-sm leading-snug font-medium">
                              {detail?.product?.name || 'Sin producto'}
                            </p>
                            <p className="shrink-0 text-sm font-semibold tabular-nums">
                              {formatDecimalCurrency(detail.total)}
                            </p>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-3">
                          <div className="border-border grid grid-cols-3 gap-x-2 gap-y-2 border-t pt-3">
                            <div className="min-w-0">
                              <p className="text-muted-foreground text-[11px] leading-tight">
                                Cajas
                              </p>
                              <p className="text-sm font-medium tabular-nums">
                                {formatInteger(detail.boxes)}
                              </p>
                            </div>
                            <div className="min-w-0">
                              <p className="text-muted-foreground text-[11px] leading-tight">
                                Cantidad
                              </p>
                              <p className="text-sm font-medium tabular-nums">
                                {formatDecimalWeight(detail.netWeight)}
                              </p>
                            </div>
                            <div className="min-w-0">
                              <p className="text-muted-foreground text-[11px] leading-tight">
                                Precio
                              </p>
                              <p className="text-sm font-medium tabular-nums">
                                {formatDecimalCurrency(detail.unitPrice)}
                              </p>
                            </div>
                            <div className="min-w-0">
                              <p className="text-muted-foreground text-[11px] leading-tight">IVA</p>
                              <p className="text-sm font-medium tabular-nums">
                                {detail?.tax?.rate ?? 0}%
                              </p>
                            </div>
                            <div className="min-w-0">
                              <p className="text-muted-foreground text-[11px] leading-tight">
                                Subtotal
                              </p>
                              <p className="text-sm font-medium tabular-nums">
                                {formatDecimalCurrency(detail.subtotal)}
                              </p>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </div>
            </ScrollArea>
          )}
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
                  description={'Todavía no hay producción registrada para este pedido'}
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
