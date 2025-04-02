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

const ListadoComprasLonjaDeIsla = ({ document }) => {
    const [open, setOpen] = useState(false)

    const { details, tables } = document
    const { lonja, cifComprador, comprador, numeroComprador, fecha, cajasTotales, kilosTotales, importeTotal } = details
    const { ventas, peces, vendidurias, cajas, tipoVentas } = tables
    /* const { subastas } = tables
    const isVentaDirecta = tipoSubasta == 'M1 M1'
    const isSubasta = tipoSubasta == 'T2 Arrastre' */

    console.log('document', document)

    return (
        <div>
            <div className="container mx-auto py-3 space-y-3">
                <div className="container mx-auto p-6 max-w-5xl">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Datos del Albarán */}
                        {/* <Card className="col-span-2">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-2xl font-bold">{lonja}</CardTitle>
                                <CardDescription className="text-sm">
                                    Muelle Martínez Catena, 21410 Isla Cristina, Huelva
                                    <br />
                                    Teléfono: 959331670 – Email: lonjamanolo@gmail.com
                                    <br />
                                    RS: arrastre 12.010500/H, cerco/chirla 12.0017730/H
                                </CardDescription>
                            </CardHeader>
                        </Card> */}

                        {/* Sección de Datos del Albarán */}
                        <Card className="col-span-2">
                            <CardHeader className="pb-0">
                                <CardTitle className="text-base">Listado de Compras Lonja de Isla</CardTitle>
                            </CardHeader>
                            <CardContent className="px-10 py-5 w-full">
                                <div className="flex flex-col  gap-2">
                                    {/* Información de la Lonja - Lado izquierdo */}
                                    <div className="flex-1">
                                        <div className="text-base font-bold">
                                            {lonja}
                                        </div>
                                    </div>

                                    {/* Información del Albarán - Lado derecho */}
                                    <div className="flex-1 grid grid-cols-2 gap-3">
                                        <div className="border border-muted p-3 rounded-md text-sm">
                                        <div className="flex gap-1">
                                                <div className="font-semibold">Fecha:</div>
                                                <div>{fecha}</div>
                                            </div>
                                            <div className="flex gap-1">
                                                <div className="font-semibold">Email:</div>
                                                <div>lonjamanolo@gmail.com</div>
                                            </div>
                                            <div className="flex gap-1">
                                                <div className="font-semibold">Teléfono:</div>
                                                <div>959331670</div>
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
                                            <div className="flex gap-1">
                                                <div className="font-semibold">C.I.F.:</div>
                                                <div className="">{cifComprador}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tabla de Compras */}
                        <Card className="col-span-2">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-semibold">Ventas</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Venta</TableHead>
                                                <TableHead>Barco</TableHead>
                                                <TableHead>Especie</TableHead>
                                                <TableHead className="text-right">Cajas</TableHead>
                                                <TableHead className="text-right">Kilos</TableHead>
                                                <TableHead className="text-right">Precio</TableHead>
                                                <TableHead className="text-right">Importe</TableHead>
                                                <TableHead>NRSI</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {ventas.map((venta, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{venta.venta}</TableCell>
                                                    <TableCell>{venta.barco}</TableCell>
                                                    <TableCell>{venta.especie}</TableCell>
                                                    <TableCell className="text-right">{venta.cajas}</TableCell>
                                                    <TableCell className="text-right">{venta.kilos}</TableCell>
                                                    <TableCell className="text-right">{venta.precio}</TableCell>
                                                    <TableCell className="text-right">{venta.importe}</TableCell>
                                                    <TableCell>{venta.nrsi}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Resumen por Especie */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-semibold">Peces</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>FAO</TableHead>
                                            <TableHead>Especie</TableHead>
                                            <TableHead className="text-right">Cajas</TableHead>
                                            <TableHead className="text-right">Kilos</TableHead>
                                            <TableHead className="text-right">Importe</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {peces.map((especie, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{especie.fao}</TableCell>
                                                <TableCell>{especie.descripcion}</TableCell>
                                                <TableCell className="text-right">{especie.cajas}</TableCell>
                                                <TableCell className="text-right">{especie.kilos}</TableCell>
                                                <TableCell className="text-right">{especie.importe}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Tipo de Envase */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-semibold">Cajas</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Tipo</TableHead>
                                            <TableHead className="text-right">Cajas</TableHead>
                                            <TableHead className="text-right">Importe</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {cajas.map((tipo, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{tipo.descripcion}</TableCell>
                                                <TableCell className="text-right">{tipo.cajas}</TableCell>
                                                <TableCell className="text-right">{tipo.importe}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Resumen por Vendeduría */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-semibold">Compras por Vendeduría</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Vendedor</TableHead>
                                            <TableHead className="text-right">Cajas</TableHead>
                                            <TableHead className="text-right">Kilos</TableHead>
                                            <TableHead className="text-right">Importe</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {vendidurias.map((vendiduria, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{vendiduria.vendiduria}</TableCell>
                                                <TableCell className="text-right">{vendiduria.cajas}</TableCell>
                                                <TableCell className="text-right">{vendiduria.kilos}</TableCell>
                                                <TableCell className="text-right">{vendiduria.importe}</TableCell>
                                            </TableRow>
                                        ))}

                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>



                        {/* Tipo de Subasta */}
                        <Card>
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
                        </Card>

                        {/* Total */}
                        <Card className="col-span-2">
                            <CardContent>
                                <div className="flex justify-between items-center">
                                    <p className="text-lg font-medium">Importe Total</p>
                                    <p className="text-xl font-bold">{importeTotal}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* {console.log(document)} */}



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

        </div>
    )
}

export default ListadoComprasLonjaDeIsla