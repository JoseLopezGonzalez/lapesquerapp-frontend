import React, { useState } from 'react'
import { Check, X, AlertTriangle, FileSpreadsheet } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { armadores, lonjas } from '../exportData'
import { Input } from '@/components/ui/input'

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const ExportModal = ({ document }) => {
    const [software, setSoftware] = useState("A3ERP")
    const [initialAlbaranNumber, setInitialAlbaranNumber] = useState("")

    const cifLonja = document.detalles.cifLonja
    const nombreLonja = document.detalles.lonja

    const isConvertibleLonja = lonjas.some((lonja) => lonja.cif === cifLonja)

    console.log('Document:', document)

    const subastasGroupedByBarco = document.tablas.subastas.reduce((acc, item) => {
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

    const isConvertibleArmador = (cifArmador) => {
        return armadores.some((armador) => armador.cif === cifArmador);
    };

    const isSomeArmadorNotConvertible = subastas.some((barco) => !isConvertibleArmador(barco.cifArmador));

    console.log(subastas);

    const servicios = document.tablas.servicios;

    console.log(servicios);

    const exportableData = [

    ]
    const generateExcelForA3erp = ({
        headerData, // contiene número albarán, fecha, lonja, cif_lonja, etc.
    }) => {
        const processedRows = [];
        let albaranNumber = Number(initialAlbaranNumber);

        // Agrupamos líneas de subasta por armador
        const groupedByArmador = subastas.reduce((acc, line) => {
            const key = line.cifArmador;
            if (!acc[key]) acc[key] = [];
            acc[key].push(line);
            return acc;
        }, {});

        for (const [cifArmador, lines] of Object.entries(groupedByArmador)) {
            const armadorData = armadores.find(a => a.cif === cifArmador);
            if (!armadorData) {
                console.error(`Falta código de conversión para armador ${cifArmador}`);
                continue; // o lanza un toast o marca el error visualmente
            }

            lines.forEach(barco => {
                console.log('line:', barco);
                barco.lineas.forEach(linea => {
                    processedRows.push({
                        CABNUMDOC: albaranNumber,
                        CABFECHA: headerData.fecha,
                        CABCODPRO: armadorData.codA3erp,
                        CABREFERENCIA: `${barco.nombre}`,
                        LINCODART: 95,
                        LINDESCLIN: 'PULPO FRESCO LONJA',
                        LINUNIDADES: linea.kilos,
                        LINPRCMONEDA: linea.precio,
                        LINTIPIVA: 'RED10',
                    });
                });
          });

            albaranNumber++;
        }

        // Albarán para la lonja con los servicios
        const lonjaData = lonjas.find(l => l.cif === headerData.cifLonja);
        if (!lonjaData) {
            console.error(`Falta código de conversión para la lonja ${headerData.cif_lonja}`);
        } else {
            servicios.forEach(line => {
                const calculatedPrecio = parseFloat(line.importe) / parseFloat(line.unidades);
                processedRows.push({
                    CABNUMDOC: albaranNumber,
                    CABFECHA: headerData.fecha,
                    CABCODPRO: lonjaData.codA3erp,
                    CABREFERENCIA: `${headerData.numero} - ${nombreLonja}`,
                    LINCODART: 9998,
                    LINDESCLIN: line.descripcion,
                    LINUNIDADES: line.unidades,
                    LINPRCMONEDA: calculatedPrecio,
                    LINTIPIVA: 'ORD21',
                });
            });

            albaranNumber++;
        }

        // Crear el libro y hoja
        const worksheet = XLSX.utils.json_to_sheet(processedRows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'ALBARANES');

        // Guardar archivo
        const excelBuffer = XLSX.write(workbook, { bookType: 'xls', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.ms-excel' });
        saveAs(blob, `ALBARANES_A3ERP_${headerData.fecha}.xls`);
    };

    return (
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>Exportar Datos de Factura</DialogTitle>
                <DialogDescription>
                    Seleccione el software de destino y verifique los datos antes de exportar.
                </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 items-center gap-4">
                    <div className='flex flex-col gap-1'>
                        <label htmlFor="software" className=" font-medium">
                            Software
                        </label>
                        <Select value={software} onValueChange={setSoftware}>
                            <SelectTrigger id="software" className="col-span-3">
                                <SelectValue placeholder="Seleccione software de destino" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="A3ERP">A3ERP</SelectItem>
                                <SelectItem value="Facilcom">Facilcom</SelectItem>
                                <SelectItem value="Otros">Otros</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className='flex flex-col gap-1'>
                        <label htmlFor="software" className=" font-medium">
                            Contador Inicio Albaranes
                        </label>
                        <Input type="number" placeholder='000' />
                    </div>
                </div>
                <div className='flex flex-col gap-1'>
                    {!isConvertibleLonja ? (
                        <div className="flex items-center gap-1 p-1  text-amber-500  rounded-md ">
                            <AlertTriangle className="h-4 w-4 " />
                            <span className="text-xs">
                                Los servicios de la lonja <strong>{nombreLonja} - {cifLonja}</strong> no son exportables.
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 p-1  text-green-500   rounded-md">
                            <Check className="h-4 w-4" />
                            <span className="text-xs">
                                Los servicios de la lonja <strong>{nombreLonja} - {cifLonja}</strong> son exportables.
                            </span>
                        </div>
                    )}

                    {isSomeArmadorNotConvertible ? (
                        <div className="flex items-center gap-1 p-1  text-amber-500  rounded-md ">
                            <AlertTriangle className="h-4 w-4 " />
                            <span className="text-xs">
                                Todos los armadores no son exportables.
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 p-1  text-green-500  rounded-md">
                            <Check className="h-4 w-4" />
                            <span className="text-xs">
                                Todos los armadores son exportables.
                            </span>
                        </div>
                    )}
                </div>

                <div className="space-y-4 mt-2">
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
                                                    {linea.importe} €
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
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg">Servicios</CardTitle>
                                <div className="flex items-center gap-2">
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
                                        {/* iva */}
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
                </div>
            </div>

            <DialogFooter>
                <DialogTrigger asChild>
                    <Button variant="outline">
                        Cancelar
                    </Button>
                </DialogTrigger>
                <Button className="gap-2" onClick={() => generateExcelForA3erp({ headerData: document.detalles })}>
                    <FileSpreadsheet className="h-4 w-4" />
                    Exportar a A3ERP
                </Button>
            </DialogFooter>
        </DialogContent>
    )
}

export default ExportModal