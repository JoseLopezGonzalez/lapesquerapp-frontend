'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Download } from 'lucide-react'
import React, { useState } from 'react'
import ExportModal from './ExportModal'
import { Dialog, DialogTrigger } from "@/components/ui/dialog"

const AlbaranCofraWeb = ({ document, hideExport = false }) => {
    const [open, setOpen] = useState(false)

    return (
        <div className='py-8'>
            <div className="container mx-auto p-6 py-6 space-y-3 bg-white text-black rounded-md shadow-md">

                <img src="/images/logos/logo-santo-cristo.png" alt="Logo" className=" h-32 mx-auto mb-4" />
                {/* Sección de Datos del Albarán */}
                <Card className='bg-white text-black border-neutral-200'>
                    <CardHeader className="pb-0">
                        <CardTitle className="text-base">Albarán de compra</CardTitle>
                    </CardHeader>
                    <CardContent className="px-10 py-5">
                        <div className="flex flex-col gap-2">
                            {/* Información de la Lonja - Lado izquierdo */}
                            <div className="flex-1">
                                <div className="text-base font-bold">
                                    {document.detalles.lonja}
                                </div>
                                <div className="text-sm">C.I.F.: {document.detalles.cifLonja}</div>
                            </div>

                            {/* Información del Albarán - Lado derecho */}
                            <div className="flex-1 grid grid-cols-2 gap-3">
                                <Card className="p-3 text-sm bg-white text-black border-neutral-200 border-0 border-b-1">
                                    <div className="flex gap-1">
                                        <div className="font-semibold">Nº Albarán:</div>
                                        <div>{document.detalles.numero}</div>
                                    </div>
                                    <div className="flex gap-1">
                                        <div className="font-semibold">Fecha:</div>
                                        <div>{document.detalles.fecha}</div>
                                    </div>
                                    <div className="flex gap-1">
                                        <div className="font-semibold">Ejercicio:</div>
                                        <div>{document.detalles.ejercicio}</div>
                                    </div>
                                </Card>

                                <Card className="p-3 text-sm bg-white text-black border-neutral-200 border-0 border-b-1">
                                    <div className="flex gap-1">
                                        <div className="font-semibold">Comprador:</div>
                                        <div className="">{document.detalles.comprador}</div>
                                    </div>
                                    <div className="flex gap-1">
                                        <div className="font-semibold">Codigo:</div>
                                        <div className="">{document.detalles.numeroComprador}</div>
                                    </div>
                                    <div className="flex gap-1">
                                        <div className="font-semibold">C.I.F.:</div>
                                        <div className="">{document.detalles.cifComprador}</div>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabla de Subastas */}
                <Card className='bg-white text-black border-neutral-200'>
                    <CardHeader className="pb-0 pt-3 px-3">
                        <CardTitle>Subastas</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3">
                        <div className="overflow-x-auto">
                            <Table className="border-collapse [&_th]:p-2 [&_td]:p-2">
                                <TableHeader>
                                    <TableRow className="hover:bg-white">
                                        <TableHead>Cajas</TableHead>
                                        <TableHead>Kilos</TableHead>
                                        <TableHead>Pescado</TableHead>
                                        <TableHead>Cod</TableHead>
                                        <TableHead>Barco</TableHead>
                                        <TableHead>Armador</TableHead>
                                        <TableHead>Precio</TableHead>
                                        <TableHead>Importe</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {document.tablas.subastas.map((row, index) => (
                                        <TableRow key={index} className="hover:bg-muted hover:text-white">
                                            <TableCell>{row.cajas} {row.tipoCaja}</TableCell>
                                            <TableCell>{row.kilos}</TableCell>
                                            <TableCell>{row.pescado}</TableCell>
                                            <TableCell>{row.cod}</TableCell>
                                            <TableCell>{row.barco}</TableCell>
                                            <TableCell>
                                                {row.armador} <br />
                                                {row.cifArmador}
                                            </TableCell>
                                            <TableCell className='text-end'>{row.precio} €/kg</TableCell>
                                            <TableCell className='text-end'>{row.importe} €</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabla de Servicios */}
                <Card className='bg-white text-black border-neutral-200'>
                    <CardHeader className="pb-0 pt-3 px-3">
                        <CardTitle>Servicios</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3">
                        <div className="overflow-x-auto">
                            <Table className="border-collapse [&_th]:p-2 [&_td]:p-2">
                                <TableHeader>
                                    <TableRow className="hover:bg-white">
                                        <TableHead>Código</TableHead>
                                        <TableHead>Descripción</TableHead>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>%IVA</TableHead>
                                        <TableHead>%REC</TableHead>
                                        <TableHead>Unidades</TableHead>
                                        <TableHead>Precio</TableHead>
                                        <TableHead>Importe</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {document.tablas.servicios.map((row, index) => (
                                        <TableRow key={index} className="hover:bg-muted hover:text-white">
                                            <TableCell>{row.codigo}</TableCell>
                                            <TableCell>{row.descripcion}</TableCell>
                                            <TableCell>{row.fecha}</TableCell>
                                            <TableCell>{row.iva}</TableCell>
                                            <TableCell>{row.rec}</TableCell>
                                            <TableCell className='text-end'>{row.unidades}</TableCell>
                                            <TableCell className='text-end'>{row.precio} €</TableCell>
                                            <TableCell className='text-end'>{row.importe} €</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Subtotales */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {/* Subtotales Pesca */}
                    <Card className='bg-white text-black border-neutral-200'>
                        <CardHeader className="pb-0 pt-3 px-3">
                            <CardTitle>Subtotales Pesca</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3">
                            <Table className="border-collapse [&_th]:p-2 [&_td]:p-2">
                                <TableBody>
                                    <TableRow className="hover:bg-muted hover:text-white">
                                        <TableCell className="font-medium">Total Pesca</TableCell>
                                        <TableCell className="text-right">
                                            {document.subtotales.pesca.subtotal}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow className="hover:bg-muted hover:text-white">
                                        <TableCell className="font-medium">IVA Pesca</TableCell>
                                        <TableCell className="text-right">
                                            {document.subtotales.pesca.iva}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow className="hover:bg-muted hover:text-white">
                                        <TableCell className="font-medium">Total</TableCell>
                                        <TableCell className="text-right">
                                            {document.subtotales.pesca.total}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Subtotales Servicios */}
                    <Card className='bg-white text-black border-neutral-200'>
                        <CardHeader className="pb-0 pt-3 px-3">
                            <CardTitle>Subtotales Servicios</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3">
                            <Table className="border-collapse [&_th]:p-2 [&_td]:p-2">
                                <TableBody>
                                    <TableRow className="hover:bg-muted hover:text-white">
                                        <TableCell className="font-medium">Total Servicios</TableCell>
                                        <TableCell className="text-right">
                                            {document.subtotales.servicios.subtotal}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow className="hover:bg-muted hover:text-white">
                                        <TableCell className="font-medium">IVA Servicios</TableCell>
                                        <TableCell className="text-right">
                                            {document.subtotales.servicios.iva}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow className="hover:bg-muted hover:text-white">
                                        <TableCell className="font-medium">Total</TableCell>
                                        <TableCell className="text-right">
                                            {document.subtotales.servicios.total}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Subtotales Cajas */}
                    <Card className='bg-white text-black border-neutral-200'>
                        <CardHeader className="pb-0 pt-3 px-3">
                            <CardTitle>Subtotales Cajas</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3">
                            <Table className="border-collapse [&_th]:p-2 [&_td]:p-2">
                                <TableBody>
                                    <TableRow className="hover:bg-muted hover:text-white">
                                        <TableCell className="font-medium">Cajas</TableCell>
                                        <TableCell className="text-right">
                                            {document.subtotales.cajas.subtotal}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow className="hover:bg-muted hover:text-white">
                                        <TableCell className="font-medium">IVA Cajas</TableCell>
                                        <TableCell className="text-right">
                                            {document.subtotales.cajas.iva}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow className="hover:bg-muted hover:text-white">
                                        <TableCell className="font-medium">Total</TableCell>
                                        <TableCell className="text-right">
                                            {document.subtotales.cajas.total}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                {/* Total */}
                <Card className="flex items-center justify-between p-3 bg-white text-black border-neutral-200">
                    <span>Total</span>
                    <div className="text-xl font-medium text-right">
                        {document.detalles.importeTotal} €
                    </div>
                </Card>
            </div>



            {!hideExport && (
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <div className="fixed bottom-8 right-12">
                            <Button className="rounded-full" >
                                <Download className="w-6 h-6" />
                                Exportar
                            </Button>
                        </div>
                    </DialogTrigger>
                    <ExportModal document={document} />
                </Dialog>
            )}

        </div>
    )
}

export default AlbaranCofraWeb