import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import React from 'react'

const AlbaranCofraWeb = ({ document }) => {
    return (
        <div>
            <div className="container mx-auto py-3 space-y-3">
                {/* Sección de Datos del Albarán */}
                <Card>
                    <CardHeader className="pb-0">
                        <CardTitle className="text-base">Albarán Cofra Web</CardTitle>
                    </CardHeader>
                    <CardContent className="px-10 py-5">
                        <div className="flex flex-col  gap-2">
                            {/* Información de la Lonja - Lado izquierdo */}
                            <div className="flex-1">
                                <div className="text-base font-bold">
                                    {document.detalles.lonja}
                                </div>
                                <div className="text-sm">C.I.F.: {document.detalles.cifLonja}</div>
                            </div>

                            {/* Información del Albarán - Lado derecho */}
                            <div className="flex-1 grid grid-cols-2 gap-3">
                                <div className="border border-muted p-3 rounded-md text-sm">
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
                                </div>

                                <div className=" border border-muted p-3 rounded-md text-sm">
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
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabla de Subastas */}
                <Card>
                    <CardHeader className="pb-0 pt-3 px-3">
                        <CardTitle>Subastas</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3">
                        <div className="overflow-x-auto">
                            <Table className="border-collapse [&_th]:p-2 [&_td]:p-2">
                                <TableHeader>
                                    <TableRow>
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
                                        <TableRow key={index}>
                                            <TableCell>{row.cajas} {row.tipoCaja}</TableCell>
                                            <TableCell>{row.kilos}</TableCell>
                                            <TableCell>{row.pescado}</TableCell>
                                            <TableCell>{row.cod}</TableCell>
                                            <TableCell>{row.barco}</TableCell>
                                            <TableCell>
                                                {row.armador} <br />
                                                {row.cifArmador}
                                            </TableCell>
                                            <TableCell>{row.precio}</TableCell>
                                            <TableCell>{row.importe}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabla de Servicios */}
                <Card>
                    <CardHeader className="pb-0 pt-3 px-3">
                        <CardTitle>Servicios</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3">
                        <div className="overflow-x-auto">
                            <Table className="border-collapse [&_th]:p-2 [&_td]:p-2">
                                <TableHeader>
                                    <TableRow>
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
                                        <TableRow key={index}>
                                            <TableCell>{row.codigo}</TableCell>
                                            <TableCell>{row.descripcion}</TableCell>
                                            <TableCell>{row.fecha}</TableCell>
                                            <TableCell>{row.iva}</TableCell>
                                            <TableCell>{row.rec}</TableCell>
                                            <TableCell>{row.unidades}</TableCell>
                                            <TableCell>{row.precio}</TableCell>
                                            <TableCell>{row.importe}</TableCell>
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
                    <Card>
                        <CardHeader className="pb-0 pt-3 px-3">
                            <CardTitle>Subtotales Pesca</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3">
                            <Table className="border-collapse [&_th]:p-2 [&_td]:p-2">
                                <TableBody>
                                    <TableRow>
                                        <TableCell className="font-medium">Total Pesca</TableCell>
                                        <TableCell className="text-right">
                                            {document.subtotales.pesca.subtotal}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">IVA Pesca</TableCell>
                                        <TableCell className="text-right">
                                            {document.subtotales.pesca.iva}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
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
                    <Card>
                        <CardHeader className="pb-0 pt-3 px-3">
                            <CardTitle>Subtotales Servicios</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3">
                            <Table className="border-collapse [&_th]:p-2 [&_td]:p-2">
                                <TableBody>
                                    <TableRow>
                                        <TableCell className="font-medium">Total Servicios</TableCell>
                                        <TableCell className="text-right">
                                            {document.subtotales.servicios.subtotal}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">IVA Servicios</TableCell>
                                        <TableCell className="text-right">
                                            {document.subtotales.servicios.iva}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
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
                    <Card>
                        <CardHeader className="pb-0 pt-3 px-3">
                            <CardTitle>Subtotales Cajas</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3">
                            <Table className="border-collapse [&_th]:p-2 [&_td]:p-2">
                                <TableBody>
                                    <TableRow>
                                        <TableCell className="font-medium">Cajas</TableCell>
                                        <TableCell className="text-right">
                                            {document.subtotales.cajas.subtotal}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">IVA Cajas</TableCell>
                                        <TableCell className="text-right">
                                            {document.subtotales.cajas.iva}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
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
                <Card className="flex items-center justify-between p-3">
                    <span>Total</span>
                    <div className="text-2xl font-bold text-right">
                        {document.detalles.importeTotal} €
                    </div>
                </Card>
            </div>
        </div>
    )
}

export default AlbaranCofraWeb