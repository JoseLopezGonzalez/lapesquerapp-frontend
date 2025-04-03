import React, { useState } from 'react'
import { Check, X, AlertTriangle, FileSpreadsheet, CircleX } from "lucide-react"
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
import { barcos, barcosVentaDirecta, datosVendidurias, lonjaDeIsla, PORCENTAJE_SERVICIOS_VENDIDURIAS, productos, servicioExtraLonjaDeIsla, serviciosLonjaDeIsla } from '../exportData'
import { Input } from '@/components/ui/input'
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { formatDecimalCurrency, parseEuropeanNumber } from '@/helpers/formats/numbers/formatNumbers'
import toast from 'react-hot-toast'
import { darkToastTheme } from '@/customs/reactHotToast'

/* formatear numero 1.000.00 donde el primer punto por la derecha es el decimal */
const formatLonjaIslaImporte = (importe) => {
    console.log('importe', importe)
    const importeString = String(importe);
    const partes = importeString.split('.');

    console.log('partes', partes)

    if (partes.length <= 2) {
        // Solo hay un punto (o ninguno), no hay miles que quitar
        return importeString;
    }

    // El último punto es el decimal, los anteriores son de miles
    const parteDecimal = partes.pop(); // último elemento
    const parteEntera = partes.join(''); // unimos las partes sin puntos de miles
    console.log('parteEntera', parteEntera)
    console.log('parteDecimal', parteDecimal)
    return `${parteEntera}.${parteDecimal}`;
};


const normalizaNombre = (nombre) => {
    return nombre
        ?.normalize('NFD') // quitar tildes
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[.,]/g, '') // quitar puntos y comas
        .toLowerCase()
        .trim();
};

const ExportModal = ({ document }) => {
    const [software, setSoftware] = useState("A3ERP")
    const [initialAlbaranNumber, setInitialAlbaranNumber] = useState("")

    const errors = []

    const { details, tables } = document
    const { fecha } = details
    const { ventas, peces, vendidurias, cajas, tipoVentas } = tables


    const isConvertibleBarco = (cod) => {
        return barcos.some((barco) => barco.cod === cod);
    };

    /* const ventasDirectas = Object.values(ventas.reduce((acc, venta) => {
        let barcoEncontrado = barcos.find((barco) => barco.cod === venta.codBarco || barco.barco === venta.barco);

        if (!barcoEncontrado) {
            return acc;
        }
        let nombreBarco = barcoEncontrado.barco;
        let codBarco = `${barcoEncontrado.cod}`;

        if (!isVentaDirecta(codBarco)) {
            return acc;
        }

        if (!acc[codBarco]) {
            acc[codBarco] = {
                cod: venta.codBarco,
                nombre: nombreBarco,
                armador: getArmador(codBarco),
                lineas: [],
            };
        }
        acc[codBarco].lineas.push(venta);
        return acc;
    }, {})); */

    /* const ventasVendidurias = Object.values(ventas.reduce((acc, venta) => {


        const barcoEncontrado = barcos.find((barco) => {
            if (barco.cod !== venta.codBarco && barco.barco === venta.barco) {
                setErrors((prevErrors) => [...prevErrors, `Barco encontrado por nombre: ${venta.barco}`]);
            }
            return barco.cod === venta.codBarco || barco.barco === venta.barco
        });

        if (!barcoEncontrado) {
            setErrors((prevErrors) => [...prevErrors, `Barco no encontrado: ${venta.codBarco}`]);
            return acc;
        }

        let nombreBarco = barcoEncontrado.barco;
        let codBarco = `${barcoEncontrado.cod}`;

        if (isVentaDirecta(codBarco)) {
            return acc;
        }


        if (!acc[codBarco]) {
            acc[codBarco] = {
                cod: venta.codBarco,
                nombre: nombreBarco,
                vendiduria: isConvertibleBarco(venta.codBarco) ? getVendiduria(venta.codBarco) : null,
                lineas: [],
            };
        }
        acc[codBarco].lineas.push(venta);
        return acc;
    }, {})); */

    const addError = (error) => {
        if (!errors.includes(error)) {
            errors.push(error);
        }
    };

    const ventasVendidurias = []
    const ventasDirectas = []

    ventas.map((venta, index) => {

        /* Ojo lógica si falla codigo busca por nombre */

        const barcoEncontrado = barcos.find((barco) => {
            if (barco.cod !== venta.codBarco && barco.barco === venta.barco) {
                addError(`Barco encontrado por nombre: ${venta.codBarco} - ${venta.barco}`)
            }
            return barco.cod === venta.codBarco || barco.barco === venta.barco
        });

        if (!barcoEncontrado) {
            addError(`Barco no encontrado: ${venta.codBarco} - ${venta.barco}`)
            return ;
        }

        const nombreBarco = barcoEncontrado.barco;
        const codBarco = `${barcoEncontrado.cod}`;

        const barcoVentaDirectaEntontrado = barcosVentaDirecta.find((barco) => barco.cod === codBarco);

        if (!barcoVentaDirectaEntontrado) {
            const vendiduria = datosVendidurias.find((vendiduria) => vendiduria.cod === barcoEncontrado.codVendiduria);

            if (!vendiduria) {
                addError(`Vendiduria no encontrada para el barco: ${codBarco} - ${nombreBarco}`)
                return ;
            }

            if (!ventasVendidurias[codBarco]) {
                ventasVendidurias[codBarco] = {
                    cod: codBarco,
                    nombre: nombreBarco,
                    vendiduria: vendiduria,
                    lineas: [],
                };
            }
            ventasVendidurias[codBarco].lineas.push(venta);

        } else if (barcoVentaDirectaEntontrado) {
            const armador = barcoVentaDirectaEntontrado.armador;
            if (!ventasDirectas[codBarco]) {
                ventasDirectas[codBarco] = {
                    cod: codBarco,
                    nombre: nombreBarco,
                    armador: armador,
                    lineas: [],
                };
            }
            ventasDirectas[codBarco].lineas.push(venta);
        }
    });


    const getImporteServiciosVendiduria = (lineas) => {
        const importeTotal = lineas.reduce((acc, linea) => {
            return acc + Number(formatLonjaIslaImporte(linea.importe));
        }, 0);
        return (importeTotal * PORCENTAJE_SERVICIOS_VENDIDURIAS / 100).toFixed(2);
    }



    const importeTotalVentasDirectas = ventasDirectas.reduce((acc, barco) => {
        return acc + barco.lineas.reduce((acc, linea) => {
            return acc + Number(formatLonjaIslaImporte(linea.importe));
        }, 0);
    }, 0);

    /* importes totales por cada tipo de vendiduria segun ventasVendiduriasGroupByBarco */
    const importesTotalesVendidurias = ventasVendidurias.reduce((acc, barco) => {
        if (!barco.vendiduria) {
            return acc;
        }
        const vendiduria = barco.vendiduria?.cod;
        const totalBarco = barco.lineas.reduce((acc, linea) => {
            return acc + Number(formatLonjaIslaImporte(linea.importe));
        }, 0);
        if (!acc[vendiduria]) {
            acc[vendiduria] = {
                vendiduria: vendiduria,
                importe: 0,
            };
        }
        acc[vendiduria].importe += totalBarco;
        return acc;
    }, {});
    /* convertir el objeto a array */
    const importesTotalesVendiduriasArray = Object.values(importesTotalesVendidurias);

    console.log('importesTotalesVendiduriasArray', importesTotalesVendiduriasArray)

    const compararImportesPorVendiduria = () => {
        const totalesCalculados = {};
        const totalesDocumento = {};

        // Agrupar importes por vendiduria desde tu app
        importesTotalesVendiduriasArray.forEach(({ vendiduria, importe }) => {
            if (!vendiduria) return;
            const clave = vendiduria;
            totalesCalculados[clave] = (totalesCalculados[clave] || 0) + importe;
        });

        // Agrupar importes por vendiduria desde lonja
        vendidurias.forEach(({ cod, vendiduria, importe }) => {
            const clave = cod;
            const valor = parseEuropeanNumber(importe);
            totalesDocumento[clave] = (totalesDocumento[clave] || 0) + valor;
        });

        // Comparar
        const comparacion = [];

        const todasLasVendidurias = new Set([
            ...Object.keys(totalesCalculados),
            ...Object.keys(totalesDocumento),
        ]);

        todasLasVendidurias.forEach((vendiduria) => {
            const importeCalculado = totalesCalculados[vendiduria] || 0;
            const importeDocumento = totalesDocumento[vendiduria] || 0;
            const diferencia = +(importeCalculado - importeDocumento).toFixed(2);

            const vendiduriaEncontrada = datosVendidurias.find((vendiduriaObj) => vendiduriaObj.cod === vendiduria);

            comparacion.push({
                vendiduria: vendiduriaEncontrada ? vendiduriaEncontrada.nombre : 'Desconocido',
                importeCalculado,
                importeDocumento,
                diferencia,
                cuadran: diferencia === 0,
            });
        });

        return comparacion;
    };

    console.log('compararImportesPorVendiduria', compararImportesPorVendiduria())

    /* comprobar vendidurias desde importesTotaltesVendidurias y vendidurias */


    /* calcular buscando si hay diferencias */
    const isSomeVendiduriaNotConvertible = compararImportesPorVendiduria().some((linea) => {
        return !linea.cuadran;
    });


    const servicios = serviciosLonjaDeIsla.map((servicio) => {
        return {
            ...servicio,
            unidades: 1,
            base: importeTotalVentasDirectas,
            precio: (importeTotalVentasDirectas * servicio.porcentaje) / 100,
            importe: (importeTotalVentasDirectas * servicio.porcentaje) / 100,
        }
    })

    const getImporteTotal = (lineasBarco) => {
        const importeTotal = lineasBarco.reduce((acc, linea) => {
            return acc + Number(formatLonjaIslaImporte(linea.importe));
        }, 0);
        return importeTotal;
    }

    /* Añadir en segunda posicion servvicio extra a servicios */
    const servicioExtra = {
        ...servicioExtraLonjaDeIsla,
        unidades: 1,
        base: (servicios.find((servicio) => servicio.descripcion === 'REPERCUSION TARIFA G-4 COMP.').importe),
        precio: (servicios.find((servicio) => servicio.descripcion === 'REPERCUSION TARIFA G-4 COMP.').importe) * servicioExtraLonjaDeIsla.porcentaje / 100,
        importe: (servicios.find((servicio) => servicio.descripcion === 'REPERCUSION TARIFA G-4 COMP.').importe) * servicioExtraLonjaDeIsla.porcentaje / 100,
    }
    servicios.splice(1, 0, servicioExtra)

    const handleOnClickExport = () => {
        if (initialAlbaranNumber === "") {
            toast.error('Introduzca un número de albarán inicial', darkToastTheme);
            return;
        }

        if (software === "A3ERP") {
            generateExcelForA3erp();
        } else if (software === "Facilcom") {
            // generateExcelForFacilcom();
        } else {
            // generateExcelForOtros();
        }
    };


    const generateExcelForA3erp = () => {
        const processedRows = [];
        let albaranNumber = Number(initialAlbaranNumber);

        ventasDirectas.forEach(barco => {
            barco.lineas.forEach(linea => {
                processedRows.push({
                    CABNUMDOC: albaranNumber,
                    CABFECHA: fecha,
                    CABCODPRO: barco.armador.codA3erp,
                    CABREFERENCIA: `${fecha} - ${barco.nombre}`,
                    LINCODART: productos.find(p => p.nombre == linea.especie)?.codA3erp,
                    LINDESCLIN: linea.especie,
                    LINUNIDADES: Number(linea.kilos),
                    LINPRCMONEDA: Number(linea.precio),
                    LINTIPIVA: 'RED10',
                });
            });
            albaranNumber++;
        });

        ventasVendidurias.forEach(barco => {
            isConvertibleBarco(barco.cod) && barco.lineas.forEach(linea => {
                processedRows.push({
                    CABNUMDOC: albaranNumber,
                    CABFECHA: fecha,
                    CABCODPRO: barco.vendiduria.codA3erp,
                    CABREFERENCIA: `${fecha} - ${barco.nombre}`,
                    LINCODART: productos.find(p => p.nombre == linea.especie).codA3erp,
                    LINDESCLIN: linea.especie,
                    LINUNIDADES: Number(linea.kilos),
                    LINPRCMONEDA: Number(linea.precio),
                    LINTIPIVA: 'RED10',
                });
            });

            const importeTotal = getImporteTotal(barco.lineas);

            processedRows.push({
                CABNUMDOC: albaranNumber,
                CABFECHA: fecha,
                CABCODPRO: lonjaDeIsla.codA3erp,
                CABREFERENCIA: `${fecha} - ${barco.nombre}`,
                LINCODART: 9999,
                LINDESCLIN: 'Gastos de Lonja y OP',
                LINUNIDADES: 1,
                LINPRCMONEDA: importeTotal * 3.5 / 100,
                LINTIPIVA: 'RED10',
            });
            albaranNumber++;

        });


        servicios.forEach(line => {
            processedRows.push({
                CABNUMDOC: albaranNumber,
                CABFECHA: fecha,
                CABCODPRO: lonjaDeIsla.codA3erp,
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
        saveAs(blob, `ALBARANES_A3ERP_LONJA_ISLA_${fecha}.xls`);
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
                    {errors.length > 0 && (
                        <ul className="list-disc list-inside text-red-500 flex flex-col gap-2">
                            {errors.map((error, index) => (
                                <li key={index} className="text-xs flex gap-1">
                                    <CircleX className="h-4 w-4 " />
                                    {error}
                                </li>
                            ))}
                        </ul>
                    )}


                    {/* {isSomeBarcoNotConvertible ? (
                        <div className="flex items-center gap-1 p-1  text-amber-500  rounded-md ">
                            <AlertTriangle className="h-4 w-4 " />
                            <span className="text-xs">
                                Todos los barcos no son exportables.
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 p-1  text-green-500  rounded-md">
                            <Check className="h-4 w-4" />
                            <span className="text-xs">
                                Todos los barcos son exportables.
                            </span>
                        </div>
                    )} */}
                    {/* {isSomeVendiduriaNotConvertible ? (
                        <div className="flex items-center gap-1 p-1  text-red-500  rounded-md ">
                            <CircleX className="h-4 w-4 " />
                            <span className="text-xs">
                                Incongruencia en los datos de vendidurias.
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 p-1  text-green-500  rounded-md">
                            <Check className="h-4 w-4" />
                            <span className="text-xs">
                                Importes de vendidurias comprobados.
                            </span>
                        </div>
                    )} */}
                </div>

                <div className="space-y-4 mt-2">

                    {/* table para vendidurias comparando con importesTotaltesVendidurias */}
                    {importesTotalesVendiduriasArray.length > 0 && (
                        <Card>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <CardTitle>
                                        <div className='flex flex-col gap-1'>
                                            <span className="text-lg">Comprobación Vendidurías</span>

                                        </div>
                                    </CardTitle>

                                </div>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Vendiduria</TableHead>
                                            <TableHead>Importe para exportar</TableHead>
                                            <TableHead>Importe Documento</TableHead>
                                            {/* diferencia */}
                                            <TableHead>Diferencia</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {compararImportesPorVendiduria().map((linea, index) => (
                                            <TableRow key={index} className="hover:bg-muted/50">
                                                <TableCell className="font-medium">{linea.vendiduria}</TableCell>
                                                <TableCell >{formatDecimalCurrency(linea.importeCalculado)}</TableCell>
                                                <TableCell >{formatDecimalCurrency(linea.importeDocumento)} </TableCell>
                                                <TableCell  >{formatDecimalCurrency(linea.diferencia)} </TableCell>
                                                <TableCell className={` ${linea.cuadran ? 'text-green-500' : 'text-red-500'}`}>
                                                    {linea.cuadran ? (
                                                        <Check className="h-4 w-4" />
                                                    ) : (
                                                        <X className="h-4 w-4" />
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}

                    {ventasDirectas.length > 0 && (
                        <Card>
                            <CardHeader className="pb-2">
                                <div className="pb-2">
                                    <CardTitle className="text-lg">Ventas Directas</CardTitle>

                                </div>
                            </CardHeader>
                            <CardContent className='flex flex-col gap-4'>

                                {ventasDirectas.map((barco, index) => (
                                    <Card key={`${barco.nombre}-${index}`}>
                                        <CardHeader className="pb-2">
                                            <div className="flex justify-between items-start">
                                                <CardTitle>
                                                    <div className='flex flex-col gap-1'>
                                                        <span className="text-lg">{barco.nombre}</span>
                                                        <span className="text-sm text-muted-foreground">
                                                            {barco.armador.nombre}
                                                        </span>
                                                    </div>
                                                </CardTitle>
                                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                    <Badge variant="outline" className=" text-blue-500  flex items-center gap-1">
                                                        Venta Directa
                                                    </Badge>
                                                    <Badge variant="outline" className="bg-green-900 text-green-200 border-green-500 flex items-center gap-1">
                                                        <Check className="h-3.5 w-3.5" />
                                                        Exportable
                                                    </Badge>
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
                                            <CardTitle className="text-lg">Servicios Lonja de Isla Cristina</CardTitle>
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
                                                <Badge variant="outline" className="bg-green-900 text-green-200 border-green-500 flex items-center gap-1">
                                                    <Check className="h-3.5 w-3.5" />
                                                    Exportable
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    {/* <TableHead>Cod</TableHead> */}
                                                    <TableHead>Descripción</TableHead>
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
                                                        <TableCell>{servicio.descripcion}</TableCell>
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

                            </CardContent>
                        </Card>
                    )}

                    {ventasVendidurias.length > 0 && (
                        <Card>
                            <CardHeader className="pb-2">
                                <div className="pb-2">
                                    <CardTitle className="text-lg">Ventas Vendidurias</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className='flex flex-col gap-4'>
                                {ventasVendidurias.map((barco, index) => (
                                    <Card key={`${barco.nombre}-${index}`}>
                                        <CardHeader className="pb-2">
                                            <div className="flex justify-between items-start">
                                                <CardTitle >
                                                    <div className='flex flex-col gap-1'>
                                                        <span className="text-lg">{barco.nombre}</span>
                                                        <span className="text-sm text-muted-foreground">
                                                            <span>{barco.vendiduria?.nombre} </span>
                                                        </span>
                                                    </div>
                                                </CardTitle>
                                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                    <Badge variant="outline" className=" text-yellow-500  flex items-center gap-1">
                                                        Vendiduría
                                                    </Badge>
                                                    {isConvertibleBarco(barco.cod) ? (
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
                                                            <TableCell className="text-right">{linea.kilos}</TableCell>
                                                            <TableCell className="text-right">{linea.precio} €</TableCell>
                                                            <TableCell className="text-right font-medium">
                                                                {linea.importe} €
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                    <TableRow>
                                                        <TableCell></TableCell>
                                                        <TableCell className="font-medium ">
                                                            Importe Servicios Vendiduria
                                                        </TableCell>
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
            </div>

            <DialogFooter>
                <DialogTrigger asChild>
                    <Button variant="outline">
                        Cancelar
                    </Button>
                </DialogTrigger>
                <Button className="gap-2" onClick={() => handleOnClickExport()}>
                    <FileSpreadsheet className="h-4 w-4" />
                    Exportar a A3ERP
                </Button>
            </DialogFooter>
        </DialogContent>
    )
}

export default ExportModal