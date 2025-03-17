import React from 'react'

import { AlertTriangle, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useOrderContext } from '@/context/OrderContext';
import { formatDecimalWeight, formatInteger } from '@/helpers/formats/numbers/formatNumbers';
import { EmptyState } from '@/components/Utilities/EmptyState';

const OrderProduction = () => {
    const { mergedProductDetails } = useOrderContext();

    const hasDiscrepancy = mergedProductDetails.some(detail => detail.status !== 'success');

    const totals = mergedProductDetails.reduce((acc, detail) => {
        acc.plannedQuantity += detail.plannedQuantity;
        acc.productionQuantity += detail.productionQuantity;
        acc.quantityDifference += detail.quantityDifference;
        return acc;
    }, { plannedQuantity: 0, productionQuantity: 0, quantityDifference: 0 });

    return (
        <div className="h-full pb-2 ">
            <Card className='h-full flex flex-col'>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-medium">Productos del Pedido</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            Comparación entre productos registrados y paletizados
                        </p>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6 flex-1 overflow-y-auto">
                    {hasDiscrepancy && (
                        <Alert className='animate-pulse'>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Discrepancia detectada</AlertTitle>
                            <AlertDescription>
                                Se han encontrado diferencias entre los productos registrados y los paletizados.
                            </AlertDescription>
                        </Alert>)}


                    {mergedProductDetails.length === 0 ? (
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
                                    <TableRow>
                                        <TableHead className="">Artículo</TableHead>
                                        <TableHead>Pedido</TableHead>
                                        <TableHead>Produccion</TableHead>
                                        <TableHead>Diferencia</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {mergedProductDetails.map((detail, index) => (
                                        <TableRow key={index} className='text-nowrap'>
                                            <TableCell className="font-medium">{detail.product.name}</TableCell>
                                            <TableCell>
                                                {detail.status === 'noPlanned' ? (
                                                    <div className="space-y-1">
                                                        <div>-</div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-1">
                                                        <div>{formatDecimalWeight(detail.plannedQuantity)}</div>
                                                        <div className="text-sm text-muted-foreground">{formatInteger(detail.plannedBoxes)} cajas</div>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {detail.productionQuantity === 0 && detail.productionBoxes === 0
                                                    ? '-'
                                                    : (
                                                        <div className="space-y-1">
                                                            <div>{formatDecimalWeight(detail.productionQuantity)}</div>
                                                            <div className="text-sm text-muted-foreground">{formatInteger(detail.productionBoxes)} cajas</div>
                                                        </div>
                                                    )}
                                            </TableCell>
                                            <TableCell>
                                                {detail.status === 'noPlanned' ? '-' : formatDecimalWeight(detail.quantityDifference)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-end gap-2">
                                                    {detail.status === 'success' ? (
                                                        <Badge variant="success" className="bg-green-500">
                                                            Correcto
                                                        </Badge>
                                                    ) : detail.status === 'difference' ? (
                                                        <Badge variant="warning" className="bg-orange-500">
                                                            Diferencia
                                                        </Badge>
                                                    ) : detail.status === 'noPlanned' ? (
                                                        <Badge variant="destructive">
                                                            No previsto
                                                        </Badge>
                                                    ) : (
                                                        <Badge >
                                                            Pendiente
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="outline" size="icon">
                                                                <Package className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent className='bg-neutral-950 text-white'>
                                                            <p className="max-w-xs ">
                                                                Crear palet
                                                                automáticamente
                                                            </p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                                <TableFooter className='text-nowrap'>
                                    <TableRow>
                                        <TableCell className="font-medium">Total</TableCell>
                                        <TableCell>
                                            {formatDecimalWeight(totals.plannedQuantity)}
                                        </TableCell>
                                        <TableCell>
                                            {formatDecimalWeight(totals.productionQuantity)}
                                        </TableCell>
                                        <TableCell>
                                            {formatDecimalWeight(totals.quantityDifference)}
                                        </TableCell>
                                        <TableCell>
                                        </TableCell>
                                        <TableCell></TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default OrderProduction