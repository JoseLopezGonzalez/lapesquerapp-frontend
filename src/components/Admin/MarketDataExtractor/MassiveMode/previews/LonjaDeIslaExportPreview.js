"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { calculateImporteFromLinea } from "@/exportHelpers/common";
import { barcos as barcosLonja, barcosVentaDirecta, datosVendidurias, serviciosLonjaDeIsla, servicioExtraLonjaDeIsla, PORCENTAJE_SERVICIOS_VENDIDURIAS } from "../../ListadoComprasLonjaDeIsla/exportData";

export default function LonjaDeIslaExportPreview({ document }) {
    const { tables: { ventas } } = document;

    const ventasVendidurias = {};
    const ventasDirectas = {};

    ventas.forEach((venta) => {
        const barcoEncontrado = barcosLonja.find((barco) =>
            barco.cod === venta.codBarco || barco.barco === venta.barco
        );
        if (!barcoEncontrado) return;

        const nombreBarco = barcoEncontrado.barco;
        const codBarco = `${barcoEncontrado.cod}`;
        const barcoVentaDirectaEncontrado = barcosVentaDirecta.find((barco) => barco.cod === codBarco);

        if (!barcoVentaDirectaEncontrado) {
            const vendiduria = datosVendidurias.find((v) => v.cod === barcoEncontrado.codVendiduria);
            if (!vendiduria) return;
            if (!ventasVendidurias[codBarco]) {
                ventasVendidurias[codBarco] = { cod: codBarco, nombre: nombreBarco, vendiduria, lineas: [] };
            }
            ventasVendidurias[codBarco].lineas.push(venta);
        } else {
            const armador = barcoVentaDirectaEncontrado.armador;
            if (!ventasDirectas[codBarco]) {
                ventasDirectas[codBarco] = { cod: codBarco, nombre: nombreBarco, armador, lineas: [] };
            }
            ventasDirectas[codBarco].lineas.push(venta);
        }
    });

    const importeTotalVentasDirectas = Object.values(ventasDirectas).reduce((acc, barco) =>
        acc + barco.lineas.reduce((sum, linea) => sum + calculateImporteFromLinea(linea), 0), 0);

    const servicios = serviciosLonjaDeIsla.map((s) => ({
        ...s,
        unidades: 1,
        base: importeTotalVentasDirectas,
        precio: (importeTotalVentasDirectas * s.porcentaje) / 100,
        importe: (importeTotalVentasDirectas * s.porcentaje) / 100,
    }));
    const tarifaG4 = servicios.find((s) => s.descripcion === 'REPERCUSION TARIFA G-4 COMP.')?.importe || 0;
    servicios.splice(1, 0, {
        ...servicioExtraLonjaDeIsla,
        unidades: 1,
        base: tarifaG4,
        precio: tarifaG4 * servicioExtraLonjaDeIsla.porcentaje / 100,
        importe: tarifaG4 * servicioExtraLonjaDeIsla.porcentaje / 100,
    });

    const getImporteServiciosVendiduria = (lineas) => {
        const total = lineas.reduce((acc, linea) => acc + calculateImporteFromLinea(linea), 0);
        return (total * PORCENTAJE_SERVICIOS_VENDIDURIAS / 100).toFixed(2);
    };

    const isConvertibleBarco = (cod) => barcosLonja.some((b) => b.cod === cod);
    const ventasVendiduriasArray = Object.values(ventasVendidurias).filter(Boolean);
    const ventasDirectasArray = Object.values(ventasDirectas).filter(Boolean);

    return (
        <div className="space-y-4">
            {ventasDirectasArray.length > 0 && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Ventas Directas</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        {ventasDirectasArray.map((barco, index) => (
                            <Card key={`${barco.nombre}-${index}`}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-lg">{barco.nombre}</span>
                                                <span className="text-sm text-muted-foreground">{barco.armador?.nombre}</span>
                                            </div>
                                        </CardTitle>
                                        <Badge variant="outline" className="bg-green-900 text-green-200 border-green-500 flex items-center gap-1">
                                            <Check className="h-3.5 w-3.5" /> Exportable
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Cajas</TableHead>
                                                <TableHead>Producto</TableHead>
                                                <TableHead className="text-right">Peso Neto</TableHead>
                                                <TableHead className="text-right">Precio</TableHead>
                                                <TableHead className="text-right">Importe</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {barco.lineas.map((linea, idx) => (
                                                <TableRow key={idx} className="hover:bg-muted/50">
                                                    <TableCell className="font-medium">{linea.cajas}</TableCell>
                                                    <TableCell>{linea.especie}</TableCell>
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
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg">Servicios Lonja de Isla Cristina</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Descripción</TableHead>
                                            <TableHead className="text-right">Base</TableHead>
                                            <TableHead className="text-right">Porcentaje</TableHead>
                                            <TableHead className="text-right">Precio</TableHead>
                                            <TableHead className="text-right">Importe</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {servicios.map((s, i) => (
                                            <TableRow key={i} className="hover:bg-muted/50">
                                                <TableCell>{s.descripcion}</TableCell>
                                                <TableCell className="text-right">{s.base.toFixed(2)} €</TableCell>
                                                <TableCell className="text-right">{s.porcentaje} %</TableCell>
                                                <TableCell className="text-right">{s.precio.toFixed(2)} €</TableCell>
                                                <TableCell className="text-right font-medium">{s.importe.toFixed(2)} €</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </CardContent>
                </Card>
            )}
            {ventasVendiduriasArray.length > 0 && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Ventas Vendidurias</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        {ventasVendiduriasArray.map((barco, index) => (
                            <Card key={`${barco.nombre}-${index}`}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-lg">{barco.nombre}</span>
                                                <span className="text-sm text-muted-foreground">{barco.vendiduria?.nombre}</span>
                                            </div>
                                        </CardTitle>
                                        {isConvertibleBarco(barco.cod) ? (
                                            <Badge variant="outline" className="bg-green-900 text-green-200 border-green-500 flex items-center gap-1">
                                                <Check className="h-3.5 w-3.5" /> Exportable
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-red-900 text-red-200 border-red-500 flex items-center gap-1">
                                                <X className="h-3.5 w-3.5" /> No exportable
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Cajas</TableHead>
                                                <TableHead>Producto</TableHead>
                                                <TableHead className="text-right">Peso Neto</TableHead>
                                                <TableHead className="text-right">Precio</TableHead>
                                                <TableHead className="text-right">Importe</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {barco.lineas.map((linea, idx) => (
                                                <TableRow key={idx} className="hover:bg-muted/50">
                                                    <TableCell className="font-medium">{linea.cajas}</TableCell>
                                                    <TableCell>{linea.especie}</TableCell>
                                                    <TableCell className="text-right">{linea.kilos}</TableCell>
                                                    <TableCell className="text-right">{linea.precio} €</TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        {calculateImporteFromLinea(linea)} €
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow>
                                                <TableCell></TableCell>
                                                <TableCell className="font-medium">Importe Servicios Vendiduria</TableCell>
                                                <TableCell></TableCell>
                                                <TableCell></TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {getImporteServiciosVendiduria(barco.lineas)} €
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
