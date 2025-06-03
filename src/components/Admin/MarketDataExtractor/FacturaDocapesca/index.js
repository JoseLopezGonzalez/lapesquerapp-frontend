'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Building2, Download } from 'lucide-react'
import React, { useState } from 'react'
/* import ExportModal from './ExportModal' */
import {
    Dialog,
    DialogTrigger,
} from "@/components/ui/dialog"
import ExportModal from './ExportModal'
import { formatDecimalCurrency } from '@/helpers/formats/numbers/formatNumbers'

const FacturaDocapesca = ({ document }) => {
    const [open, setOpen] = useState(false)

    const { details, tables } = document
    const { lonja, numero, comprador, numeroComprador, fecha, cantidadTotal, importeTotal, importeTotalServicios, importeTotalVentas, lugarCarga, lugarDescarga } = details
    const { ventas, servicios } = tables
    /* const { subastas } = tables
    const isVentaDirecta = tipoSubasta == 'M1 M1'
    const isSubasta = tipoSubasta == 'T2 Arrastre' */


    /* convertir 1.438,09 a numero*/
    const formatNumber = (number) => {
        if (number) {
            const numberString = number.toString().replace('.', '').replace(',', '.')
            return parseFloat(numberString)
        }
        return 0
    }

    const formattedDocument = {
        ...document,
        details: {
            ...details,
            importeTotal: parseFloat(formatNumber(importeTotal)),
            fecha: new Date(fecha).toLocaleDateString('es-ES'),
        },
    }

    return (
        <div>
            <div className="container mx-auto py-3 space-y-3">
                <div className="container mx-auto p-6 max-w-5xl">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card className="col-span-2">
                            <CardHeader className="pb-4 flex items-center justify-between">
                                {/*  <CardTitle className="text-base">Factura Docapesca</CardTitle> */}
                                <img src="/images/suppliers/logos/logo_docapesca.png" alt="Docapesca" className="w-56 " />
                            </CardHeader>
                            <CardContent className="px-10 py-5 w-full">
                                <div className="flex flex-col  gap-2">
                                    <div className="flex-1">
                                        <div className="text-base font-bold">
                                            {lonja}
                                        </div>
                                    </div>

                                    <div className="flex-1 grid grid-cols-2 gap-3">
                                        <div className="border border-muted p-3 rounded-md text-sm">
                                            <div className="flex gap-1">
                                                <div className="font-semibold">Fecha:</div>
                                                <div>{formattedDocument.details.fecha}</div>
                                            </div>
                                            <div className="flex gap-1">
                                                <div className="font-semibold">Factura Nº:</div>
                                                <div>{numero}</div>
                                            </div>

                                        </div>

                                        <div className=" border border-muted p-3 rounded-md text-sm">
                                            <div className="flex gap-1">
                                                <div className="font-semibold">Comprador:</div>
                                                <div className="">{comprador}</div>
                                            </div>
                                            <div className="flex gap-1">
                                                <div className="font-semibold">Codigo:</div>
                                                <div className="">{numeroComprador}</div>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="col-span-2">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-semibold">Ventas</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Lote</TableHead>
                                                <TableHead>Cajas</TableHead>
                                                <TableHead>Especie</TableHead>
                                                <TableHead className="text-right">Nombre Cientifico</TableHead>
                                                <TableHead className="text-right">FAO</TableHead>
                                                <TableHead className="text-right">Peso</TableHead>
                                                <TableHead className="text-right">Precio</TableHead>
                                                <TableHead className="text-right">Importe</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {ventas.map((venta, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{venta?.lote}</TableCell>
                                                    <TableCell>{venta?.cajas}</TableCell>
                                                    <TableCell>{venta?.especie}</TableCell>
                                                    <TableCell>{venta?.nombreCientifico}</TableCell>
                                                    <TableCell>{venta?.fao}</TableCell>
                                                    <TableCell className="text-right">{venta?.peso}</TableCell>
                                                    <TableCell className="text-right">{venta?.precio}</TableCell>
                                                    <TableCell className="text-right">{venta?.importe}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>







                        {/*  <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-semibold">Tipo de Subasta</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>COD</TableHead>
                                            <TableHead>Tipo</TableHead>
                                            <TableHead className="text-right">Cajas</TableHead>
                                            <TableHead className="text-right">Importe</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {tipoVentas.map((tipo, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{tipo.cod}</TableCell>
                                                <TableCell>{tipo.descripcion}</TableCell>
                                                <TableCell className="text-right">{tipo.cajas}</TableCell>
                                                <TableCell className="text-right">{tipo.importe}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card> */}

                        <Card className="col-span-2">
                            <CardContent>
                                <div className="flex justify-between items-center">
                                    <p className="text-lg font-medium">Importe Total</p>
                                    <p className="text-xl font-bold">{formatDecimalCurrency(formattedDocument.details.importeTotal)}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>


            {/*  <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <div className="fixed bottom-8 right-12">
                        <Button className="rounded-full" >
                            <Download className="w-6 h-6" />
                            Exportar
                        </Button>
                    </div>
                </DialogTrigger>
                <ExportModal document={document} />
            </Dialog> */}

        </div>
    )
}

export default FacturaDocapesca