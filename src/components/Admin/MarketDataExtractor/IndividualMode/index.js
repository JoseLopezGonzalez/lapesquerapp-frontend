"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Sparkles, TextSearch } from "lucide-react";
import SparklesLoader from "@/components/Utilities/SparklesLoader";
import AlbaranCofraWeb from "../AlbaranCofraWeb";import ListadoComprasAsocPuntaDelMoral from "../ListadoComprasAsocPuntaDelMoral";
import { PdfUpload } from "@/components/Utilities/PdfUpload";
import ListadoComprasLonjaDeIsla from "../ListadoComprasLonjaDeIsla";
import { EmptyState } from "@/components/Utilities/EmptyState";
import { notify } from "@/lib/notifications";
import { processDocument } from "../shared/DocumentProcessor";

export default function IndividualMode() {
    const [documentType, setDocumentType] = useState("");
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState(null);
    const [processedDocuments, setProcessedDocuments] = useState([]);
    const [viewDocumentType, setViewDocumentType] = useState("");

    const handleOnSetFile = (file) => {
        setFile(file);
        setDocumentType("");
        setProcessedDocuments([]);
        setViewDocumentType("");
        setLoading(false);
    };

    const handleProcessResult = (result) => {
        if (result.success) {
            setProcessedDocuments(result.data);
            setViewDocumentType(documentType);
        } else {
            if (result.errorType === 'validation') {
                notify.error({
                  title: 'Error de validación',
                  description: `${result.error} Verifique que el documento sea del tipo correcto.`,
                });
            } else if (result.errorType === 'parsing') {
                notify.error({
                  title: 'Error al procesar datos',
                  description: `${result.error} Contacte al administrador si persiste.`,
                });
            } else if (result.errorType === 'azure') {
                notify.error({ title: 'Error en el servicio', description: result.error });
            } else {
                console.error("Error inesperado:", result.error);
                notify.error({
                  title: 'Error al procesar documento',
                  description: 'Ocurrió un error inesperado. Intente de nuevo o contacte al administrador.',
                });
            }
        }
    };

    const handleProcessError = (error) => {
        console.error("Error inesperado:", error);
        notify.error({
          title: 'Error al procesar documento',
          description: 'Ocurrió un error inesperado. Intente de nuevo o contacte al administrador.',
        });
    };

    const handleProcess = () => {
        if (!documentType) {
            notify.error({
              title: "Archivo y tipo requeridos",
              description: "Seleccione un archivo y el tipo de documento.",
            });
            return;
        }

        const validTypes = [
            'albaranCofradiaPescadoresSantoCristoDelMar',
            'listadoComprasAsocArmadoresPuntaDelMoral',
            'listadoComprasLonjaDeIsla',
        ];
        if (!validTypes.includes(documentType)) {
            notify.error({
              title: 'Tipo de documento no soportado',
              description: 'Seleccione un tipo de documento válido para este extractor.',
            });
            return;
        }

        setLoading(true);
        setProcessedDocuments([]);

        processDocument(file, documentType)
            .then(handleProcessResult)
            .catch(handleProcessError)
            .finally(() => setLoading(false));
    };

    return (
        <div className="flex h-full bg-background gap-4">
            {/* Panel de control (30%) */}
            <Card className="w-full md:w-[30%] p-6 flex flex-col gap-6 border-r">
                <h2 className="text-2xl font-bold">Extracción datos lonjas</h2>

                <div className="flex flex-col justify-between h-full">
                    <PdfUpload onChange={handleOnSetFile} />

                    <div className="flex flex-col gap-6">
                        <div className="space-y-2">
                            <label htmlFor="document-type" className="text-sm font-medium">
                                Tipo de documento
                            </label>
                            <Select value={documentType} onValueChange={setDocumentType}>
                                <SelectTrigger id="document-type">
                                    <SelectValue placeholder="Seleccionar documento" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="albaranCofradiaPescadoresSantoCristoDelMar">Albarán - Cofradia Pescadores Santo Cristo del Mar</SelectItem>
                                    <SelectItem value="listadoComprasAsocArmadoresPuntaDelMoral">Listado de compras - Asoc. Armadores Punta del Moral</SelectItem>
                                    <SelectItem value="listadoComprasLonjaDeIsla">Listado de compras - Lonja de Isla</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button className="w-full" onClick={handleProcess}>
                            <Sparkles className="h-4 w-4" />
                            Extraer datos con IA
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Panel de vista previa (70%) */}
            <div className="w-full flex flex-col">
                <div className="w-full h-full flex justify-center overflow-y-auto">
                    {loading ? (
                        <div className="w-full h-full flex items-center justify-center">
                            <SparklesLoader loading={loading} />
                        </div>
                    ) : processedDocuments.length > 0 ? (
                        <div>
                            {viewDocumentType === "albaranCofradiaPescadoresSantoCristoDelMar" && (
                                <AlbaranCofraWeb document={processedDocuments[0]} />
                            )}
                            {viewDocumentType === "listadoComprasAsocArmadoresPuntaDelMoral" && (
                                <ListadoComprasAsocPuntaDelMoral document={processedDocuments[0]} />
                            )}
                            {viewDocumentType === "listadoComprasLonjaDeIsla" && (
                                <ListadoComprasLonjaDeIsla document={processedDocuments[0]} />
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <EmptyState
                                icon={<TextSearch className="h-12 w-12 text-primary" strokeWidth={1.5} />}
                                title="Procese un documento"
                                description="Procesa un documento para ver la vista previa."
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

