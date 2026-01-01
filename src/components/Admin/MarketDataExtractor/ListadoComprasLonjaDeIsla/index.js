'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Download } from 'lucide-react'
import React, { useState } from 'react'
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import ExportModal from './ExportModal'

const ListadoComprasLonjaDeIsla = ({ document, hideExport = false }) => {
    const [open, setOpen] = useState(false)
    const { details, tables } = document
    const { lonja, cifComprador, comprador, numeroComprador, fecha, importeTotal } = details
    const { ventas, peces, vendidurias, cajas, tipoVentas } = tables

    return (
        <div className='py-8'>
            <div className="container mx-auto py-3 space-y-3 bg-white text-black rounded-md shadow-md">

                <img src="/images/logos/logo-lonja-isla.png" alt="Logo" className=" h-32 mx-auto mb-4" />

                <div className="container mx-auto p-6 max-w-5xl ">
                    <div className="grid gap-6 md:grid-cols-2 ">
                        {/* Sección de Datos del Albarán */}
                        <Card className="col-span-2 bg-white text-black border-neutral-200">
                            <CardHeader className="pb-0">
                                <CardTitle className="text-base">Listado de Compras</CardTitle>
                            </CardHeader>
                            <CardContent className="px-10 py-5 w-full">
                                <div className="flex flex-col  gap-2">
                                    <div className="flex-1">
                                        <div className="text-base font-bold">
                                            {lonja}
                                        </div>
                                    </div>
                                    <div className="flex-1 grid grid-cols-2 gap-3">
                                        <Card className="p-3 text-sm bg-white text-black border-neutral-200 border-0 border-b-1">
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
                                        </Card>
                                        <Card className="p-3 text-sm bg-white text-black border-neutral-200 border-0 border-b-1 ">
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
                                        </Card>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tabla de Compras */}
                        <Card className="col-span-2 bg-white text-black border-neutral-200">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-semibold">Ventas</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="hover:bg-white">
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
                                        <TableBody className=''>
                                            {ventas.map((venta, index) => (
                                                <TableRow key={index} className="hover:bg-muted hover:text-white">
                                                    <TableCell>{venta.venta}</TableCell>
                                                    <TableCell>{venta.barco}</TableCell>
                                                    <TableCell>{venta.especie}</TableCell>
                                                    <TableCell className="text-right">{venta.cajas}</TableCell>
                                                    <TableCell className="text-right">{venta.kilos} kg</TableCell>
                                                    <TableCell className="text-right">{venta.precio} €/kg</TableCell>
                                                    <TableCell className="text-right">{venta.importe}€</TableCell>
                                                    <TableCell>{venta.nrsi}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Resumen por Especie */}
                        <Card className='bg-white text-black border-neutral-200'>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-semibold">Peces</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader >
                                        <TableRow className="hover:bg-white">
                                            <TableHead>FAO</TableHead>
                                            <TableHead>Especie</TableHead>
                                            <TableHead className="text-right">Cajas</TableHead>
                                            <TableHead className="text-right">Kilos</TableHead>
                                            <TableHead className="text-right">Importe</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {peces.map((especie, index) => (
                                            <TableRow key={index} className="hover:bg-muted hover:text-white">
                                                <TableCell>{especie.fao}</TableCell>
                                                <TableCell>{especie.descripcion}</TableCell>
                                                <TableCell className="text-right">{especie.cajas}</TableCell>
                                                <TableCell className="text-right">{especie.kilos} kg</TableCell>
                                                <TableCell className="text-right">{especie.importe}€</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Tipo de Envase */}
                        <Card className='bg-white text-black border-neutral-200'>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-semibold">Cajas</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-white">
                                            <TableHead>Tipo</TableHead>
                                            <TableHead className="text-right">Cajas</TableHead>
                                            <TableHead className="text-right">Importe</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {cajas.map((tipo, index) => (
                                            <TableRow key={index} className="hover:bg-muted hover:text-white">
                                                <TableCell>{tipo.descripcion}</TableCell>
                                                <TableCell className="text-right">{tipo.cajas}</TableCell>
                                                <TableCell className="text-right">{tipo.importe} €</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Resumen por Vendeduría */}
                        <Card className='bg-white text-black border-neutral-200'>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-semibold">Compras por Vendeduría</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-white">
                                            <TableHead>Vendedor</TableHead>
                                            <TableHead className="text-right">Cajas</TableHead>
                                            <TableHead className="text-right">Kilos</TableHead>
                                            <TableHead className="text-right">Importe</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {vendidurias.map((vendiduria, index) => (
                                            <TableRow key={index} className="hover:bg-muted hover:text-white">
                                                <TableCell>{vendiduria.vendiduria}</TableCell>
                                                <TableCell className="text-right">{vendiduria.cajas}</TableCell>
                                                <TableCell className="text-right">{vendiduria.kilos} kg</TableCell>
                                                <TableCell className="text-right">{vendiduria.importe}€</TableCell>
                                            </TableRow>
                                        ))}

                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Tipo de Subasta */}
                        <Card className='bg-white text-black border-neutral-200'>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-semibold">Tipo de Subasta</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-white">
                                            <TableHead>COD</TableHead>
                                            <TableHead>Tipo</TableHead>
                                            <TableHead className="text-right">Cajas</TableHead>
                                            <TableHead className="text-right">Importe</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {tipoVentas.map((tipo, index) => (
                                            <TableRow key={index} className="hover:bg-muted hover:text-white">
                                                <TableCell>{tipo.cod}</TableCell>
                                                <TableCell>{tipo.descripcion}</TableCell>
                                                <TableCell className="text-right">{tipo.cajas}</TableCell>
                                                <TableCell className="text-right">{tipo.importe}€</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Total */}
                        <Card className="col-span-2 bg-white text-black border-neutral-200  ">
                            <CardContent className='flex flex-col items-center justify-center mt-4'>
                                <div className="w-full flex justify-between items-center">
                                    <p className="text-lg font-medium">Importe Total</p>
                                    <p className="text-xl font-bold">{importeTotal} €</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {!hideExport && (
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <div className="fixed bottom-8 right-9">
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

export default ListadoComprasLonjaDeIsla