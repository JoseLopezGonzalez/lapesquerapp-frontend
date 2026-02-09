'use client'

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/Utilities/EmptyState/index';
import { useOrderContext } from '@/context/OrderContext';
import { formatDecimalCurrency, formatDecimalWeight, formatInteger } from '@/helpers/formats/numbers/formatNumbers';
import { useIsMobile } from '@/hooks/use-mobile';

const OrderProductDetails = () => {

    const { order } = useOrderContext();
    const isMobile = useIsMobile();

    // Memoizar el cálculo de totales para evitar recálculos innecesarios
    const totals = useMemo(() => {
        if (!order?.productDetails || order.productDetails.length === 0) {
            return { subtotal: 0, total: 0, netWeight: 0, boxes: 0, averagePrice: 0 };
        }

        const calculated = order.productDetails.reduce((acc, detail) => {
            acc.boxes += detail.boxes;
            acc.netWeight += detail.netWeight;
            acc.subtotal += detail.subtotal;
            acc.total += detail.total;
            return acc;
        }, { subtotal: 0, total: 0, netWeight: 0, boxes: 0 });

        calculated.averagePrice = calculated.netWeight > 0 
            ? calculated.subtotal / calculated.netWeight 
            : 0;

        return calculated;
    }, [order?.productDetails]);

    return (
        <div className="h-full pb-2">
            <Card className='h-full flex flex-col bg-transparent' >
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-medium">Detalle de productos</CardTitle>
                        {!isMobile && (
                        <p className="text-sm text-muted-foreground mt-1">
                            Desglose de productos con precio y cantidad
                        </p>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-6 flex-1 overflow-y-auto">
                    {!order?.productDetails || order.productDetails.length === 0 ? (
                        <div className="rounded-md border">
                            <Table>
                                <TableBody>
                                    <TableRow className='text-nowrap'>
                                        <TableCell className='py-14'>
                                            <EmptyState
                                                title={'No existen detalles'}
                                                description={'No se ha producido actualmente nada para este pedido'}
                                            />
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    ) : isMobile ? (
                        /* Vista Mobile: Cards */
                        <div className="space-y-4">
                            {order.productDetails.map((detail) => (
                                <Card key={detail.id || `${detail.product?.id}-${detail.product?.name}`} className="border">
                                    <CardContent className="p-4 space-y-3">
                                        {/* Nombre del producto */}
                                        <div className="space-y-1">
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Artículo</p>
                                            <p className="text-sm font-semibold">{detail.product.name}</p>
                                        </div>

                                        {/* Información en grid */}
                                        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                                            <div className="space-y-1">
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cajas</p>
                                                <p className="text-sm font-semibold">{formatInteger(detail.boxes)}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cantidad</p>
                                                <p className="text-sm font-semibold">{formatDecimalWeight(detail.netWeight)}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Precio</p>
                                                <p className="text-sm font-semibold">{formatDecimalCurrency(detail.unitPrice)}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Impuesto</p>
                                                <p className="text-sm font-semibold">{`${detail.tax.rate}%`}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Subtotal</p>
                                                <p className="text-sm font-semibold">{formatDecimalCurrency(detail.subtotal)}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total</p>
                                                <p className="text-sm font-semibold">{formatDecimalCurrency(detail.total)}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}

                            {/* Totales */}
                            <Card className="border-2 bg-muted/30">
                                <CardContent className="p-4">
                                    <p className="text-base font-semibold text-foreground mb-4">Totales</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cajas</p>
                                            <p className="text-base font-semibold">{formatInteger(totals.boxes)}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cantidad</p>
                                            <p className="text-base font-semibold">{formatDecimalWeight(totals.netWeight)}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Precio promedio</p>
                                            <p className="text-base font-semibold">{formatDecimalCurrency(totals.averagePrice)}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Subtotal</p>
                                            <p className="text-base font-semibold">{formatDecimalCurrency(totals.subtotal)}</p>
                                        </div>
                                        <div className="space-y-1 col-span-2">
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total</p>
                                            <p className="text-base font-semibold">{formatDecimalCurrency(totals.total)}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        /* Vista Desktop: Tabla */
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow className='text-nowrap'>
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
                                        <TableRow key={detail.id || `${detail.product?.id}-${detail.product?.name}`} className='text-nowrap'>
                                            <TableCell>
                                                {detail.product.name}
                                            </TableCell>
                                            <TableCell>
                                                {formatInteger(detail.boxes)}
                                            </TableCell>
                                            <TableCell>
                                                {formatDecimalWeight(detail.netWeight)}
                                            </TableCell>
                                            <TableCell>
                                                {formatDecimalCurrency(detail.unitPrice)}
                                            </TableCell>
                                            <TableCell>
                                                {`${detail.tax.rate}%`}
                                            </TableCell>
                                            <TableCell>
                                                {formatDecimalCurrency(detail.subtotal)}
                                            </TableCell>
                                            <TableCell>
                                                {formatDecimalCurrency(detail.total)}
                                            </TableCell>
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
        </div>
    );
};

export default OrderProductDetails;
