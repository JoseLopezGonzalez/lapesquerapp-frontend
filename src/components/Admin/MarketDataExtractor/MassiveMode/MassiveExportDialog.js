"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Loader2, AlertTriangle, FileText, CircleX } from "lucide-react";import { downloadMassiveExcel } from "@/services/export/excelGenerator";
import { generateCofraExcelRows } from "@/exportHelpers/cofraExportHelper";
import { generateLonjaDeIslaExcelRows } from "@/exportHelpers/lonjaDeIslaExportHelper";
import { generateAsocExcelRows } from "@/exportHelpers/asocExportHelper";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { notify } from "@/lib/notifications";
import { CofraExportPreview, LonjaDeIslaExportPreview, AsocExportPreview } from "./previews";

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
                notify.error({ title: 'No hay documentos válidos para exportar.' });
                setIsExporting(false);
                return;
            }

            downloadMassiveExcel(documentsToExport, { software });
            notify.success({ title: 'Excel generado correctamente' });
            onOpenChange(false);
        } catch (error) {
            console.error('Error al exportar:', error);
            // Priorizar userMessage sobre message para mostrar errores en formato natural
            const errorMessage = error.userMessage || error.data?.userMessage || error.response?.data?.userMessage || error.message || 'Error al exportar';
            notify.error({ title: `Error al exportar: ${errorMessage}` });
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


    const DOCUMENT_PREVIEW_COMPONENTS = {
        albaranCofradiaPescadoresSantoCristoDelMar: CofraExportPreview,
        listadoComprasLonjaDeIsla: LonjaDeIslaExportPreview,
        listadoComprasAsocArmadoresPuntaDelMoral: AsocExportPreview,
    };

    const renderDocumentContent = (document, documentType) => {
        if (!document || !documentType) return null;
        const PreviewComponent = DOCUMENT_PREVIEW_COMPONENTS[documentType];
        if (!PreviewComponent) return null;
        return <PreviewComponent document={document} />;
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

