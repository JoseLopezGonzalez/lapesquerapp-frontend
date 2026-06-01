'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Loader2, AlertTriangle, CircleX, FileCheck2 } from 'lucide-react';
import { downloadMassiveExcel } from '@/services/export/excelGenerator';
import { generateCofraExcelRows } from '@/exportHelpers/cofraExportHelper';
import {
  generateLonjaDeIslaExcelRows,
  getLonjaDeIslaTradeType,
} from '@/exportHelpers/lonjaDeIslaExportHelper';
import { generateAsocExcelRows } from '@/exportHelpers/asocExportHelper';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { notify } from '@/lib/notifications';
import { CofraExportPreview, LonjaDeIslaExportPreview, AsocExportPreview } from './previews';

export default function MassiveExportDialog({ open, onOpenChange, documents }) {
  const [software, setSoftware] = useState('A3ERP');
  const [applyFullTasaPescaRepercusion, setApplyFullTasaPescaRepercusion] = useState(true);
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
      albaranCofradiaPescadoresSantoCristoDelMar: generateCofraExcelRows,
      listadoComprasLonjaDeIsla: generateLonjaDeIslaExcelRows,
      listadoComprasAsocArmadoresPuntaDelMoral: generateAsocExcelRows,
    };

    documents.forEach((doc) => {
      if (!doc.processedData || doc.processedData.length === 0) {
        allErrors.push(`Documento "${doc.file?.name || 'Desconocido'}": No tiene datos procesados`);
        docsInfo.push({
          name: doc.file?.name || 'Desconocido',
          type: doc.documentType || 'No especificado',
          status: 'error',
          error: 'No tiene datos procesados',
        });
        return;
      }

      const helper = EXPORT_HELPERS[doc.documentType];
      if (!helper) {
        allErrors.push(
          `Documento "${doc.file?.name || 'Desconocido'}": Tipo de documento no soportado para exportación`
        );
        docsInfo.push({
          name: doc.file?.name || 'Desconocido',
          type: doc.documentType || 'No especificado',
          status: 'error',
          error: 'Tipo no soportado',
        });
        return;
      }

      try {
        // Try to generate rows to detect errors
        const result = helper(doc.processedData[0], {
          startSequence: 1,
          applyFullTasaPescaRepercusion,
        });

        if (!result || !result.rows || result.rows.length === 0) {
          allErrors.push(
            `Documento "${doc.file?.name || 'Desconocido'}": No se generaron filas para exportar`
          );
          docsInfo.push({
            name: doc.file?.name || 'Desconocido',
            type: doc.documentType || 'No especificado',
            status: 'warning',
            rows: 0,
          });
        } else {
          docsInfo.push({
            name: doc.file?.name || 'Desconocido',
            type: doc.documentType || 'No especificado',
            status: 'success',
            rows: result.rows.length,
          });
        }
      } catch (error) {
        // Priorizar userMessage sobre message para mostrar errores en formato natural
        const errorMessage =
          error.userMessage ||
          error.data?.userMessage ||
          error.response?.data?.userMessage ||
          error.message ||
          'Error al procesar';
        allErrors.push(`Documento "${doc.file?.name || 'Desconocido'}": ${errorMessage}`);
        docsInfo.push({
          name: doc.file?.name || 'Desconocido',
          type: doc.documentType || 'No especificado',
          status: 'error',
          error: errorMessage,
        });
      }
    });

    setErrors(allErrors);
    setDocumentsInfo(docsInfo);
  }, [open, documents, applyFullTasaPescaRepercusion]);

  const handleExport = async () => {
    if (errors.length > 0) {
      notify.error({
        title: 'No se puede exportar',
        description: 'Corrige los errores detectados antes de generar el Excel.',
      });
      return;
    }

    setIsExporting(true);
    try {
      const documentsToExport = documents
        .filter((doc) => doc.processedData && doc.processedData.length > 0)
        .map((doc) => ({
          document: doc.processedData[0],
          documentType: doc.documentType,
        }));

      if (documentsToExport.length === 0) {
        notify.error({
          title: 'Sin documentos para exportar',
          description: 'No hay documentos válidos seleccionados para generar el Excel.',
        });
        setIsExporting(false);
        return;
      }

      await downloadMassiveExcel(documentsToExport, {
        software,
        applyFullTasaPescaRepercusion,
      });
      notify.success({
        title: 'Excel generado',
        description: 'El archivo se ha generado correctamente.',
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error al exportar:', error);
      // Priorizar userMessage sobre message para mostrar errores en formato natural
      const errorMessage =
        error.userMessage ||
        error.data?.userMessage ||
        error.response?.data?.userMessage ||
        error.message ||
        'Error al exportar';
      notify.error({
        title: 'Error al exportar Excel',
        description: errorMessage,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getDocumentTypeLabel = (type) => {
    const labels = {
      albaranCofradiaPescadoresSantoCristoDelMar:
        'Albarán - Cofradia Pescadores Santo Cristo del Mar',
      listadoComprasLonjaDeIsla: 'Listado de compras - Lonja de Isla',
      listadoComprasAsocArmadoresPuntaDelMoral:
        'Listado de compras - Asoc. Armadores Punta del Moral',
    };
    return labels[type] || type;
  };

  const getSubtypeLabel = (document, documentType) => {
    if (!document) return null;

    if (documentType === 'listadoComprasLonjaDeIsla') {
      return getLonjaDeIslaTradeType(document) === 'SUBASTA' ? 'Subasta' : 'Contrato';
    }

    if (documentType === 'listadoComprasAsocArmadoresPuntaDelMoral') {
      const tipoSubasta = document?.details?.tipoSubasta;
      if (tipoSubasta === 'T2 Arrastre') return 'Subasta';
      if (tipoSubasta === 'M1 M1') return 'Contrato';
    }

    return null;
  };

  const getSubtypePillClassName = (subtype) => {
    if (subtype === 'Subasta') return 'border-amber-300 bg-amber-50 text-amber-800';
    if (subtype === 'Contrato') return 'border-sky-300 bg-sky-50 text-sky-800';
    if (subtype === 'Venta directa') return 'border-emerald-300 bg-emerald-50 text-emerald-800';
    return 'border-muted bg-muted/40 text-foreground';
  };

  const getDocumentSummaryParts = (document, documentType) => {
    if (!document) {
      return {
        fecha: 'Sin fecha',
        lonja: getDocumentTypeLabel(documentType),
      };
    }

    const isCofra = documentType === 'albaranCofradiaPescadoresSantoCristoDelMar';
    const details = isCofra ? document?.detalles : document?.details;

    return {
      fecha: details?.fecha || 'Sin fecha',
      lonja: details?.lonja || getDocumentTypeLabel(documentType),
    };
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
    return (
      <PreviewComponent
        document={document}
        applyFullTasaPescaRepercusion={applyFullTasaPescaRepercusion}
      />
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="5xl" className="flex max-h-[95vh] flex-col">
        <DialogHeader>
          <DialogTitle>Exportar Excel - Modo Masivo</DialogTitle>
          <DialogDescription>
            {documents?.length || 0} Documento(s) listo(s) para exportar
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid gap-4">
            <div className="grid grid-cols-2 items-center gap-4">
              <div className="flex flex-col gap-1">
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

            <div className="border-border bg-muted/30 flex items-start gap-3 rounded-md border p-3">
              <Checkbox
                id="tasa-pesca-repercusion-masivo"
                checked={applyFullTasaPescaRepercusion}
                onCheckedChange={(v) => setApplyFullTasaPescaRepercusion(v === true)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="tasa-pesca-repercusion-masivo"
                  className="cursor-pointer text-sm font-medium"
                >
                  Repercutir tasa pesca fresca (T4) en gastos exportados
                </Label>
                <p className="text-muted-foreground text-xs">
                  Afecta listados Lonja de Isla y ASOC en este Excel. Desmarcar = porcentajes de
                  exención.
                </p>
              </div>
            </div>

            {errors.length > 0 && (
              <Card className="border-red-200 bg-red-50/50">
                <CardContent className="pt-4">
                  <div className="mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <h3 className="font-semibold text-red-700">Errores detectados</h3>
                  </div>
                  <ul className="flex list-inside list-disc flex-col gap-2 text-red-600">
                    {errors.map((error, index) => (
                      <li key={index} className="flex items-start gap-1 text-sm">
                        <CircleX className="mt-0.5 h-4 w-4 flex-shrink-0" />
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
                  <h3 className="mb-3 font-semibold">Resumen de documentos</h3>
                  <Accordion type="single" collapsible className="w-full">
                    {documentsInfo.map((docInfo, index) => {
                      const document = documents[index];
                      return (
                        <AccordionItem key={index} value={`item-${index}`}>
                          <AccordionTrigger
                            className={`hover:no-underline ${
                              docInfo.status === 'error'
                                ? 'text-red-700'
                                : docInfo.status === 'warning'
                                  ? 'text-yellow-700'
                                  : 'text-green-700'
                            }`}
                          >
                            <div className="flex w-full items-center justify-between pr-4">
                              <div className="flex min-w-0 flex-1 items-center gap-2">
                                {docInfo.status === 'error' ? (
                                  <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-500" />
                                ) : docInfo.status === 'warning' ? (
                                  <AlertTriangle className="h-4 w-4 flex-shrink-0 text-yellow-500" />
                                ) : (
                                  <span className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                                    <FileCheck2 className="h-3.5 w-3.5" />
                                  </span>
                                )}
                                <div className="min-w-0 flex-1 text-left">
                                  {(() => {
                                    const processedDoc = document?.processedData?.[0];
                                    const summary = getDocumentSummaryParts(
                                      processedDoc,
                                      docInfo.type
                                    );
                                    const subtype = getSubtypeLabel(processedDoc, docInfo.type);
                                    return (
                                      <div className="leading-tight break-words whitespace-normal">
                                        <p className="text-sm font-medium">{summary.fecha}</p>
                                        <p className="text-foreground/80 text-sm font-medium">
                                          {summary.lonja}
                                        </p>
                                        <p className="text-muted-foreground mt-1 truncate text-[11px]">
                                          {docInfo.name}
                                        </p>
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                              <div className="flex-shrink-0 text-right">
                                {(() => {
                                  const processedDoc = document?.processedData?.[0];
                                  const subtype = getSubtypeLabel(processedDoc, docInfo.type);
                                  return subtype ? (
                                    <div className="mb-1">
                                      <span
                                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${getSubtypePillClassName(subtype)}`}
                                      >
                                        {subtype}
                                      </span>
                                    </div>
                                  ) : null;
                                })()}
                                {docInfo.status === 'error' && (
                                  <span className="text-xs text-red-600">{docInfo.error}</span>
                                )}
                                {docInfo.status === 'warning' && (
                                  <span className="text-xs text-yellow-600">Sin filas</span>
                                )}
                                {docInfo.status === 'success' && (
                                  <span className="text-xs text-green-600">
                                    {docInfo.rows} fila(s)
                                  </span>
                                )}
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="h-auto">
                            <div className="pt-2">
                              {document?.processedData?.[0] ? (
                                renderDocumentContent(document.processedData[0], docInfo.type)
                              ) : (
                                <p className="text-muted-foreground text-sm">
                                  No hay datos disponibles para mostrar
                                </p>
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Cancelar
          </Button>
          <Button
            variant="default"
            onClick={handleExport}
            disabled={isExporting || documents?.length === 0 || errors.length > 0}
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Exportar Excel
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
