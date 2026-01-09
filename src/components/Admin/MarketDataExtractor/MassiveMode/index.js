"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, X, FileText, Upload, Download, Link as LinkIcon, Loader2, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { getToastTheme } from "@/customs/reactHotToast";
import { processDocument } from "../shared/DocumentProcessor";
import DocumentList from "./DocumentList";
import { EmptyState } from "@/components/Utilities/EmptyState";
import { getDocumentTypeLabel } from "../shared/documentTypeLabels";
import { downloadMassiveExcel } from "@/services/export/excelGenerator";
import { generateCofraLinkedSummary } from "@/exportHelpers/cofraExportHelper";
import { generateLonjaDeIslaLinkedSummary } from "@/exportHelpers/lonjaDeIslaExportHelper";
import { generateAsocLinkedSummary } from "@/exportHelpers/asocExportHelper";
import MassiveLinkPurchasesDialog from "./MassiveLinkPurchasesDialog";

export default function MassiveMode() {
    const [documents, setDocuments] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
    const fileInputRef = useRef(null);

    const LINKED_SUMMARY_GENERATORS = {
        'albaranCofradiaPescadoresSantoCristoDelMar': generateCofraLinkedSummary,
        'listadoComprasLonjaDeIsla': generateLonjaDeIslaLinkedSummary,
        'listadoComprasAsocArmadoresPuntaDelMoral': generateAsocLinkedSummary,
    };

    const handleAddFiles = (files) => {
        const newDocuments = Array.from(files).map((file, index) => ({
            id: `${Date.now()}-${index}-${Math.random()}`,
            file,
            documentType: null,
            status: 'pending',
            processedData: null,
            error: null,
        }));

        setDocuments((prev) => [...prev, ...newDocuments]);
    };

    const handleDocumentTypeChange = (documentId, documentType) => {
        setDocuments((prev) =>
            prev.map((doc) =>
                doc.id === documentId ? { ...doc, documentType } : doc
            )
        );
    };

    const handleRemoveDocument = (documentId) => {
        setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
    };

    const handleProcessAll = async () => {
        // Get documents that need to be processed
        const documentsToProcess = documents.filter(
            (doc) => (doc.status === 'pending' || doc.status === 'error') && doc.documentType
        );

        if (documentsToProcess.length === 0) {
            // Check if there are documents without type
            const documentsWithoutType = documents.filter(
                (doc) => (doc.status === 'pending' || doc.status === 'error') && !doc.documentType
            );
            if (documentsWithoutType.length > 0) {
                toast.error(
                    `Por favor, seleccione el tipo de documento para todos los archivos pendientes.`,
                    getToastTheme()
                );
            } else {
                toast.info('No hay documentos pendientes para procesar.', getToastTheme());
            }
            return;
        }

        setIsProcessing(true);

        let successCount = 0;
        let errorCount = 0;

        // Process documents one by one (could be optimized to process in parallel with a limit)
        for (const doc of documentsToProcess) {
            setDocuments((prev) =>
                prev.map((d) =>
                    d.id === doc.id ? { ...d, status: 'processing' } : d
                )
            );

            try {
                const result = await processDocument(doc.file, doc.documentType);

                setDocuments((prev) =>
                    prev.map((d) =>
                        d.id === doc.id
                            ? {
                                  ...d,
                                  status: result.success ? 'success' : 'error',
                                  processedData: result.success ? result.data : null,
                                  error: result.success ? null : result.error,
                              }
                            : d
                    )
                );

                // Show toast if document failed
                if (!result.success) {
                    errorCount++;
                    toast.error(
                        `Error al procesar "${doc.file.name}": ${result.error || 'Error desconocido'}`,
                        {
                            ...getToastTheme(),
                            duration: 6000, // Show for 6 seconds
                        }
                    );
                } else {
                    successCount++;
                }
            } catch (error) {
                const errorMessage = error.message || 'Error desconocido';
                setDocuments((prev) =>
                    prev.map((d) =>
                        d.id === doc.id
                            ? {
                                  ...d,
                                  status: 'error',
                                  error: errorMessage,
                              }
                            : d
                    )
                );
                
                // Show toast for caught errors
                errorCount++;
                toast.error(
                    `Error al procesar "${doc.file.name}": ${errorMessage}`,
                    {
                        ...getToastTheme(),
                        duration: 6000, // Show for 6 seconds
                    }
                );
            }
        }

        setIsProcessing(false);

        // Show summary toast if there were errors
        if (errorCount > 0) {
            toast.error(
                `Procesamiento completado: ${successCount} éxito, ${errorCount} error(es). Revisa los documentos con error.`,
                {
                    ...getToastTheme(),
                    duration: 8000, // Show for 8 seconds
                }
            );
        } else if (successCount > 0) {
            toast.success(
                `Todos los documentos procesados correctamente (${successCount})`,
                getToastTheme()
            );
        }
    };

    const handleRetryDocument = async (documentId) => {
        const doc = documents.find((d) => d.id === documentId);
        if (!doc || !doc.documentType) {
            toast.error('Por favor, seleccione el tipo de documento.', getToastTheme());
            return;
        }

        setDocuments((prev) =>
            prev.map((d) =>
                d.id === documentId ? { ...d, status: 'processing', error: null } : d
            )
        );

        try {
            const result = await processDocument(doc.file, doc.documentType);

            setDocuments((prev) =>
                prev.map((d) =>
                    d.id === documentId
                        ? {
                              ...d,
                              status: result.success ? 'success' : 'error',
                              processedData: result.success ? result.data : null,
                              error: result.success ? null : result.error,
                          }
                        : d
                )
            );
        } catch (error) {
            setDocuments((prev) =>
                prev.map((d) =>
                    d.id === documentId
                        ? {
                              ...d,
                              status: 'error',
                              error: error.message || 'Error desconocido',
                          }
                        : d
                )
            );
        }
    };

    const successfulDocuments = documents.filter((doc) => doc.status === 'success');
    const hasSuccessfulDocuments = successfulDocuments.length > 0;

    const pendingDocuments = documents.filter((doc) => doc.status === 'pending' || doc.status === 'error');
    // processedDocuments includes 'success' and 'processing' status
    const processedDocuments = documents.filter((doc) => doc.status === 'success' || doc.status === 'processing');

    const handleFileUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const documentsToExport = successfulDocuments
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

            downloadMassiveExcel(documentsToExport);
            toast.success('Excel generado correctamente', getToastTheme());
        } catch (error) {
            console.error('Error al exportar:', error);
            toast.error(`Error al exportar: ${error.message}`, getToastTheme());
        } finally {
            setIsExporting(false);
        }
    };

    const handleOpenLinkDialog = () => {
        // Check if there are any purchases to link
        const allLinkedSummary = [];
        successfulDocuments.forEach((doc) => {
            const generator = LINKED_SUMMARY_GENERATORS[doc.documentType];
            if (generator && doc.processedData && doc.processedData.length > 0) {
                const linkedSummary = generator(doc.processedData[0]);
                if (linkedSummary && linkedSummary.length > 0) {
                    allLinkedSummary.push(...linkedSummary);
                }
            }
        });

        if (allLinkedSummary.length === 0) {
            toast.error('No hay compras para enlazar', getToastTheme());
            return;
        }

        setIsLinkDialogOpen(true);
    };

    return (
        <div className="flex h-full bg-background gap-4 overflow-hidden">
            {/* Left Column: Pending Documents */}
            <Card className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <CardHeader className="flex-shrink-0 border-b px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-base">Documentos Pendientes ({pendingDocuments.length})</CardTitle>
                        <div className="flex gap-2 flex-shrink-0">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleFileUploadClick}
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                Seleccionar PDFs
                            </Button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="application/pdf"
                                multiple
                                onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        handleAddFiles(e.target.files);
                                    }
                                }}
                                className="hidden"
                            />
                            {pendingDocuments.length > 0 && (
                                <Button
                                    size="sm"
                                    onClick={handleProcessAll}
                                    disabled={isProcessing}
                                >
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    {isProcessing ? 'Procesando...' : 'Procesar Todos'}
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4 min-h-0">
                    {pendingDocuments.length > 0 ? (
                        <div className="space-y-2">
                            {pendingDocuments.map((doc) => (
                                <div
                                    key={doc.id}
                                    className={`flex flex-col gap-2 p-3 border rounded-md ${
                                        doc.status === 'error' ? 'border-red-300 bg-red-50/50' : ''
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        {doc.status === 'error' ? (
                                            <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-500" />
                                        ) : (
                                            <FileText className="h-4 w-4 flex-shrink-0" />
                                        )}
                                        <span className="flex-1 text-sm truncate min-w-0 font-medium">
                                            {doc.file.name}
                                        </span>
                                        <Select
                                            value={doc.documentType || ''}
                                            onValueChange={(value) => handleDocumentTypeChange(doc.id, value)}
                                        >
                                            <SelectTrigger className="w-64 flex-shrink-0">
                                                <SelectValue placeholder="Tipo de documento" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="albaranCofradiaPescadoresSantoCristoDelMar">
                                                    Albarán - Cofradia Pescadores Santo Cristo del Mar
                                                </SelectItem>
                                                <SelectItem value="listadoComprasAsocArmadoresPuntaDelMoral">
                                                    Listado de compras - Asoc. Armadores Punta del Moral
                                                </SelectItem>
                                                <SelectItem value="listadoComprasLonjaDeIsla">
                                                    Listado de compras - Lonja de Isla
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoveDocument(doc.id)}
                                            className="flex-shrink-0"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    {doc.error && (
                                        <div className="flex items-start gap-2 p-2 bg-red-100 border border-red-300 rounded text-sm text-red-700">
                                            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                            <span className="flex-1">{doc.error}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <EmptyState
                                icon={<Upload className="h-12 w-12 text-primary" strokeWidth={1.5} />}
                                title="No hay documentos pendientes"
                                description="Selecciona PDFs para comenzar a procesar documentos."
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Right Column: Processed Documents */}
            <Card className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <DocumentList
                    documents={processedDocuments}
                    onRetry={handleRetryDocument}
                />
                {hasSuccessfulDocuments && (
                    <div className="px-4 py-3 border-t flex-shrink-0 bg-card flex gap-2">
                        <Button
                            onClick={handleExport}
                            disabled={isExporting}
                            className="flex-1"
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
                        <Button
                            onClick={handleOpenLinkDialog}
                            variant="outline"
                            className="flex-1"
                        >
                            <LinkIcon className="h-4 w-4 mr-2" />
                            Enlazar Compras
                        </Button>
                    </div>
                )}
            </Card>

            {/* Dialog for linking purchases */}
            <MassiveLinkPurchasesDialog
                open={isLinkDialogOpen}
                onOpenChange={setIsLinkDialogOpen}
                documents={successfulDocuments}
                linkedSummaryGenerators={LINKED_SUMMARY_GENERATORS}
            />
        </div>
    );
}

