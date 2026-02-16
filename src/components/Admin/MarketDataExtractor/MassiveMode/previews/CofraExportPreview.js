"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { calculateImporteFromLinea } from "@/exportHelpers/common";
import { armadores, barcos, lonjas } from "../../AlbaranCofraWeb/exportData";

export default function CofraExportPreview({ document }) {
    const { detalles: { numero, fecha, cifLonja, lonja }, tablas } = document;

    const subastasGroupedByBarco = tablas.subastas.reduce((acc, item) => {
        if (!acc[item.barco]) {
            acc[item.barco] = {
                nombre: item.barco,
                cod: item.cod,
                armador: item.armador,
                cifArmador: item.cifArmador,
                lineas: []
            };
        }
        acc[item.barco].lineas.push(item);
        return acc;
    }, {});
    const subastas = Object.values(subastasGroupedByBarco);
    const servicios = tablas.servicios || [];

    const isConvertibleArmador = (cifArmador) => armadores.some((armador) => armador.cif === cifArmador);
    const isConvertibleLonja = lonjas.some((l) => l.cif === cifLonja);

    return (
        <div className="space-y-4">
            {subastas.map((barco) => (
                <Card key={barco.cod}>
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">{barco.nombre}</CardTitle>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{barco.armador}</span>
                                {isConvertibleArmador(barco.cifArmador) ? (
                                    <Badge variant="outline" className="bg-green-900 text-green-200 border-green-500 flex items-center gap-1">
                                        <Check className="h-3.5 w-3.5" />
                                        Exportable
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="bg-red-900 text-red-200 border-red-500 flex items-center gap-1">
                                        <X className="h-3.5 w-3.5" />
                                        No exportable
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Cajas</TableHead>
                                    <TableHead>Producto</TableHead>
                                    <TableHead className="text-right">Cantidad</TableHead>
                                    <TableHead className="text-right">Precio</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {barco.lineas.map((linea, index) => (
                                    <TableRow key={index} className="hover:bg-muted/50">
                                        <TableCell className="font-medium">{linea.cajas}</TableCell>
                                        <TableCell>{linea.pescado}</TableCell>
                                        <TableCell className="text-right">{linea.kilos}</TableCell>
                                        <TableCell className="text-right">{linea.precio} €</TableCell>
                                        <TableCell className="text-right font-medium">
                                            {calculateImporteFromLinea(linea)} €
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            ))}

            {servicios.length > 0 && (
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">Servicios</CardTitle>
                            {isConvertibleLonja ? (
                                <Badge variant="outline" className="bg-green-900 text-green-200 border-green-500 flex items-center gap-1">
                                    <Check className="h-3.5 w-3.5" />
                                    Exportable
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="bg-red-900 text-red-200 border-red-500 flex items-center gap-1">
                                    <X className="h-3.5 w-3.5" />
                                    No exportable
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Cod</TableHead>
                                    <TableHead>Descripción</TableHead>
                                    <TableHead className="text-right">Fecha</TableHead>
                                    <TableHead className="text-right">Cantidad</TableHead>
                                    <TableHead className="text-right">Precio</TableHead>
                                    <TableHead className="text-right">Iva</TableHead>
                                    <TableHead className="text-right">Importe</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {servicios.map((servicio, index) => (
                                    <TableRow key={index} className="hover:bg-muted/50">
                                        <TableCell className="font-medium">{servicio.codigo}</TableCell>
                                        <TableCell>{servicio.descripcion}</TableCell>
                                        <TableCell className="text-right">{servicio.fecha}</TableCell>
                                        <TableCell className="text-right">{servicio.unidades}</TableCell>
                                        <TableCell className="text-right">{servicio.precio} €</TableCell>
                                        <TableCell className="text-right">{servicio.iva} €</TableCell>
                                        <TableCell className="text-right font-medium">{servicio.importe} €</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
