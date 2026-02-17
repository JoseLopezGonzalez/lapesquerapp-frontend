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
import { parseDecimalValue, calculateImporte, calculateImporteFromLinea } from '@/exportHelpers/common'
import { formatDecimalCurrency, formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers'
import { normalizeText } from '@/helpers/formats/texts'
import { notify } from '@/lib/notifications'
import { linkAllPurchases, validatePurchases, groupLinkedSummaryBySupplier } from "@/services/export/linkService"
import { Loader2 } from "lucide-react"

const ExportModal = ({ document }) => {
    const { details: { fecha, tipoSubasta }, tables } = document
    const [software, setSoftware] = useState("A3ERP")
    const [selectedLinks, setSelectedLinks] = useState([])
    const [isValidating, setIsValidating] = useState(false)
    const [validationResults, setValidationResults] = useState({})

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

    const importeTotalCalculado = tables.subastas.reduce((acc, linea) => {
        return acc + calculateImporte(linea.pesoNeto, linea.precio);
    }, 0);

    const servicios = serviciosAsocArmadoresPuntaDelMoral.map((servicio) => {
        return {
            ...servicio,
            unidades: 1,
            base: importeTotalCalculado,
            precio: (importeTotalCalculado * servicio.porcentaje) / 100,
            importe: (importeTotalCalculado * servicio.porcentaje) / 100,
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
        // Extraer año de la fecha (últimos 2 dígitos)
        // Intentar extraer año directamente de la cadena (formato YYYY-MM-DD o YYYY/MM/DD)
        let año = null;
        const añoMatch = String(fecha).match(/(\d{4})/);
        if (añoMatch) {
            año = añoMatch[1].slice(-2);
        } else {
            // Fallback: usar Date object
            const fechaObj = new Date(fecha);
            año = fechaObj.getFullYear().toString().slice(-2);
        }
        const CABSERIE = `AS${año}`;
        // Convertir fecha a formato solo números: eliminar todos los caracteres no numéricos (ej: "2024-12-17" -> "20241217")
        const fechaSoloNumeros = String(fecha).replace(/[^0-9]/g, '');
        let albaranSequence = 1; // Contador secuencial para distinguir diferentes albaranes del mismo documento

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

                const cabNumDoc = `${fechaSoloNumeros}${albaranSequence}`;

                lines.forEach(l => {
                    l.lineas.forEach(linea => {
                        processedRows.push({
                            CABSERIE: CABSERIE,
                            CABNUMDOC: cabNumDoc,
                            CABFECHA: fecha,
                            CABCODPRO: asocArmadoresPuntaDelMoral.codA3erp,
                            CABREFERENCIA: `ASOC - ${fecha} - ${barcoData.nombre}`,
                            LINCODART: productos.find(p => p.nombre === linea.especie).codA3erp,
                            LINDESCLIN: linea.especie,
                            LINUNIDADES: parseDecimalValue(linea.pesoNeto),
                            LINPRCMONEDA: parseDecimalValue(linea.precio),
                            LINTIPIVA: 'RED10',
                        });
                    });
                });

                albaranSequence++;
            }
        } else if (isSubasta) {
            const cabNumDoc = `${fechaSoloNumeros}${albaranSequence}`;

            document.tables.subastas.forEach(linea => {
                processedRows.push({
                    CABSERIE: CABSERIE,
                    CABNUMDOC: cabNumDoc,
                    CABFECHA: fecha,
                    CABCODPRO: asocArmadoresPuntaDelMoralSubasta.codA3erp,
                    CABREFERENCIA: `ASOC - ${fecha} - SUBASTA`,
                    LINCODART: productos.find(p => p.nombre === linea.especie).codA3erp,
                    LINDESCLIN: linea.especie,
                    LINUNIDADES: parseDecimalValue(linea.pesoNeto),
                    LINPRCMONEDA: parseDecimalValue(linea.precio),
                    LINTIPIVA: 'RED10',
                });
            });

            albaranSequence++;
        }

        const cabNumDocServicios = `${fechaSoloNumeros}${albaranSequence}`;
        servicios.forEach(line => {
            processedRows.push({
                CABSERIE: CABSERIE,
                CABNUMDOC: cabNumDocServicios,
                CABFECHA: fecha,
                CABCODPRO: isVentaDirecta ? asocArmadoresPuntaDelMoral.codA3erp : asocArmadoresPuntaDelMoralSubasta.codA3erp,
                CABREFERENCIA: isVentaDirecta ? `ASOC - ${fecha} - SERVICIOS` : `ASOC - ${fecha} - SERVICIOS SUBASTA`,
                LINCODART: 9999,
                LINDESCLIN: line.descripcion,
                LINUNIDADES: parseDecimalValue(line.unidades),
                LINPRCMONEDA: line.precio,
                LINTIPIVA: 'RED10',
            });
        });

        albaranSequence++;

        if (isSubasta) {
            const cabNumDocCajas = `${fechaSoloNumeros}${albaranSequence}`;
            processedRows.push({
                CABSERIE: CABSERIE,
                CABNUMDOC: cabNumDocCajas,
                CABFECHA: fecha,
                CABCODPRO: asocArmadoresPuntaDelMoralSubasta.codA3erp,
                CABREFERENCIA: `ASOC - ${fecha} - SERVICIOS CAJAS SUBASTA`,
                LINCODART: 1015,
                LINDESCLIN: 'Préstamo cajas',
                LINUNIDADES: cajasTotales,
                LINPRCMONEDA: 5.50,
                LINTIPIVA: 'RED10',
            });

            albaranSequence++;
        }

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
        const declaredTotalNetWeight = barco.lineas.reduce((acc, linea) => acc + parseDecimalValue(linea.pesoNeto), 0);
        const declaredTotalAmount = barco.lineas.reduce((acc, linea) => acc + calculateImporte(linea.pesoNeto, linea.precio), 0);

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

    // Group linkedSummary by supplier and initialize selections
    const groupedLinkedSummary = groupLinkedSummaryBySupplier(linkedSummary);

    // Inicializar las selecciones cuando cambia linkedSummary y validar
    useEffect(() => {
        // Seleccionar por defecto solo las que no tienen error
        const initialSelection = groupedLinkedSummary
            .map((linea, index) => (!linea.error ? index : null))
            .filter(index => index !== null);
        setSelectedLinks(initialSelection);

        // Validar recepciones cuando cambia linkedSummary
        const validItems = groupedLinkedSummary.filter(item => !item.error);
        if (validItems.length > 0) {
            setIsValidating(true);
            validatePurchases(groupedLinkedSummary)
                .then((validation) => {
                    const validationMap = {};
                    validation.validationResults.forEach((result) => {
                        const key = `${result.supplierId}_${result.date}`;
                        validationMap[key] = result;
                    });
                    setValidationResults(validationMap);
                })
                .catch((error) => {
                    console.error('Error al validar:', error);
                })
                .finally(() => {
                    setIsValidating(false);
                });
        }
    }, [groupedLinkedSummary.length]);

    // Get validation status for a linea
    const getValidationStatus = (linea) => {
        const key = `${linea.supplierId}_${linea.date.split('/').reverse().join('-')}`;
        return validationResults[key] || null;
    };

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

    // Función para seleccionar/deseleccionar todas las líneas válidas y que pueden actualizarse
    const handleToggleAll = () => {
        const validIndices = linkedSummary
            .map((linea, index) => {
                if (linea.error) return null;
                const validation = getValidationStatus(linea);
                return (validation?.valid && validation?.canUpdate) ? index : null;
            })
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
        // Filtrar solo las compras seleccionadas (usar groupedLinkedSummary)
        const comprasSeleccionadas = groupedLinkedSummary.filter((linea, index) => 
            selectedLinks.includes(index) && !linea.error
        );

        if (comprasSeleccionadas.length === 0) {
            notify.error({
              title: 'Sin compras seleccionadas',
              description: 'Seleccione al menos una compra para vincular.',
            });
            return;
        }

        try {
            // Use bulk endpoint for better performance
            const result = await linkAllPurchases(comprasSeleccionadas);

            if (result.correctas > 0) {
                notify.success({
                  title: 'Compras enlazadas',
                  description: `Se enlazaron ${result.correctas} compras correctamente.`,
                });
            }

            if (result.errores > 0) {
                // Show detailed errors for first few failures
                const erroresAMostrar = result.erroresDetalles.slice(0, 3);
                erroresAMostrar.forEach((errorDetail) => {
                    const barcoInfo = errorDetail.barcoNombre ? `${errorDetail.barcoNombre}: ` : '';
                    notify.error({
                      title: 'Error al enlazar compra',
                      description: `${barcoInfo}${errorDetail.error}`,
                    }, { duration: 6000 });
                });
                
                if (result.errores > 3) {
                    notify.error({
                      title: 'Varios errores al enlazar',
                      description: `${result.errores - 3} error(es) adicional(es). Revisa la consola para más detalles.`,
                    });
                }
            }
        } catch (error) {
            console.error('Error al enlazar compras:', error);
            notify.error({
              title: 'Error al enlazar compras',
              description: error.message,
            });
        }
    };

    const handleOnClickExport = () => {
        // Ya no necesitamos initialAlbaranNumber, se usa la fecha como identificador base

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
                                {isValidating && (
                                    <div className="flex items-center justify-center py-4">
                                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                        <span className="text-sm text-muted-foreground">Validando recepciones...</span>
                                    </div>
                                )}
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12">
                                                <Checkbox 
                                                    checked={
                                                        linkedSummary.filter((l, idx) => {
                                                            if (l.error) return false;
                                                            const validation = getValidationStatus(l);
                                                            return validation?.valid && validation?.canUpdate;
                                                        }).length > 0 &&
                                                        selectedLinks.length === linkedSummary.filter((l, idx) => {
                                                            if (l.error) return false;
                                                            const validation = getValidationStatus(l);
                                                            return validation?.valid && validation?.canUpdate;
                                                        }).length
                                                    }
                                                    onCheckedChange={handleToggleAll}
                                                    disabled={isValidating}
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
                                        {linkedSummary.map((linea, index) => {
                                            const validation = getValidationStatus(linea);
                                            const isDisabled = linea.error || (validation && !validation.valid);
                                            
                                            return (
                                                <TableRow key={index} className="hover:bg-muted/50">
                                                    <TableCell>
                                                        <Checkbox 
                                                            checked={selectedLinks.includes(index)}
                                                            disabled={isDisabled || isValidating}
                                                            onCheckedChange={() => handleToggleLink(index)}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="font-medium">{linea.barcoNombre}</TableCell>
                                                    <TableCell className="font-medium">{linea.date}</TableCell>
                                                    <TableCell className="text-right">{formatDecimalWeight(linea.declaredTotalNetWeight)}</TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        {formatDecimalCurrency(linea.declaredTotalAmount)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {linea.error ? (
                                                            <div className="flex items-center gap-2 text-red-500">
                                                                <X className="h-4 w-4" />
                                                                <span className="text-xs">No enlazable</span>
                                                            </div>
                                                        ) : isValidating ? (
                                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                                <span className="text-xs">Validando...</span>
                                                            </div>
                                                        ) : validation ? (
                                                            validation.valid && validation.canUpdate ? (
                                                                <div className="flex items-center gap-2 text-green-500">
                                                                    <Check className="h-4 w-4" />
                                                                    <span className="text-xs">
                                                                        {validation.hasChanges ? 'Listo para actualizar' : 'Sin cambios'}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-start gap-2 text-red-500">
                                                                    <X className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                                    <div className="flex flex-col gap-0.5">
                                                                        <span className="text-xs font-medium">No se puede enlazar</span>
                                                                        {validation.message && (
                                                                            <span 
                                                                                className="text-xs text-red-400 cursor-help" 
                                                                                title={validation.tooltip || validation.message}
                                                                            >
                                                                                {validation.message}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )
                                                        ) : (
                                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                                <span className="text-xs">Pendiente</span>
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </CardContent>
                            <div className="flex justify-between items-center p-2 mb-2">
                                <span className="text-sm text-muted-foreground">
                                    {selectedLinks.length} de {linkedSummary.filter((l, idx) => {
                                        if (l.error) return false;
                                        const validation = getValidationStatus(l);
                                        return validation?.valid && validation?.canUpdate;
                                    }).length} seleccionadas
                                </span>
                                <Button 
                                    variant="" 
                                    className="" 
                                    onClick={() => handleOnClickLinkPurchases()}
                                    disabled={selectedLinks.length === 0 || isValidating}
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