import React from 'react'

import { AlertTriangle, FileText, Package, Printer, Truck } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const OrderLabels = () => {
    return (
        <div className=" h-full pb-2">
            <Card className='flex flex-col h-full'>
                <CardHeader>
                    <CardTitle className="text-lg font-medium">Gestión de Etiquetas</CardTitle>
                </CardHeader>
                <CardContent className='flex-1 overflow-y-auto'>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="text-sm font-medium">Etiquetas de producto</div>
                                    <div className="text-sm text-muted-foreground">
                                        Etiquetas individuales para cada caja de producto
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm">
                                            <Printer className="h-4 w-4 mr-2" />
                                            Imprimir
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-[200px]">
                                        <DropdownMenuItem>
                                            <FileText className="h-4 w-4 mr-2" />
                                            Etiqueta estándar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <FileText className="h-4 w-4 mr-2" />
                                            Etiqueta con precio
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <FileText className="h-4 w-4 mr-2" />
                                            Etiqueta logística
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <div className="rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px]">
                                                <Checkbox />
                                            </TableHead>
                                            <TableHead>Producto</TableHead>
                                            <TableHead className="w-[100px]">Cajas</TableHead>
                                            <TableHead className="w-[100px]">Etiquetas</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell>
                                                <Checkbox />
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">Pulpo Fresco -1kg</div>
                                                <div className="text-sm text-muted-foreground">Lote: 1002250CC01001</div>
                                            </TableCell>
                                            <TableCell>1</TableCell>
                                            <TableCell>
                                                <Input type="number" defaultValue={1} className="w-20 h-8" />
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>
                                                <Checkbox />
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">Pulpo Fresco +1kg</div>
                                                <div className="text-sm text-muted-foreground">Lote: 1002250CC01002</div>
                                            </TableCell>
                                            <TableCell>1</TableCell>
                                            <TableCell>
                                                <Input type="number" defaultValue={1} className="w-20 h-8" />
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>
                                                <Checkbox />
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">Pulpo Fresco +2kg</div>
                                                <div className="text-sm text-muted-foreground">Lote: 1002250CC01003</div>
                                            </TableCell>
                                            <TableCell>3</TableCell>
                                            <TableCell>
                                                <Input type="number" defaultValue={3} className="w-20 h-8" />
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        {/* <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="text-sm font-medium">Etiquetas de palet</div>
                                    <div className="text-sm text-muted-foreground">Etiquetas para identificación de palets</div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm">
                                            <Printer className="h-4 w-4 mr-2" />
                                            Imprimir
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-[200px]">
                                        <DropdownMenuItem>
                                            <FileText className="h-4 w-4 mr-2" />
                                            Etiqueta GS1
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <FileText className="h-4 w-4 mr-2" />
                                            Etiqueta interna
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <FileText className="h-4 w-4 mr-2" />
                                            Etiqueta cliente
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <div className="rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px]">
                                                <Checkbox />
                                            </TableHead>
                                            <TableHead>Palet</TableHead>
                                            <TableHead className="w-[100px]">Etiquetas</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell>
                                                <Checkbox />
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">Palet #2913</div>
                                                <div className="text-sm text-muted-foreground">5 cajas - 120.00 kg</div>
                                            </TableCell>
                                            <TableCell>
                                                <Input type="number" defaultValue={1} className="w-20 h-8" />
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        </div> */}

                        {/* <Card className="md:col-span-2">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-medium">Etiquetas de envío</CardTitle>
                                <CardDescription>Etiquetas para el transporte y entrega</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-3 gap-4">
                                    <Button variant="outline" className="h-auto py-4 justify-start">
                                        <div className="flex flex-col items-start gap-1">
                                            <div className="flex items-center gap-2">
                                                <Truck className="h-4 w-4" />
                                                <span className="font-medium">Etiqueta de transporte</span>
                                            </div>
                                            <span className="text-sm text-muted-foreground">SEUR - Servicio 24h</span>
                                        </div>
                                    </Button>
                                    <Button variant="outline" className="h-auto py-4 justify-start">
                                        <div className="flex flex-col items-start gap-1">
                                            <div className="flex items-center gap-2">
                                                <Package className="h-4 w-4" />
                                                <span className="font-medium">Etiqueta de contenido</span>
                                            </div>
                                            <span className="text-sm text-muted-foreground">Resumen del pedido</span>
                                        </div>
                                    </Button>
                                    <Button variant="outline" className="h-auto py-4 justify-start">
                                        <div className="flex flex-col items-start gap-1">
                                            <div className="flex items-center gap-2">
                                                <AlertTriangle className="h-4 w-4" />
                                                <span className="font-medium">Etiqueta de manipulación</span>
                                            </div>
                                            <span className="text-sm text-muted-foreground">Temperatura controlada</span>
                                        </div>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card> */}

                        {/* <Card className="md:col-span-2">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-medium">Configuración de impresión</CardTitle>
                                <CardDescription>Ajusta las opciones de impresión de etiquetas</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>Impresora</Label>
                                        <Select defaultValue="zebra">
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="zebra">Zebra ZT411</SelectItem>
                                                <SelectItem value="brady">Brady i7100</SelectItem>
                                                <SelectItem value="toshiba">Toshiba B-EX4T2</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Formato</Label>
                                        <Select defaultValue="10x15">
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="10x15">10 x 15 cm</SelectItem>
                                                <SelectItem value="15x20">15 x 20 cm</SelectItem>
                                                <SelectItem value="20x30">20 x 30 cm</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Resolución</Label>
                                        <Select defaultValue="300">
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="200">200 DPI</SelectItem>
                                                <SelectItem value="300">300 DPI</SelectItem>
                                                <SelectItem value="600">600 DPI</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card> */}

                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default OrderLabels