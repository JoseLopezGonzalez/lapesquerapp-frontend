"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Download, Link as LinkIcon, Loader2 } from "lucide-react";import { downloadMassiveExcel } from "@/services/export/excelGenerator";
import { linkAllPurchases } from "@/services/export/linkService";
import { generateCofraLinkedSummary } from "@/exportHelpers/cofraExportHelper";
import { generateLonjaDeIslaLinkedSummary } from "@/exportHelpers/lonjaDeIslaExportHelper";
import { notify } from "@/lib/notifications";
import { generateAsocLinkedSummary } from "@/exportHelpers/asocExportHelper";

export default function MassiveExportModal({ documents }) {
    const [isExporting, setIsExporting] = useState(false);
    const [isLinking, setIsLinking] = useState(false);
    const [open, setOpen] = useState(false);

    const LINKED_SUMMARY_GENERATORS = {
        'albaranCofradiaPescadoresSantoCristoDelMar': generateCofraLinkedSummary,
        'listadoComprasLonjaDeIsla': generateLonjaDeIslaLinkedSummary,
        'listadoComprasAsocArmadoresPuntaDelMoral': generateAsocLinkedSummary,
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const documentsToExport = documents.map((doc) => ({
                document: doc.processedData[0],
                documentType: doc.documentType,
            }));

            downloadMassiveExcel(documentsToExport);
            notify.success('Excel generado correctamente');
        } catch (error) {
            console.error('Error al exportar:', error);
            notify.error(`Error al exportar: ${error.message}`);
        } finally {
            setIsExporting(false);
        }
    };

    const handleLinkAll = async () => {
        setIsLinking(true);
        try {
            // Generate linkedSummary for all documents
            const allLinkedSummary = [];

            documents.forEach((doc) => {
                const generator = LINKED_SUMMARY_GENERATORS[doc.documentType];
                if (generator && doc.processedData && doc.processedData.length > 0) {
                    const linkedSummary = generator(doc.processedData[0]);
                    allLinkedSummary.push(...linkedSummary);
                }
            });

            if (allLinkedSummary.length === 0) {
                notify.error('No hay compras para enlazar');
                return;
            }

            // Link all purchases
            const result = await linkAllPurchases(allLinkedSummary);

            if (result.correctas > 0) {
                notify.success(`Compras enlazadas correctamente (${result.correctas})`);
            }

            if (result.errores > 0) {
                notify.error(`${result.errores} compras fallaron al enlazar`);
            }

            if (result.correctas === 0 && result.errores === 0) {
                notify.info('No hay compras válidas para enlazar');
            }
        } catch (error) {
            console.error('Error al enlazar:', error);
            notify.error(`Error al enlazar: ${error.message}`);
        } finally {
            setIsLinking(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar y Enlazar
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Exportar y Enlazar Documentos</DialogTitle>
                    <DialogDescription>
                        Exporta todos los documentos a un único Excel y enlaza todas las compras.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <p className="text-sm text-muted-foreground mb-4">
                        {documents.length} documento(s) procesado(s) correctamente
                    </p>
                    <div className="space-y-2">
                        <Button
                            className="w-full"
                            onClick={handleExport}
                            disabled={isExporting || isLinking}
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
                            className="w-full"
                            variant="outline"
                            onClick={handleLinkAll}
                            disabled={isExporting || isLinking}
                        >
                            {isLinking ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Enlazando...
                                </>
                            ) : (
                                <>
                                    <LinkIcon className="h-4 w-4 mr-2" />
                                    Enlazar Todas las Compras
                                </>
                            )}
                        </Button>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cerrar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

