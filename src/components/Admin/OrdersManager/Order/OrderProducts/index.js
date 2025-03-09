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

const OrderProducts = () => {

    const { order , mergedDetails } = useOrderContext()

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
                   

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="">Artículo</TableHead>
                                    <TableHead>Cajas</TableHead>
                                    <TableHead>Produccion</TableHead>

                                    {/* Precio */}
                                    <TableHead>Precio</TableHead>
                                    {/* Descuento */}
                                    {/* Descuento */}
                                    <TableHead>Descuento</TableHead>
                                    <TableHead> Base</TableHead>
                                   <TableHead>Impuesto</TableHead> 
                                    {/* Total */}
                                    <TableHead>Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {mergedDetails.map((detail, index) => (
                                    <TableRow key={index} className='text-nowrap'>
                                        <TableCell className="font-medium">{detail.product_name}</TableCell>
                                        <TableCell>
                                            {detail.boxesReal}
                                        </TableCell>
                                        <TableCell>
                                               {detail.quantityReal} kg
                                        </TableCell>
                                        
                                        <TableCell>{detail.unit_price} €</TableCell>
                                        <TableCell> - 0,15 €</TableCell>
                                        <TableCell>{detail.line_base} €</TableCell>
                                        <TableCell> 10%</TableCell>

                                        <TableCell>{detail.line_total} €</TableCell>

                                        
                                        
                                    </TableRow>
                                ))}
                                
                            </TableBody>
                            {/* TableFooter */}
                            <TableFooter>
                                <TableRow>
                                    <TableCell className="font-medium">Total</TableCell>
                                    <TableCell>120</TableCell>
                                    <TableCell>28.50 kg</TableCell>
                                    <TableCell>-91.50 kg</TableCell>
                                    <TableCell> </TableCell>
                                    <TableCell> </TableCell>
                                    <TableCell> </TableCell>
                                    <TableCell> </TableCell>
                                </TableRow>
                            </TableFooter>    


                        </Table>
                    </div>

                   

                   {/*  <div className="flex justify-end gap-4">
                        <Button>
                            <Package className="h-4 w-4 mr-2" />
                            Gestionar productos
                        </Button>
                    </div> */}
                </CardContent>

            </Card>
        </div>
    )
}

export default OrderProducts