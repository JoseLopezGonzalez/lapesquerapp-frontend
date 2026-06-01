'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  RotateCcw,
  FileText,
  CheckCircle,
  Trash2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useState } from 'react';
import AlbaranCofraWeb from '../AlbaranCofraWeb';
import ListadoComprasLonjaDeIsla from '../ListadoComprasLonjaDeIsla';
import ListadoComprasAsocPuntaDelMoral from '../ListadoComprasAsocPuntaDelMoral';
import { EmptyState } from '@/components/Utilities/EmptyState';
import { getDocumentTypeLabel } from '../shared/documentTypeLabels';
import { getLonjaDeIslaTradeType } from '@/exportHelpers/lonjaDeIslaExportHelper';

export default function DocumentList({
  documents,
  onRetry,
  onDelete,
  onDeleteAll,
  onDocumentUpdate,
}) {
  const [openDialogId, setOpenDialogId] = useState(null);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };

  const getSubtypeLabel = (doc) => {
    if (!doc?.processedData?.length) return null;
    const processed = doc.processedData[0];

    if (doc.documentType === 'listadoComprasLonjaDeIsla') {
      return getLonjaDeIslaTradeType(processed) === 'SUBASTA' ? 'Subasta' : 'Contrato';
    }

    if (doc.documentType === 'listadoComprasAsocArmadoresPuntaDelMoral') {
      const tipoSubasta = processed?.details?.tipoSubasta;
      if (tipoSubasta === 'T2 Arrastre') return 'Subasta';
      if (tipoSubasta === 'M1 M1') return 'Contrato';
    }

    return null;
  };

  const getExtractedSummaryParts = (doc) => {
    if (!doc?.processedData?.length) {
      return {
        fecha: 'Sin fecha',
        lonja: getDocumentTypeLabel(doc?.documentType),
      };
    }

    const processed = doc.processedData[0];
    const isCofra = doc.documentType === 'albaranCofradiaPescadoresSantoCristoDelMar';
    const details = isCofra ? processed?.detalles : processed?.details;

    const fecha = details?.fecha || 'Sin fecha';
    const lonja = details?.lonja || getDocumentTypeLabel(doc.documentType);
    return { fecha, lonja };
  };

  const getSubtypePillClassName = (subtype) => {
    if (subtype === 'Subasta') {
      return 'border-amber-300 bg-amber-50 text-amber-800';
    }
    if (subtype === 'Contrato') {
      return 'border-sky-300 bg-sky-50 text-sky-800';
    }
    if (subtype === 'Venta directa') {
      return 'border-emerald-300 bg-emerald-50 text-emerald-800';
    }
    return 'border-muted bg-muted/40 text-foreground';
  };

  const renderDocumentPreview = (document, hideExport = false) => {
    if (!document.processedData || document.processedData.length === 0) {
      return null;
    }

    const doc = document.processedData[0];

    switch (document.documentType) {
      case 'albaranCofradiaPescadoresSantoCristoDelMar':
        return <AlbaranCofraWeb document={doc} hideExport={hideExport} />;
      case 'listadoComprasLonjaDeIsla':
        return (
          <ListadoComprasLonjaDeIsla
            document={doc}
            hideExport={hideExport}
            onDocumentCorrection={
              onDocumentUpdate
                ? (corrected) => onDocumentUpdate(document.id, [corrected])
                : undefined
            }
          />
        );
      case 'listadoComprasAsocArmadoresPuntaDelMoral':
        return <ListadoComprasAsocPuntaDelMoral document={doc} hideExport={hideExport} />;
      default:
        return <div>Vista previa no disponible</div>;
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <CardHeader className="flex-shrink-0 border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Documentos Procesados ({documents.length})</CardTitle>
          {documents.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDeleteAll}
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar todos
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-y-auto p-4">
        {documents.length > 0 ? (
          <div className="space-y-4">
            {documents.map((doc) => (
              <div key={doc.id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex-shrink-0">{getStatusIcon(doc.status)}</div>
                    <div className="min-w-0 flex-1">
                      {(() => {
                        const summary = getExtractedSummaryParts(doc);
                        return (
                          <>
                            <div className="leading-tight font-medium break-words whitespace-normal">
                              <span className="block">{summary.fecha}</span>
                              <span className="block">{summary.lonja}</span>
                            </div>
                          </>
                        );
                      })()}
                      <div className="text-muted-foreground truncate text-xs">{doc.file.name}</div>
                    </div>
                  </div>
                  <div className="ml-2 flex flex-shrink-0 items-center gap-2">
                    {getSubtypeLabel(doc) && (
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${getSubtypePillClassName(getSubtypeLabel(doc))}`}
                      >
                        {getSubtypeLabel(doc)}
                      </span>
                    )}
                    {doc.status === 'error' && (
                      <Button variant="outline" size="sm" onClick={() => onRetry(doc.id)}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reintentar
                      </Button>
                    )}
                    {doc.status === 'success' && (
                      <Dialog
                        open={openDialogId === doc.id}
                        onOpenChange={(open) => setOpenDialogId(open ? doc.id : null)}
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            Ver detalles
                          </Button>
                        </DialogTrigger>
                        <DialogContent size="6xl" className="max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{doc.file.name}</DialogTitle>
                          </DialogHeader>
                          <div className="mt-4">{renderDocumentPreview(doc, true)}</div>
                        </DialogContent>
                      </Dialog>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete && onDelete(doc.id)}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      title="Eliminar documento"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {doc.error && (
                  <div className="mt-2 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
                    {doc.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <EmptyState
              icon={<CheckCircle className="text-primary h-12 w-12" strokeWidth={1.5} />}
              title="No hay documentos procesados"
              description="Los documentos procesados aparecerán aquí."
            />
          </div>
        )}
      </CardContent>
    </div>
  );
}
