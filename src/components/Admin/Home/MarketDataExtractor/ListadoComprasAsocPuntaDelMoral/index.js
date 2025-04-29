'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Download } from 'lucide-react'
import React, { useState } from 'react'
/* import ExportModal from './ExportModal' */
import {
    Dialog,
    DialogTrigger,
} from "@/components/ui/dialog"
import ExportModal from './ExportModal'

const ListadoComprasAsocPuntaDelMoral = ({ document }) => {
    const [open, setOpen] = useState(false)
    const { details, tables } = document
    const { lonja, cifComprador, comprador, fecha, tipoSubasta, importeTotal } = details
    const { subastas } = tables
    const isVentaDirecta = tipoSubasta == 'M1 M1'
    const isSubasta = tipoSubasta == 'T2 Arrastre'

    return (
        <div className='py-8'>
            <div className="container mx-auto p-6 py-6 space-y-3 bg-white text-black rounded-md shadow-md">

                <img src="/images/logos/logo-asoc-punta-del-moral.png" alt="Logo" className=" h-32 mx-auto mb-4" />

                <Card className='bg-white text-black border-neutral-200'>
                    <CardHeader className="pb-0">
                        <CardTitle className="text-base">Listado de Compras</CardTitle>
                    </CardHeader>
                    <CardContent className="px-10 py-5">
                        <div className="flex flex-col gap-2">
                            <div className="flex-1">
                                <div className="text-base font-bold">{lonja}</div>
                                {/* <div className="text-sm">C.I.F.: {cifLonja}</div> */}
                            </div>

                            <div className="flex-1 grid grid-cols-2 gap-3">
                                <Card className="p-3 text-sm bg-white text-black border-neutral-200 border-0 border-b-1">
                                    <div className="flex gap-1">
                                        <div className="font-semibold">Fecha:</div>
                                        <div>{fecha}</div>
                                    </div>
                                    <div className="flex gap-1">
                                        <div className="font-semibold">Tipo de Venta:</div>
                                        <div>
                                            {isVentaDirecta ? 'Venta Directa' : isSubasta ? 'Subasta' : 'Desconocido'}
                                        </div>
                                    </div>
                                </Card>

                                <Card className="p-3 text-sm bg-white text-black border-neutral-200 border-0 border-b-1">
                                    <div className="flex gap-1">
                                        <div className="font-semibold">Comprador:</div>
                                        <div>{comprador}</div>
                                    </div>
                                    <div className="flex gap-1">
                                        <div className="font-semibold">C.I.F.:</div>
                                        <div>{cifComprador}</div>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className='bg-white text-black border-neutral-200'>
                    <CardHeader className="pb-0 pt-3 px-3">
                        <CardTitle>Subastas</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3">
                        <div className="overflow-x-auto">
                            <Table className="border-collapse [&_th]:p-2 [&_td]:p-2 text-xs">
                                <TableHeader>
                                    <TableRow className="hover:bg-white">
                                        <TableHead>Venta</TableHead>
                                        <TableHead>
                                            Especie
                                            <br />
                                            FAO
                                        </TableHead>
                                        <TableHead>
                                            Calibre
                                            <br />
                                            Envase
                                        </TableHead>
                                        <TableHead>Cajas</TableHead>
                                        <TableHead>Peso Neto</TableHead>
                                        <TableHead>
                                            Arte Pesca
                                            <br />
                                            Método Producción
                                        </TableHead>
                                        <TableHead>
                                            Lote
                                            <br />
                                            Zona Captura
                                        </TableHead>
                                        <TableHead>Precio</TableHead>
                                        <TableHead>Importe</TableHead>
                                        <TableHead>
                                            Barco
                                            <br />
                                            Matricula
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {document.tables.subastas.map((item, index) => (
                                        <TableRow key={index} className="hover:bg-muted hover:text-white">
                                            <TableCell>
                                                {item.venta}
                                            </TableCell>
                                            <TableCell>
                                                {item.especie}
                                                <br />
                                                {item.fao} - {item.nombreCientifico}
                                            </TableCell>
                                            <TableCell>
                                                {item.calibre}
                                                <br />
                                                {item.envase}
                                            </TableCell>
                                            <TableCell>{item.cajas}</TableCell>
                                            <TableCell>{item.pesoNeto} kg</TableCell>
                                            <TableCell>
                                                {item.artePesca}
                                                <br />
                                                {item.metodoProduccion}
                                            </TableCell>
                                            <TableCell>
                                                {item.lote}
                                                <br />
                                                {item.zonaCaptura}
                                            </TableCell>
                                            <TableCell>{item.precio}</TableCell>
                                            <TableCell>{item.importe} €</TableCell>
                                            <TableCell>
                                                {item.barco}
                                                <br />
                                                {item.matricula}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                <Card className="flex items-center justify-between p-3 bg-white text-black border-neutral-200">
                    <span className="text-base font-semibold">Total</span>
                    <div className="text-xl font-medium text-right">{importeTotal} €</div>
                </Card>
            </div>

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

export default ListadoComprasAsocPuntaDelMoral