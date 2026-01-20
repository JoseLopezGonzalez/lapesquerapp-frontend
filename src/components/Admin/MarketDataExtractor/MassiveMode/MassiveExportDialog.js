"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Loader2, AlertTriangle, FileText, CircleX, Check, X } from "lucide-react";
import toast from "react-hot-toast";
import { getToastTheme } from "@/customs/reactHotToast";
import { downloadMassiveExcel } from "@/services/export/excelGenerator";
import { generateCofraExcelRows } from "@/exportHelpers/cofraExportHelper";
import { generateLonjaDeIslaExcelRows } from "@/exportHelpers/lonjaDeIslaExportHelper";
import { generateAsocExcelRows } from "@/exportHelpers/asocExportHelper";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { parseEuropeanNumber } from "@/helpers/formats/numbers/formatNumbers";
import { normalizeText } from "@/helpers/formats/texts";
import { armadores, barcos, lonjas } from "../AlbaranCofraWeb/exportData";
import { barcos as barcosLonja, barcosVentaDirecta, datosVendidurias, productos, serviciosLonjaDeIsla, servicioExtraLonjaDeIsla, PORCENTAJE_SERVICIOS_VENDIDURIAS } from "../ListadoComprasLonjaDeIsla/exportData";
import { barcos as barcosAsoc, productos as productosAsoc, serviciosAsocArmadoresPuntaDelMoral, servicioExtraAsocArmadoresPuntaDelMoral, asocArmadoresPuntaDelMoral, asocArmadoresPuntaDelMoralSubasta } from "../ListadoComprasAsocPuntaDelMoral/exportData";

export default function MassiveExportDialog({ 
    open, 
    onOpenChange, 
    documents 
}) {
    const [software, setSoftware] = useState("A3ERP");
    const [isExporting, setIsExporting] = useState(false);
    const [errors, setErrors] = useState([]);
    const [documentsInfo, setDocumentsInfo] = useState([]);

    // Collect errors and document info when dialog opens
    useEffect(() => {
        if (!open || !documents || documents.length === 0) {
            setErrors([]);
            setDocumentsInfo([]);
            return;
        }

        const allErrors = [];
        const docsInfo = [];

        const EXPORT_HELPERS = {
            'albaranCofradiaPescadoresSantoCristoDelMar': generateCofraExcelRows,
            'listadoComprasLonjaDeIsla': generateLonjaDeIslaExcelRows,
            'listadoComprasAsocArmadoresPuntaDelMoral': generateAsocExcelRows,
        };

        documents.forEach((doc) => {
            if (!doc.processedData || doc.processedData.length === 0) {
                allErrors.push(`Documento "${doc.file?.name || 'Desconocido'}": No tiene datos procesados`);
                docsInfo.push({
                    name: doc.file?.name || 'Desconocido',
                    type: doc.documentType || 'No especificado',
                    status: 'error',
                    error: 'No tiene datos procesados'
                });
                return;
            }

            const helper = EXPORT_HELPERS[doc.documentType];
            if (!helper) {
                allErrors.push(`Documento "${doc.file?.name || 'Desconocido'}": Tipo de documento no soportado para exportación`);
                docsInfo.push({
                    name: doc.file?.name || 'Desconocido',
                    type: doc.documentType || 'No especificado',
                    status: 'error',
                    error: 'Tipo no soportado'
                });
                return;
            }

            try {
                // Try to generate rows to detect errors
                const result = helper(doc.processedData[0], { startSequence: 1 });
                
                if (!result || !result.rows || result.rows.length === 0) {
                    allErrors.push(`Documento "${doc.file?.name || 'Desconocido'}": No se generaron filas para exportar`);
                    docsInfo.push({
                        name: doc.file?.name || 'Desconocido',
                        type: doc.documentType || 'No especificado',
                        status: 'warning',
                        rows: 0
                    });
                } else {
                    docsInfo.push({
                        name: doc.file?.name || 'Desconocido',
                        type: doc.documentType || 'No especificado',
                        status: 'success',
                        rows: result.rows.length
                    });
                }
            } catch (error) {
                // Priorizar userMessage sobre message para mostrar errores en formato natural
                const errorMessage = error.userMessage || error.data?.userMessage || error.response?.data?.userMessage || error.message || 'Error al procesar';
                allErrors.push(`Documento "${doc.file?.name || 'Desconocido'}": ${errorMessage}`);
                docsInfo.push({
                    name: doc.file?.name || 'Desconocido',
                    type: doc.documentType || 'No especificado',
                    status: 'error',
                    error: errorMessage
                });
            }
        });

        setErrors(allErrors);
        setDocumentsInfo(docsInfo);
    }, [open, documents]);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const documentsToExport = documents
                .filter((doc) => doc.processedData && doc.processedData.length > 0)
                .map((doc) => ({
                    document: doc.processedData[0],
                    documentType: doc.documentType,
                }));

            if (documentsToExport.length === 0) {
                toast.error('No hay documentos válidos para exportar.', getToastTheme());
                setIsExporting(false);
                return;
            }

            downloadMassiveExcel(documentsToExport, { software });
            toast.success('Excel generado correctamente', getToastTheme());
            onOpenChange(false);
        } catch (error) {
            console.error('Error al exportar:', error);
            // Priorizar userMessage sobre message para mostrar errores en formato natural
            const errorMessage = error.userMessage || error.data?.userMessage || error.response?.data?.userMessage || error.message || 'Error al exportar';
            toast.error(`Error al exportar: ${errorMessage}`, getToastTheme());
        } finally {
            setIsExporting(false);
        }
    };

    const getDocumentTypeLabel = (type) => {
        const labels = {
            'albaranCofradiaPescadoresSantoCristoDelMar': 'Albarán - Cofradia Pescadores Santo Cristo del Mar',
            'listadoComprasLonjaDeIsla': 'Listado de compras - Lonja de Isla',
            'listadoComprasAsocArmadoresPuntaDelMoral': 'Listado de compras - Asoc. Armadores Punta del Moral',
        };
        return labels[type] || type;
    };

    // Helper function to parse decimal values
    const parseDecimalValueHelper = (value) => {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
            const trimmed = value.trim();
            if (trimmed === '') return 0;
            if (trimmed.includes(',')) {
                const parsed = parseEuropeanNumber(trimmed);
                return Number.isNaN(parsed) ? 0 : parsed;
            }
            return Number.isNaN(Number(trimmed)) ? 0 : Number(trimmed);
        }
        return 0;
    };

    const calculateImporte = (cantidad, precio) => {
        const cantidadNum = parseDecimalValueHelper(cantidad);
        const precioNum = parseDecimalValueHelper(precio);
        const importe = cantidadNum * precioNum;
        return Number.isFinite(importe) ? Number(importe.toFixed(2)) : 0;
    };

    const calculateImporteFromLinea = (linea) => {
        const kilos = parseDecimalValueHelper(linea.kilos || linea.pesoNeto);
        const precio = parseDecimalValueHelper(linea.precio);
        return calculateImporte(kilos, precio);
    };

    // Render content for AlbaranCofraWeb
    const renderCofraContent = (document) => {
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

        const isConvertibleArmador = (cifArmador) => {
            return armadores.some((armador) => armador.cif === cifArmador);
        };
        const isConvertibleLonja = lonjas.some((lonja) => lonja.cif === cifLonja);

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
    };

    // Render content for ListadoComprasLonjaDeIsla
    const renderLonjaDeIslaContent = (document) => {
        const { details: { fecha }, tables: { ventas } } = document;
        
        const ventasVendidurias = [];
        const ventasDirectas = [];

        ventas.forEach((venta) => {
            const barcoEncontrado = barcosLonja.find((barco) => 
                barco.cod === venta.codBarco || barco.barco === venta.barco
            );

            if (!barcoEncontrado) return;

            const nombreBarco = barcoEncontrado.barco;
            const codBarco = `${barcoEncontrado.cod}`;
            const barcoVentaDirectaEncontrado = barcosVentaDirecta.find((barco) => barco.cod === codBarco);

            if (!barcoVentaDirectaEncontrado) {
                const vendiduria = datosVendidurias.find((vendiduria) => vendiduria.cod === barcoEncontrado.codVendiduria);
                if (!vendiduria) return;

                if (!ventasVendidurias[codBarco]) {
                    ventasVendidurias[codBarco] = {
                        cod: codBarco,
                        nombre: nombreBarco,
                        vendiduria: vendiduria,
                        lineas: [],
                    };
                }
                ventasVendidurias[codBarco].lineas.push(venta);
            } else {
                const armador = barcoVentaDirectaEncontrado.armador;
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

        const importeTotalVentasDirectas = Object.values(ventasDirectas).reduce((acc, barco) => {
            return acc + barco.lineas.reduce((acc, linea) => acc + calculateImporteFromLinea(linea), 0);
        }, 0);

        const servicios = serviciosLonjaDeIsla.map((servicio) => ({
            ...servicio,
            unidades: 1,
            base: importeTotalVentasDirectas,
            precio: (importeTotalVentasDirectas * servicio.porcentaje) / 100,
            importe: (importeTotalVentasDirectas * servicio.porcentaje) / 100,
        }));

        const servicioExtra = {
            ...servicioExtraLonjaDeIsla,
            unidades: 1,
            base: servicios.find((s) => s.descripcion === 'REPERCUSION TARIFA G-4 COMP.')?.importe || 0,
            precio: (servicios.find((s) => s.descripcion === 'REPERCUSION TARIFA G-4 COMP.')?.importe || 0) * servicioExtraLonjaDeIsla.porcentaje / 100,
            importe: (servicios.find((s) => s.descripcion === 'REPERCUSION TARIFA G-4 COMP.')?.importe || 0) * servicioExtraLonjaDeIsla.porcentaje / 100,
        };
        servicios.splice(1, 0, servicioExtra);

        const getImporteServiciosVendiduria = (lineas) => {
            const importeTotal = lineas.reduce((acc, linea) => {
                return acc + calculateImporteFromLinea(linea);
            }, 0);
            return (importeTotal * PORCENTAJE_SERVICIOS_VENDIDURIAS / 100).toFixed(2);
        };

        const isConvertibleBarco = (cod) => {
            return barcosLonja.some((barco) => barco.cod === cod);
        };

        const ventasVendiduriasArray = Object.values(ventasVendidurias).filter(Boolean);
        const ventasDirectasArray = Object.values(ventasDirectas).filter(Boolean);

        return (
            <div className="space-y-4">
                {ventasDirectasArray.length > 0 && (
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="pb-2">
                                <CardTitle className="text-lg">Ventas Directas</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className='flex flex-col gap-4'>
                            {ventasDirectasArray.map((barco, index) => (
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
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-lg">Servicios Lonja de Isla Cristina</CardTitle>
                                        <div className="flex items-center gap-2">
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
                        </CardContent>
                    </Card>
                )}

                {ventasVendiduriasArray.length > 0 && (
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="pb-2">
                                <CardTitle className="text-lg">Ventas Vendidurias</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className='flex flex-col gap-4'>
                            {ventasVendiduriasArray.map((barco, index) => (
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
        );
    };

    // Render content for ListadoComprasAsocPuntaDelMoral
    const renderAsocContent = (document) => {
        const { details: { fecha, tipoSubasta }, tables } = document;
        
        const isVentaDirecta = tipoSubasta === 'M1 M1';
        const isSubasta = tipoSubasta === 'T2 Arrastre';

        const subastasGroupedByBarco = tables.subastas.reduce((acc, item) => {
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

        const importeTotalCalculado = tables.subastas.reduce((acc, linea) => {
            return acc + calculateImporte(parseDecimalValueHelper(linea.pesoNeto), parseDecimalValueHelper(linea.precio));
        }, 0);

        const servicios = serviciosAsocArmadoresPuntaDelMoral.map((servicio) => ({
            ...servicio,
            unidades: 1,
            base: importeTotalCalculado,
            precio: (importeTotalCalculado * servicio.porcentaje) / 100,
            importe: (importeTotalCalculado * servicio.porcentaje) / 100,
        }));

        const servicioExtra = {
            ...servicioExtraAsocArmadoresPuntaDelMoral,
            unidades: 1,
            base: servicios.find((s) => s.descripcion === 'Tarifa G-4')?.importe || 0,
            precio: (servicios.find((s) => s.descripcion === 'Tarifa G-4')?.importe || 0) * servicioExtraAsocArmadoresPuntaDelMoral.porcentaje / 100,
            importe: (servicios.find((s) => s.descripcion === 'Tarifa G-4')?.importe || 0) * servicioExtraAsocArmadoresPuntaDelMoral.porcentaje / 100,
        };
        servicios.splice(1, 0, servicioExtra);

        const isConvertibleBarco = (matricula) => {
            return barcosAsoc.some((barco) => normalizeText(barco.matricula) === normalizeText(matricula));
        };

        return (
            <div className="space-y-4">
                {isVentaDirecta && subastas.map((barco, index) => (
                    <Card key={index}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg">{barco.nombre}</CardTitle>
                                <div className="flex items-center gap-2">
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
                                            <TableCell className="text-right">{linea.pesoNeto}</TableCell>
                                            <TableCell className="text-right">{linea.precio} €</TableCell>
                                            <TableCell className="text-right font-medium">
                                                {calculateImporte(parseDecimalValueHelper(linea.pesoNeto), parseDecimalValueHelper(linea.precio))} €
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                ))}

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
                                    {tables.subastas.map((linea, index) => (
                                        <TableRow key={index} className="hover:bg-muted/50">
                                            <TableCell className="font-medium">{linea.cajas}</TableCell>
                                            <TableCell>{linea.especie}</TableCell>
                                            <TableCell className="text-right">{linea.pesoNeto}</TableCell>
                                            <TableCell className="text-right">{linea.precio} €</TableCell>
                                            <TableCell className="text-right font-medium">
                                                {calculateImporte(parseDecimalValueHelper(linea.pesoNeto), parseDecimalValueHelper(linea.precio))} €
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}

                {servicios.length > 0 && (
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Servicios</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Cod</TableHead>
                                        <TableHead>Descripción</TableHead>
                                        <TableHead className="text-right">Unidades</TableHead>
                                        <TableHead className="text-right">Precio</TableHead>
                                        <TableHead className="text-right">Importe</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {servicios.map((servicio, index) => (
                                        <TableRow key={index} className="hover:bg-muted/50">
                                            <TableCell className="font-medium">{servicio.codigo}</TableCell>
                                            <TableCell>{servicio.descripcion}</TableCell>
                                            <TableCell className="text-right">{servicio.unidades}</TableCell>
                                            <TableCell className="text-right">{servicio.precio.toFixed(2)} €</TableCell>
                                            <TableCell className="text-right font-medium">{servicio.importe.toFixed(2)} €</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>
        );
    };

    // Render document content based on type
    const renderDocumentContent = (document, documentType) => {
        if (!document || !documentType) return null;

        switch (documentType) {
            case 'albaranCofradiaPescadoresSantoCristoDelMar':
                return renderCofraContent(document);
            case 'listadoComprasLonjaDeIsla':
                return renderLonjaDeIslaContent(document);
            case 'listadoComprasAsocArmadoresPuntaDelMoral':
                return renderAsocContent(document);
            default:
                return null;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[1000px] max-h-[90vh] flex flex-col p-0">
                <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
                    <DialogTitle>Exportar Excel - Modo Masivo</DialogTitle>
                    <DialogDescription>
                        {documents?.length || 0} Documento(s) listo(s) para exportar
                    </DialogDescription>
                </DialogHeader>

                <div className="px-6 pb-4 flex-1 overflow-y-auto min-h-0">
                    <div className="grid gap-4">
                        <div className="grid grid-cols-2 items-center gap-4">
                            <div className='flex flex-col gap-1'>
                                <label htmlFor="software" className="font-medium">
                                    Software
                                </label>
                                <Select value={software} onValueChange={setSoftware}>
                                    <SelectTrigger id="software">
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

                        {errors.length > 0 && (
                            <Card className="border-red-200 bg-red-50/50">
                                <CardContent className="pt-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <AlertTriangle className="h-5 w-5 text-red-500" />
                                        <h3 className="font-semibold text-red-700">Errores detectados</h3>
                                    </div>
                                    <ul className="list-disc list-inside text-red-600 flex flex-col gap-2">
                                        {errors.map((error, index) => (
                                            <li key={index} className="text-sm flex gap-1 items-start">
                                                <CircleX className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                <span>{error}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        )}

                        {documentsInfo.length > 0 && (
                            <Card>
                                <CardContent className="pt-4">
                                    <h3 className="font-semibold mb-3">Resumen de documentos</h3>
                                    <Accordion type="single" collapsible className="w-full">
                                        {documentsInfo.map((docInfo, index) => {
                                            const document = documents[index];
                                            return (
                                                <AccordionItem key={index} value={`item-${index}`}>
                                                    <AccordionTrigger className={`hover:no-underline ${
                                                        docInfo.status === 'error' 
                                                            ? 'text-red-700' 
                                                            : docInfo.status === 'warning'
                                                            ? 'text-yellow-700'
                                                            : 'text-green-700'
                                                    }`}>
                                                        <div className="flex items-center justify-between w-full pr-4">
                                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                {docInfo.status === 'error' ? (
                                                                    <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                                                                ) : docInfo.status === 'warning' ? (
                                                                    <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                                                                ) : (
                                                                    <FileText className="h-4 w-4 text-green-500 flex-shrink-0" />
                                                                )}
                                                                <div className="flex-1 min-w-0 text-left">
                                                                    <p className="text-sm font-medium truncate">{docInfo.name}</p>
                                                                    <p className="text-xs text-muted-foreground">{getDocumentTypeLabel(docInfo.type)}</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right flex-shrink-0">
                                                                {docInfo.status === 'error' && (
                                                                    <span className="text-xs text-red-600">{docInfo.error}</span>
                                                                )}
                                                                {docInfo.status === 'warning' && (
                                                                    <span className="text-xs text-yellow-600">Sin filas</span>
                                                                )}
                                                                {docInfo.status === 'success' && (
                                                                    <span className="text-xs text-green-600">{docInfo.rows} fila(s)</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent>
                                                        <div className="pt-2">
                                                            {document?.processedData?.[0] ? (
                                                                renderDocumentContent(document.processedData[0], docInfo.type)
                                                            ) : (
                                                                <p className="text-sm text-muted-foreground">No hay datos disponibles para mostrar</p>
                                                            )}
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            );
                                        })}
                                    </Accordion>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                <DialogFooter className="px-6 pb-6 pt-4 flex-shrink-0 border-t">
                    <Button 
                        variant="outline" 
                        onClick={() => onOpenChange(false)}
                        disabled={isExporting}
                    >
                        Cancelar
                    </Button>
                    <Button 
                        variant="default" 
                        onClick={handleExport}
                        disabled={isExporting || documents?.length === 0}
                    >
                        {isExporting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Exportando...
                            </>
                        ) : (
                            <>
                                <Download className="h-4 w-4 mr-2" />
                                Exportar Excel
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

