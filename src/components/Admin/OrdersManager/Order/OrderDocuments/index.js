import React from 'react'

import { FileText, Mail, Truck, User, Users } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const OrderDocuments = () => {
    return (
        <div className='h-full pb-2'>
            <Card className='h-full'>
                <CardHeader>
                    <CardTitle className="text-lg font-medium">Documentación</CardTitle>
                    <CardDescription>Envía los documentos a los diferentes destinatarios</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Cliente */}
                        <div className="flex items-center justify-between border rounded-lg p-3">
                            <div className="flex items-center gap-3">
                                <User className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <div className="font-medium">Cliente</div>
                                    <div className="text-sm text-muted-foreground">cliente@brisamar.com</div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => console.log("Enviando albarán...")}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Albarán
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => console.log("Enviando factura...")}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Factura
                                </Button>
                            </div>
                        </div>

                        {/* Transporte */}
                        <div className="flex items-center justify-between border rounded-lg p-3">
                            <div className="flex items-center gap-3">
                                <Truck className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <div className="font-medium">Transporte</div>
                                    <div className="text-sm text-muted-foreground">logistica@seur.com</div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => console.log("Enviando albarán...")}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Albarán
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => console.log("Enviando instrucciones...")}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Instrucciones
                                </Button>
                            </div>
                        </div>

                        {/* Comercial */}
                        <div className="flex items-center justify-between border rounded-lg p-3">
                            <div className="flex items-center gap-3">
                                <Users className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <div className="font-medium">Comercial</div>
                                    <div className="text-sm text-muted-foreground">juan.perez@empresa.com</div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => console.log("Enviando albarán...")}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Albarán
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => console.log("Enviando factura...")}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Factura
                                </Button>
                            </div>
                        </div>

                        <Separator />

                        {/* Envío múltiple */}
                        <div className="grid gap-4">
                            <div className="flex items-center gap-4">
                                <Select defaultValue="albaran" className="flex-1">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar documento" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="albaran">Albarán de entrega</SelectItem>
                                        <SelectItem value="factura">Factura</SelectItem>
                                        <SelectItem value="instrucciones">Instrucciones especiales</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select defaultValue="todos" className="flex-1">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar destinatarios" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todos">Todos los destinatarios</SelectItem>
                                        <SelectItem value="cliente-comercial">Cliente y Comercial</SelectItem>
                                        <SelectItem value="cliente-transporte">Cliente y Transporte</SelectItem>
                                        <SelectItem value="transporte-comercial">Transporte y Comercial</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button onClick={() => console.log("Enviando documentos...")}>
                                    <Mail className="h-4 w-4" />
                                    Enviar
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default OrderDocuments