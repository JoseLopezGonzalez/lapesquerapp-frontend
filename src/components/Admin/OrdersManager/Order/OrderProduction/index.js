import React from 'react'

import { AlertTriangle, Check, HelpCircle, Package, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useOrderContext } from '@/context/OrderContext';
import { formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';

const OrderProduction = () => {

    const { order, mergedDetails } = useOrderContext()

    console.log(mergedDetails)

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
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <HelpCircle className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="max-w-xs">
                                    Verde: Cantidades coinciden
                                    <br />
                                    Amarillo: Diferencia en cantidades
                                    <br />
                                    Rojo: Producto faltante
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </CardHeader>
                <CardContent className="space-y-6 flex-1 overflow-y-auto">
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Discrepancia detectada</AlertTitle>
                        <AlertDescription>
                            Se han encontrado diferencias entre los productos registrados y los paletizados.
                        </AlertDescription>
                    </Alert>

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
                                {mergedDetails.map((detail, index) => (
                                    <TableRow key={index} className='text-nowrap'>
                                        <TableCell className="font-medium">{detail.product_name}</TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div>{detail.quantityPlanned} kg</div>
                                                <div className="text-sm text-muted-foreground">{detail.boxesPlanned} cajas</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div>{detail.quantityReal} kg</div>
                                                <div className="text-sm text-muted-foreground">{detail.boxesReal} cajas</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{formatDecimalWeight(detail.quantityReal - detail.quantityPlanned)} </TableCell>
                                        <TableCell>
                                            <div className="flex items-end gap-2">
                                                {detail.quantityPlanned === detail.quantityReal ? (
                                                    <Badge variant="success" className="bg-green-500">
                                                        <Check className="h-3 w-3 mr-1" />
                                                        Correcto
                                                    </Badge>
                                                ) : (detail.quantityReal - detail.quantityPlanned) > -30 && (detail.quantityReal - detail.quantityPlanned) < 30 ? (
                                                    <Badge variant="warning" className="bg-amber-500">
                                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                                        Diferencia
                                                    </Badge>
                                                ) : (detail.quantityReal - detail.quantityPlanned) > 30 ? (
                                                    <Badge>
                                                        <X className="h-3 w-3 mr-1" />
                                                        No programado
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="destructive">
                                                        <X className="h-3 w-3 mr-1" />
                                                        Faltante
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {/* <Button variant="outline" size="icon">
                                            </Button> */}

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
                            {/* TableFooter */}
                            <TableFooter>
                                <TableRow>
                                    <TableCell className="font-medium">Total</TableCell>
                                    <TableCell>120.00 kg</TableCell>
                                    <TableCell>28.50 kg</TableCell>
                                    <TableCell>-91.50 kg</TableCell>
                                    <TableCell> </TableCell>
                                    <TableCell> </TableCell>


                                </TableRow>
                            </TableFooter>


                        </Table>
                    </div>




                </CardContent>

            </Card>
        </div>
    )
}

export default OrderProduction