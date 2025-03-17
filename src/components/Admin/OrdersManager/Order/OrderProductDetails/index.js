'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/Utilities/EmptyState';
import { useOrderContext } from '@/context/OrderContext';
import { formatDecimalCurrency, formatDecimalWeight, formatInteger } from '@/helpers/formats/numbers/formatNumbers';

const OrderProductDetails = () => {

    const { order } = useOrderContext();

    const totals = order.productDetails.reduce((acc, detail) => {
        /* boxes */
        acc.boxes += detail.boxes;
        acc.netWeight += detail.netWeight;
        acc.subtotal += detail.subtotal;
        acc.total += detail.total;
        return acc;
    }
        , { subtotal: 0, total: 0, netWeight: 0, boxes: 0 });

    totals.averagePrice = totals.subtotal / totals.netWeight;

    return (
        <div className="h-full pb-2">
            <Card className='h-full flex flex-col'>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-medium">Detalle de productos</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            Desglose de productos con precio y cantidad
                        </p>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6 flex-1 overflow-y-auto">
                    {order.productDetails.length === 0 ? (
                        <div className="rounded-md border">
                            <Table>
                                <TableBody>
                                    <TableRow className='text-nowrap'>
                                        <TableCell className='py-14'>
                                            <EmptyState
                                                title={'No existen productos'}
                                                description={'No se han añadido productos a este pedido'}
                                            />
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
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
                                    {order.productDetails.map((detail, index) => (
                                        <TableRow key={index} className='text-nowrap'>
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
                        </div>)}
                </CardContent>
            </Card>
        </div>
    );
};

export default OrderProductDetails;
