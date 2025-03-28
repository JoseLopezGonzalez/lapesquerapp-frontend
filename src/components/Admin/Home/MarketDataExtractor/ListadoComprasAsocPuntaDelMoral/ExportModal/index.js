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
import { armadores, asocArmadoresPuntaDelMoral, asocArmadoresPuntaDelMoralSubasta, barcos, lonjas, productos, servicioExtraAsocArmadoresPuntaDelMoral, serviciosAsocArmadoresPuntaDelMoral } from '../exportData'
import { Input } from '@/components/ui/input'

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { parseEuropeanNumber } from '@/helpers/formats/numbers/formatNumbers'

const ExportModal = ({ document }) => {
    const [software, setSoftware] = useState("A3ERP")
    const [initialAlbaranNumber, setInitialAlbaranNumber] = useState("")

    const { details, tables } = document
    const { lonja, cifComprador, comprador, fecha, tipoSubasta, importeTotal } = details
    const isVentaDirecta = tipoSubasta == 'M1 M1'
    const isSubasta = tipoSubasta == 'T2 Arrastre'


    /* asocArmadoresPuntaDelMoral */

    /* const isConvertibleLonja = lonjas.some((lonja) => lonja.cif === cifLonja) */

    const subastasGroupedByBarco = document.tables.subastas.reduce((acc, item) => {
        if (!acc[item.barco]) {
            acc[item.barco] = {
                nombre: item.barco,
                matricula: item.matricula,
                lineas: [],
            };
        }
        acc[item.barco].lineas.push(item);
        return acc;
    }, {});

    const subastas = Object.values(subastasGroupedByBarco);




    const isConvertibleBarco = (matricula) => {
        return barcos.some((barco) => barco.matricula === matricula);
    };

    const isSomeBarcoNotConvertible = subastas.some((barco) => !isConvertibleBarco(barco.matricula));


    const servicios = serviciosAsocArmadoresPuntaDelMoral.map((servicio) => {

        return {
            ...servicio,
            unidades: 1,
            base: parseEuropeanNumber(importeTotal),
            precio: (parseEuropeanNumber(importeTotal) * servicio.porcentaje) / 100,
            importe: (parseEuropeanNumber(importeTotal) * servicio.porcentaje) / 100,
        }
    })

    /* Añadir en segunda posicion servvicio extra a servicios */
    const servicioExtra = {
        ...servicioExtraAsocArmadoresPuntaDelMoral,
        unidades: 1,
        base: (servicios.find((servicio) => servicio.descripcion === 'Tarifa G-4').importe),
        precio: (servicios.find((servicio) => servicio.descripcion === 'Tarifa G-4').importe) * servicioExtraAsocArmadoresPuntaDelMoral.porcentaje / 100,
        importe: (servicios.find((servicio) => servicio.descripcion === 'Tarifa G-4').importe) * servicioExtraAsocArmadoresPuntaDelMoral.porcentaje / 100,
    }
    servicios.splice(1, 0, servicioExtra)




    const generateExcelForA3erp = ({
        headerData, // contiene número albarán, fecha, lonja, cif_lonja, etc.
    }) => {
        const processedRows = [];
        let albaranNumber = Number(initialAlbaranNumber);

        // Agrupamos líneas de subasta por armador
        const groupedByBarco = subastas.reduce((acc, line) => {
            const key = line.matricula;
            if (!acc[key]) acc[key] = [];
            acc[key].push(line);
            return acc;
        }, {});

        if (isVentaDirecta) {

            for (const [matricula, lines] of Object.entries(groupedByBarco)) {
                const barcoData = barcos.find(a => a.matricula === matricula);
                if (!barcoData) {
                    console.error(`Falta código de conversión para barco ${matricula}`);
                    continue; // o lanza un toast o marca el error visualmente
                }

                lines.forEach(l => {
                    l.lineas.forEach(linea => {
                        processedRows.push({
                            CABNUMDOC: albaranNumber,
                            CABFECHA: fecha,
                            CABCODPRO: asocArmadoresPuntaDelMoral.codA3erp,
                            CABREFERENCIA: `${fecha} - ${barcoData.nombre}`,
                            LINCODART: productos.find(p => p.nombre === linea.especie).codA3erp,
                            LINDESCLIN: linea.especie,
                            LINUNIDADES: parseEuropeanNumber(linea.pesoNeto),
                            LINPRCMONEDA: parseEuropeanNumber(linea.precio),
                            LINTIPIVA: 'RED10',
                        });
                    });
                });

                albaranNumber++;
            }
        } else if (isSubasta) {

            document.tables.subastas.forEach(linea => {
                processedRows.push({
                    CABNUMDOC: albaranNumber,
                    CABFECHA: fecha,
                    CABCODPRO: asocArmadoresPuntaDelMoralSubasta.codA3erp,
                    CABREFERENCIA: `${fecha} - SUBASTA`,
                    LINCODART: productos.find(p => p.nombre === linea.especie).codA3erp,
                    LINDESCLIN: linea.especie,
                    LINUNIDADES: parseEuropeanNumber(linea.pesoNeto),
                    LINPRCMONEDA: parseEuropeanNumber(linea.precio),
                    LINTIPIVA: 'RED10',
                });
            });
        }




        servicios.forEach(line => {
            processedRows.push({
                CABNUMDOC: albaranNumber,
                CABFECHA: fecha,
                CABCODPRO: isVentaDirecta ? asocArmadoresPuntaDelMoral.codA3erp : asocArmadoresPuntaDelMoralSubasta.codA3erp,
                CABREFERENCIA: `${fecha} - SERVICIOS`,
                LINCODART: 9999,
                LINDESCLIN: line.descripcion,
                LINUNIDADES: line.unidades,
                LINPRCMONEDA: line.precio,
                LINTIPIVA: 'RED10',
            });
        });

        albaranNumber++;


        // Crear el libro y hoja
        const worksheet = XLSX.utils.json_to_sheet(processedRows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'ALBARANESCOMPRA');

        // Guardar archivo
        const excelBuffer = XLSX.write(workbook, { bookType: 'xls', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.ms-excel' });
        saveAs(blob, `ALBARANES_A3ERP_${fecha}.xls`);
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
                        <Input type="number" value={initialAlbaranNumber} placeholder='000' onChange={(e) => setInitialAlbaranNumber(e.target.value)} />
                    </div>
                </div>
                <div className='flex flex-col gap-1'>
                    {isVentaDirecta && (
                        <div className="flex items-center gap-1 p-1 text-white bg-white/30 w-fit px-2 border border-white rounded-md">
                            <span className="text-xs">
                                Albarán de Venta Directa
                            </span>
                        </div>
                    )}

                    {isSubasta && (
                        <div className="flex items-center gap-1 p-1 text-white bg-white/30 w-fit px-2 border border-white rounded-md">
                            <span className="text-xs">
                                Albarán de Subasta
                            </span>
                        </div>
                    )}

                    {/* {isSomeBarcoNotConvertible ? (
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
                    )} */}
                </div>

                <div className="space-y-4 mt-2">
                    {/*  {subastas.map((barco) => (
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
                    ))} */}
                    {isSubasta && (
                        <Card>
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
                                        {document.tables.subastas.map((linea, index) => (
                                            <TableRow key={index} className="hover:bg-muted/50">
                                                <TableCell className="font-medium">{linea.cajas}</TableCell>
                                                <TableCell>{linea.especie}</TableCell>
                                                <TableCell className="text-right">{linea.pesoNeto}</TableCell>
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
                    )}

                    {isVentaDirecta && subastas.map((barco, index) => (
                        <Card key={`${barco.nombre}-${index}`}>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-lg">{barco.nombre}</CardTitle>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        Matrícula: {barco.matricula}

                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">{barco.armador}</span>
                                            {isConvertibleBarco(barco.matricula) ? (
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
                                        {barco.lineas.map((linea, index) => (
                                            <TableRow key={index} className="hover:bg-muted/50">
                                                <TableCell className="font-medium">{linea.cajas}</TableCell>
                                                <TableCell>{linea.especie}</TableCell>
                                                <TableCell className="text-right">{linea.pesoNeto}</TableCell>
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
                                    {/* {isConvertibleLonja ? (
                                        <Badge variant="outline" className="bg-green-900 text-green-200 border-green-500 flex items-center gap-1">
                                            <Check className="h-3.5 w-3.5" />
                                            Exportable
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="bg-red-900 text-red-200 border-red-500 flex items-center gap-1">
                                            <X className="h-3.5 w-3.5" />
                                            No exportable
                                        </Badge>
                                    )} */}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {/* <TableHead>Cod</TableHead> */}
                                        <TableHead>Descripción</TableHead>
                                        {/*  <TableHead className="text-right">Fecha</TableHead> */}
                                        <TableHead className="text-right">Base</TableHead>
                                        <TableHead className="text-right">Porcentaje</TableHead>
                                        <TableHead className="text-right">Precio</TableHead>
                                        {/* <TableHead className="text-right">Iva</TableHead> */}
                                        <TableHead className="text-right">Importe</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {servicios.map((servicio, index) => (
                                        <TableRow key={index} className="hover:bg-muted/50">
                                            {/*  <TableCell className="font-medium">{servicio.codigo}</TableCell> */}
                                            <TableCell>{servicio.descripcion}</TableCell>
                                            {/*  <TableCell className="text-right">{servicio.fecha}</TableCell> */}
                                            {/* <TableCell className="text-right">{servicio.unidades}</TableCell> */}
                                            <TableCell className="text-right">{servicio.base.toFixed(2)} €</TableCell>
                                            <TableCell className="text-right">{servicio.porcentaje} %</TableCell>
                                            <TableCell className="text-right">{servicio.precio.toFixed(2)} €</TableCell>
                                            <TableCell className="text-right font-medium">{servicio.importe.toFixed(2)} €</TableCell>
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