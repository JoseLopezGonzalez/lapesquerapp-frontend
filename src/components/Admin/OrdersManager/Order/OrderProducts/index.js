import React from 'react'

import { AlertTriangle, Check, HelpCircle, Package, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const OrderProducts = () => {
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
                                    <TableHead className="w-[200px]">Artículo</TableHead>
                                    <TableHead>Pedido Original</TableHead>
                                    <TableHead>En Palets</TableHead>
                                    <TableHead>Diferencia</TableHead>
                                    <TableHead>Estado</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell className="font-medium">Pulpo Fresco -1kg</TableCell>
                                    <TableCell>
                                        <div className="space-y-1">
                                            <div>10.00 kg</div>
                                            <div className="text-sm text-muted-foreground">1 caja</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1">
                                            <div>10.00 kg</div>
                                            <div className="text-sm text-muted-foreground">1 caja</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>0.00 kg</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="success" className="bg-green-500">
                                                <Check className="h-3 w-3 mr-1" />
                                                Correcto
                                            </Badge>
                                        </div>
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-medium">Pulpo Fresco +1kg</TableCell>
                                    <TableCell>
                                        <div className="space-y-1">
                                            <div>20.00 kg</div>
                                            <div className="text-sm text-muted-foreground">1 caja</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1">
                                            <div>18.50 kg</div>
                                            <div className="text-sm text-muted-foreground">1 caja</div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-amber-600">-1.50 kg</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="warning" className="bg-amber-500">
                                                <AlertTriangle className="h-3 w-3 mr-1" />
                                                Diferencia
                                            </Badge>
                                        </div>
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-medium">Pulpo Fresco +2kg</TableCell>
                                    <TableCell>
                                        <div className="space-y-1">
                                            <div>90.00 kg</div>
                                            <div className="text-sm text-muted-foreground">3 cajas</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1">
                                            <div>0.00 kg</div>
                                            <div className="text-sm text-muted-foreground">0 cajas</div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-destructive">-90.00 kg</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="destructive">
                                                <X className="h-3 w-3 mr-1" />
                                                Faltante
                                            </Badge>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Total Pedido</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">120.00 kg</div>
                                <p className="text-xs text-muted-foreground">5 cajas en total</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Total en Palets</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">28.50 kg</div>
                                <p className="text-xs text-muted-foreground">2 cajas procesadas</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Diferencia</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-destructive">-91.50 kg</div>
                                <p className="text-xs text-muted-foreground">3 cajas pendientes</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex justify-end gap-4">
                        {/* <ExportDialog /> */}
                        <Button>
                            <Package className="h-4 w-4 mr-2" />
                            Gestionar productos
                        </Button>
                    </div>
                </CardContent>
                
            </Card>
        </div>
    )
}

export default OrderProducts