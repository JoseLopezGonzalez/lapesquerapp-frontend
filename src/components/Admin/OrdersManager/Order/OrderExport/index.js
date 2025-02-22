import React from 'react'

import { FileDown, FileSpreadsheet, FileText, FileType } from 'lucide-react';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Button } from '@/components/ui/button';


const OrderExport = () => {
    return (
        <div className='h-full pb-2'>
            <Card className='h-full'>
                <CardHeader>
                    <CardTitle className="text-lg font-medium">Exportar Datos</CardTitle>
                    <CardDescription>Exporta los datos de la orden en diferentes formatos</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <Select defaultValue="order">
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="order">Datos del pedido</SelectItem>
                                            <SelectItem value="products">Listado de artículos</SelectItem>
                                            <SelectItem value="pallets">Información de palets</SelectItem>
                                            <SelectItem value="differences">Log de diferencias</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="w-[150px]">
                                    <Select defaultValue="excel">
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent align="end">
                                            <SelectItem value="excel">
                                                <div className="flex items-center gap-2">
                                                    <FileSpreadsheet className="h-4 w-4" />
                                                    Excel
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="csv">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4" />
                                                    CSV
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="pdf">
                                                <div className="flex items-center gap-2">
                                                    <FileType className="h-4 w-4" />
                                                    PDF
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="outline">Datos básicos</Badge>
                                <Badge variant="outline">Direcciones</Badge>
                                <Badge variant="outline">Observaciones</Badge>
                                <Badge variant="outline">Historial</Badge>
                                <Badge variant="outline">Precios</Badge>
                                <Badge variant="outline">Lotes</Badge>
                            </div>
                            <Button className="w-full">
                                <FileDown className="h-4 w-4" />
                                Exportar selección
                            </Button>
                        </div>
                        <div className="border rounded-lg p-4 space-y-3">
                            <div className="text-sm font-medium">Exportación rápida</div>
                            <div className="grid gap-2">
                                <Button
                                    variant="outline"
                                    className="justify-start"
                                    onClick={() => console.log("Exportando albarán...")}
                                >
                                    <FileText className="h-4 w-4 mr-2" />
                                    Albarán de entrega
                                </Button>
                                <Button
                                    variant="outline"
                                    className="justify-start"
                                    onClick={() => console.log("Exportando factura...")}
                                >
                                    <FileText className="h-4 w-4 mr-2" />
                                    Factura
                                </Button>
                                <Button
                                    variant="outline"
                                    className="justify-start"
                                    onClick={() => console.log("Exportando etiquetas...")}
                                >
                                    <FileText className="h-4 w-4 mr-2" />
                                    Etiquetas de palets
                                </Button>
                                <Button
                                    variant="outline"
                                    className="justify-start"
                                    onClick={() => console.log("Exportando todo...")}
                                >
                                    <FileDown className="h-4 w-4 mr-2" />
                                    Exportar todo
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

    )
}

export default OrderExport