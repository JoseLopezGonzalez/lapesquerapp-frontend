import { fetchWithTenant } from "@lib/fetchWithTenant";
import React, { useState, useEffect } from 'react'
import { Check, X, FileSpreadsheet, Link } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { asocArmadoresPuntaDelMoral, asocArmadoresPuntaDelMoralSubasta, barcos, productos, servicioExtraAsocArmadoresPuntaDelMoral, serviciosAsocArmadoresPuntaDelMoral } from '../exportData'
import { Input } from '@/components/ui/input'
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { formatDecimalCurrency, formatDecimalWeight, parseEuropeanNumber } from '@/helpers/formats/numbers/formatNumbers'
import { normalizeText } from '@/helpers/formats/texts'
import { getToastTheme } from '@/customs/reactHotToast'
import toast from 'react-hot-toast'
import { API_URL_V1 } from '@/configs/config'

const ExportModal = ({ document }) => {
    const { details: { lonja, cifComprador, comprador, fecha, tipoSubasta, importeTotal }, tables } = document
    const [software, setSoftware] = useState("A3ERP")
    const [initialAlbaranNumber, setInitialAlbaranNumber] = useState("")
    const [selectedLinks, setSelectedLinks] = useState([])

    const isVentaDirecta = tipoSubasta == 'M1 M1'
    const isSubasta = tipoSubasta == 'T2 Arrastre'

    const cajasTotales = tables.subastas.reduce((acc, item) => {
        return acc + Number(item.cajas)
    }, 0);

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
        return barcos.some((barco) => normalizeText(barco.matricula) === normalizeText(matricula));
    };

    const servicios = serviciosAsocArmadoresPuntaDelMoral.map((servicio) => {
        return {
            ...servicio,
            unidades: 1,
            base: parseEuropeanNumber(importeTotal),
            precio: (parseEuropeanNumber(importeTotal) * servicio.porcentaje) / 100,
            importe: (parseEuropeanNumber(importeTotal) * servicio.porcentaje) / 100,
        }
    })
    const servicioExtra = {
        ...servicioExtraAsocArmadoresPuntaDelMoral,
        unidades: 1,
        base: (servicios.find((servicio) => servicio.descripcion === 'Tarifa G-4').importe),
        precio: (servicios.find((servicio) => servicio.descripcion === 'Tarifa G-4').importe) * servicioExtraAsocArmadoresPuntaDelMoral.porcentaje / 100,
        importe: (servicios.find((servicio) => servicio.descripcion === 'Tarifa G-4').importe) * servicioExtraAsocArmadoresPuntaDelMoral.porcentaje / 100,
    }
    servicios.splice(1, 0, servicioExtra)


    const generateExcelForA3erp = () => {
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
                const barcoData = barcos.find(a => normalizeText(a.matricula) === normalizeText(matricula));
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

            albaranNumber++;
        }

        servicios.forEach(line => {
            processedRows.push({
                CABNUMDOC: albaranNumber,
                CABFECHA: fecha,
                CABCODPRO: isVentaDirecta ? asocArmadoresPuntaDelMoral.codA3erp : asocArmadoresPuntaDelMoralSubasta.codA3erp,
                CABREFERENCIA: isVentaDirecta ? `${fecha} - SERVICIOS` : `${fecha} - SERVICIOS SUBASTA`,
                LINCODART: 9999,
                LINDESCLIN: line.descripcion,
                LINUNIDADES: line.unidades,
                LINPRCMONEDA: line.precio,
                LINTIPIVA: 'RED10',
            });
        });

        albaranNumber++;

        isSubasta && processedRows.push({
            CABNUMDOC: albaranNumber,
            CABFECHA: fecha,
            CABCODPRO: asocArmadoresPuntaDelMoralSubasta.codA3erp,
            CABREFERENCIA: `${fecha} - SERVICIOS CAJAS SUBASTA`,
            LINCODART: 1015,
            LINDESCLIN: 'Préstamo cajas',
            LINUNIDADES: cajasTotales,
            LINPRCMONEDA: 5.50,
            LINTIPIVA: 'RED10',
        });

        albaranNumber++;

        // Crear el libro y hoja
        const worksheet = XLSX.utils.json_to_sheet(processedRows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'ALBARANESCOMPRA');

        // Guardar archivo
        const excelBuffer = XLSX.write(workbook, { bookType: 'xls', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.ms-excel' });
        if (isSubasta) {
            blob.name = `ALBARANES_SUBASTA_A3ERP_ASOC_ARMADORES_PUNTA_MORAL_${fecha}.xls`;
        } else {
            blob.name = `ALBARANES_A3ERP_ASOC_ARMADORES_PUNTA_MORAL_${fecha}.xls`;
        }
        saveAs(blob, blob.name);
    };

    const linkedSummary = subastas.map((barco) => {
        const declaredTotalNetWeight = barco.lineas.reduce((acc, linea) => acc + parseEuropeanNumber(linea.pesoNeto), 0);
        const declaredTotalAmount = barco.lineas.reduce((acc, linea) => acc + parseEuropeanNumber(linea.importe), 0);

        const codBrisappBarco = barcos.find((barcoData) => normalizeText(barcoData.matricula) === normalizeText(barco.matricula))?.codBrisapp ?? null;

        return {
            supplierId: codBrisappBarco,
            date: fecha,
            declaredTotalNetWeight: parseFloat(declaredTotalNetWeight.toFixed(2)),
            declaredTotalAmount: parseFloat(declaredTotalAmount.toFixed(2)),
            barcoNombre: barco.nombre,
            error: codBrisappBarco === null ? true : false,
        };
    });

    // Inicializar las selecciones cuando cambia linkedSummary
    useEffect(() => {
        // Seleccionar por defecto solo las que no tienen error
        const initialSelection = linkedSummary
            .map((linea, index) => (!linea.error ? index : null))
            .filter(index => index !== null);
        setSelectedLinks(initialSelection);
    }, [linkedSummary.length]);

    // Función para manejar selección/deselección de una línea
    const handleToggleLink = (index) => {
        setSelectedLinks(prev => {
            if (prev.includes(index)) {
                return prev.filter(i => i !== index);
            } else {
                return [...prev, index];
            }
        });
    };

    // Función para seleccionar/deseleccionar todas las líneas sin error
    const handleToggleAll = () => {
        const validIndices = linkedSummary
            .map((linea, index) => (!linea.error ? index : null))
            .filter(index => index !== null);
        
        if (selectedLinks.length === validIndices.length) {
            // Si todas están seleccionadas, deseleccionar todas
            setSelectedLinks([]);
        } else {
            // Si no todas están seleccionadas, seleccionar todas las válidas
            setSelectedLinks(validIndices);
        }
    };

    const handleOnClickLinkPurchases = async () => {
        // Filtrar solo las compras seleccionadas
        const comprasSeleccionadas = linkedSummary.filter((linea, index) => 
            selectedLinks.includes(index) && !linea.error
        );

        if (comprasSeleccionadas.length === 0) {
            toast.error('No hay compras seleccionadas para vincular.', getToastTheme());
            return;
        }

        let correctas = 0;
        let errores = 0;

        await Promise.allSettled(comprasSeleccionadas.map(async (linea) => {
            try {
                const res = await fetchWithTenant(`${API_URL_V1}raw-material-receptions/update-declared-data`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        supplier_id: linea.supplierId,
                        date: linea.date.split('/').reverse().join('-'), // convertir de dd/mm/yyyy a yyyy-mm-dd
                        declared_total_net_weight: linea.declaredTotalNetWeight,
                        declared_total_amount: linea.declaredTotalAmount,
                    }),
                });

                if (!res.ok) throw new Error();
                correctas++;
            } catch (error) {
                errores++;
                console.error(`Error al actualizar compra de ${linea.barcoNombre}`, error);
                toast.error(`Error al actualizar compra de ${linea.barcoNombre}`, getToastTheme());
            }
        }));

        if (correctas > 0) {
            toast.success(`Compras enlazadas correctamente (${correctas})`, getToastTheme());
        }

        if (errores > 0) {
            toast.error(`${errores} compras fallaron al enlazar`, getToastTheme());
        }
    };

    const handleOnClickExport = () => {
        if (initialAlbaranNumber === "") {
            toast.error('Introduzca un número de albarán inicial', getToastTheme());
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


                </div>

                <div className="space-y-4 mt-2">

                    {linkedSummary.length > 0 && (
                        <Card>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <CardTitle>
                                        <div className='flex flex-col gap-1'>
                                            <span className="text-lg">Enlaces de compra/recepción</span>
                                            <span className="text-sm text-muted-foreground">
                                                {linkedSummary.length} Compras
                                            </span>
                                        </div>
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12">
                                                <Checkbox 
                                                    checked={
                                                        linkedSummary.filter(l => !l.error).length > 0 &&
                                                        selectedLinks.length === linkedSummary.filter(l => !l.error).length
                                                    }
                                                    onCheckedChange={handleToggleAll}
                                                />
                                            </TableHead>
                                            <TableHead>Barco</TableHead>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead className="text-right">Peso Neto</TableHead>
                                            <TableHead className="text-right">Importe</TableHead>
                                            <TableHead>Estado</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {linkedSummary.map((linea, index) => (
                                            <TableRow key={index} className="hover:bg-muted/50">
                                                <TableCell>
                                                    <Checkbox 
                                                        checked={selectedLinks.includes(index)}
                                                        disabled={linea.error}
                                                        onCheckedChange={() => handleToggleLink(index)}
                                                    />
                                                </TableCell>
                                                <TableCell className="font-medium">{linea.barcoNombre}</TableCell>
                                                <TableCell className="font-medium">{linea.date}</TableCell>
                                                <TableCell className="text-right">{formatDecimalWeight(linea.declaredTotalNetWeight)}</TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatDecimalCurrency(linea.declaredTotalAmount)}
                                                </TableCell>
                                                <TableCell className={` ${linea.error ? 'text-red-500' : 'text-green-500'}`}>
                                                    {linea.error ? (
                                                        <div className="flex items-center gap-2">
                                                            <X className="h-4 w-4" />
                                                            <span className="text-xs">No enlazable</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <Check className="h-4 w-4" />
                                                            <span className="text-xs">Listo</span>
                                                        </div>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                            <div className="flex justify-between items-center p-2 mb-2">
                                <span className="text-sm text-muted-foreground">
                                    {selectedLinks.length} de {linkedSummary.filter(l => !l.error).length} seleccionadas
                                </span>
                                <Button 
                                    variant="" 
                                    className="" 
                                    onClick={() => handleOnClickLinkPurchases()}
                                    disabled={selectedLinks.length === 0}
                                >
                                    <Link className="h-4 w-4" />
                                    Enlazar Compras ({selectedLinks.length})
                                </Button>
                            </div>

                        </Card>
                    )}

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
                                </div>
                            </div>
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
                </div>
            </div>

            <DialogFooter>
                <DialogTrigger asChild>
                    <Button variant="outline">
                        Cancelar
                    </Button>
                </DialogTrigger>
                <Button className="gap-2" onClick={handleOnClickExport}>
                    <FileSpreadsheet className="h-4 w-4" />
                    Exportar a A3ERP
                </Button>
            </DialogFooter>
        </DialogContent>
    )
}

export default ExportModal