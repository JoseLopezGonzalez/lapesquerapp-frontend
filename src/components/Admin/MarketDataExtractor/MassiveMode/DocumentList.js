"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2, Eye, RotateCcw, FileText, CheckCircle, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import AlbaranCofraWeb from "../AlbaranCofraWeb";
import ListadoComprasLonjaDeIsla from "../ListadoComprasLonjaDeIsla";
import ListadoComprasAsocPuntaDelMoral from "../ListadoComprasAsocPuntaDelMoral";
import { EmptyState } from "@/components/Utilities/EmptyState";
import { getDocumentTypeLabel } from "../shared/documentTypeLabels";

export default function DocumentList({ documents, onRetry, onDelete, onDeleteAll }) {
    const [openDialogId, setOpenDialogId] = useState(null);

    const getStatusIcon = (status) => {
        switch (status) {
            case 'success':
                return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case 'error':
                return <XCircle className="h-5 w-5 text-red-500" />;
            case 'processing':
                return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
            default:
                return <FileText className="h-5 w-5 text-gray-400" />;
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'success':
                return <Badge variant="default" className="bg-green-500">Éxito</Badge>;
            case 'error':
                return <Badge variant="destructive">Error</Badge>;
            case 'processing':
                return <Badge variant="secondary">Procesando...</Badge>;
            default:
                return <Badge variant="outline">Pendiente</Badge>;
        }
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
                return <ListadoComprasLonjaDeIsla document={doc} hideExport={hideExport} />;
            case 'listadoComprasAsocArmadoresPuntaDelMoral':
                return <ListadoComprasAsocPuntaDelMoral document={doc} hideExport={hideExport} />;
            default:
                return <div>Vista previa no disponible</div>;
        }
    };

    return (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <CardHeader className="flex-shrink-0 border-b px-4 py-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Documentos Procesados ({documents.length})</CardTitle>
                    {documents.length > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onDeleteAll}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar todos
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 min-h-0">
                {documents.length > 0 ? (
                    <div className="space-y-4">
                        {documents.map((doc) => (
                            <div key={doc.id} className="border rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="flex-shrink-0">
                                            {getStatusIcon(doc.status)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate">{doc.file.name}</div>
                                            <div className="text-sm text-muted-foreground truncate">
                                                {getDocumentTypeLabel(doc.documentType)}
                                            </div>
                                        </div>
                                        <div className="flex-shrink-0">
                                            {getStatusBadge(doc.status)}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                        {doc.status === 'error' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onRetry(doc.id)}
                                            >
                                                <RotateCcw className="h-4 w-4 mr-2" />
                                                Reintentar
                                            </Button>
                                        )}
                                        {doc.status === 'success' && (
                                            <Dialog open={openDialogId === doc.id} onOpenChange={(open) => setOpenDialogId(open ? doc.id : null)}>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" size="sm">
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        Ver detalles
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                                                    <DialogHeader>
                                                        <DialogTitle>{doc.file.name}</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="mt-4">
                                                        {renderDocumentPreview(doc, true)}
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onDelete && onDelete(doc.id)}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            title="Eliminar documento"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {doc.error && (
                                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                                        {doc.error}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <EmptyState
                            icon={<CheckCircle className="h-12 w-12 text-primary" strokeWidth={1.5} />}
                            title="No hay documentos procesados"
                            description="Los documentos procesados aparecerán aquí."
                        />
                    </div>
                )}
            </CardContent>
        </div>
    );
}

