import React, { useMemo, useState } from 'react'

import { AlertTriangle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useOrderContext } from '@/context/OrderContext';
import { formatDecimalWeight, formatInteger } from '@/helpers/formats/numbers/formatNumbers';
import { EmptyState } from '@/components/Utilities/EmptyState/index';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const OrderProduction = () => {
    const isMobile = useIsMobile();
    const { mergedProductDetails } = useOrderContext();
    const [showTotalsDialog, setShowTotalsDialog] = useState(false);

    // Memoizar el cálculo de discrepancias
    const hasDiscrepancy = useMemo(() => {
        return mergedProductDetails.some(detail => detail.status !== 'success');
    }, [mergedProductDetails]);

    // Memoizar el cálculo de totales
    const totals = useMemo(() => {
        return mergedProductDetails.reduce((acc, detail) => {
            acc.plannedQuantity += detail.plannedQuantity;
            acc.productionQuantity += detail.productionQuantity;
            acc.quantityDifference += detail.quantityDifference;
            return acc;
        }, { plannedQuantity: 0, productionQuantity: 0, quantityDifference: 0 });
    }, [mergedProductDetails]);

    return (
        <div className={isMobile ? "flex-1 flex flex-col min-h-0" : "h-full pb-2"}>
            {isMobile ? (
                <div className="flex-1 flex flex-col min-h-0">
                    {mergedProductDetails.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center min-h-0">
                            <EmptyState
                                title={'No existen productos'}
                                description={'No se han añadido productos a este pedido'}
                            />
                        </div>
                    ) : (
                        <ScrollArea className="flex-1 min-h-0">
                            <div className="pb-0 space-y-4">
                                {hasDiscrepancy && (
                                    <Alert className='animate-pulse'>
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertTitle>Discrepancia detectada</AlertTitle>
                                        <AlertDescription>
                                            Se han encontrado diferencias entre los productos registrados y los paletizados.
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {/* Vista Mobile: Cards */}
                                {mergedProductDetails.map((detail) => (
                                    <Card key={`${detail.product.id}-${detail.status}`} className="p-4">
                                        <div className="space-y-3">
                                            {/* Artículo y Estado */}
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <p className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wide">Artículo</p>
                                                    <p className="text-sm font-semibold">{detail.product.name}</p>
                                                </div>
                                                <div>
                                                    {detail.status === 'success' ? (
                                                        <Badge variant="success" className="bg-green-500 text-foreground-50">
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
                                                        <Badge>
                                                            Pendiente
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Información en grid */}
                                            <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pedido</p>
                                                    {detail.status === 'noPlanned' ? (
                                                        <p className="text-sm font-semibold">-</p>
                                                    ) : (
                                                        <>
                                                            <p className="text-sm font-semibold">{formatDecimalWeight(detail.plannedQuantity)}</p>
                                                            <p className="text-xs text-muted-foreground">{formatInteger(detail.plannedBoxes)} cajas</p>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Producción</p>
                                                    {detail.productionQuantity === 0 && detail.productionBoxes === 0 ? (
                                                        <p className="text-sm font-semibold">-</p>
                                                    ) : (
                                                        <>
                                                            <p className="text-sm font-semibold">{formatDecimalWeight(detail.productionQuantity)}</p>
                                                            <p className="text-xs text-muted-foreground">{formatInteger(detail.productionBoxes)} cajas</p>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="space-y-1 col-span-2">
                                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Diferencia</p>
                                                    <p className="text-sm font-semibold">
                                                        {detail.status === 'noPlanned' ? '-' : formatDecimalWeight(detail.quantityDifference)}
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
                    <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-3 flex items-center gap-2 z-50" style={{ paddingBottom: `calc(0.75rem + env(safe-area-inset-bottom))` }}>
                        <Button 
                            onClick={() => setShowTotalsDialog(true)}
                            variant="outline"
                            size="sm"
                            className="flex-1 min-h-[44px]"
                        >
                            <Info className="h-4 w-4 mr-2" />
                            Totales
                        </Button>
                    </div>
                    
                    {/* Dialog de Totales */}
                    <Dialog open={showTotalsDialog} onOpenChange={setShowTotalsDialog}>
                        <DialogContent className={`${isMobile ? 'max-w-full w-full h-full max-h-full m-0 rounded-none flex flex-col' : ''}`}>
                            <DialogHeader>
                                <DialogTitle>Totales</DialogTitle>
                            </DialogHeader>
                            <div className={`${isMobile ? 'flex-1 flex flex-col items-center justify-center px-4' : ''}`}>
                                <div className={`space-y-6 ${isMobile ? 'w-full max-w-md' : ''}`}>
                                    <div className="flex flex-col space-y-6">
                                        <div className="space-y-2 text-center">
                                            <p className="text-xs font-normal text-muted-foreground uppercase tracking-wide">Pedido</p>
                                            <p className="text-xl font-medium text-foreground">{formatDecimalWeight(totals.plannedQuantity)}</p>
                                        </div>
                                        <div className="space-y-2 pt-4 border-t text-center">
                                            <p className="text-xs font-normal text-muted-foreground uppercase tracking-wide">Producción</p>
                                            <p className="text-xl font-medium text-foreground">{formatDecimalWeight(totals.productionQuantity)}</p>
                                        </div>
                                        <div className="space-y-2 pt-4 border-t text-center">
                                            <p className="text-xs font-normal text-muted-foreground uppercase tracking-wide">Diferencia</p>
                                            <p className="text-xl font-medium text-foreground">{formatDecimalWeight(totals.quantityDifference)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            ) : (
                <Card className='h-full flex flex-col bg-transparent'>
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
                            </Alert>
                        )}

                        {mergedProductDetails.length === 0 ? (
                            <div className="rounded-md border">
                                <div className="h-full flex items-center justify-center">
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
                                            <TableHead>Produccion</TableHead>
                                            <TableHead>Diferencia</TableHead>
                                            <TableHead>Estado</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {mergedProductDetails.map((detail) => (
                                            <TableRow key={`${detail.product.id}-${detail.status}`} className='text-nowrap'>
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
                                                            <Badge variant="success" className="bg-green-500 text-foreground-50">
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
                                        </TableRow>
                                    </TableFooter>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

export default OrderProduction