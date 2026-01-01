"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Sparkles, TextSearch } from "lucide-react";
import SparklesLoader from "@/components/Utilities/SparklesLoader";
import AlbaranCofraWeb from "../AlbaranCofraWeb";
import toast from "react-hot-toast";
import { getToastTheme } from "@/customs/reactHotToast";
import ListadoComprasAsocPuntaDelMoral from "../ListadoComprasAsocPuntaDelMoral";
import { PdfUpload } from "@/components/Utilities/PdfUpload";
import ListadoComprasLonjaDeIsla from "../ListadoComprasLonjaDeIsla";
import { EmptyState } from "@/components/Utilities/EmptyState";
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

    const processAlbaranCofradiaPescadoresSantoCristoDelMar = () => {
        setLoading(true);
        setProcessedDocuments([]);

        processDocument(file, 'albaranCofradiaPescadoresSantoCristoDelMar')
            .then((result) => {
                if (result.success) {
                    setProcessedDocuments(result.data);
                    setViewDocumentType("albaranCofradiaPescadoresSantoCristoDelMar");
                } else {
                    if (result.errorType === 'validation') {
                        toast.error(
                            `Error de validación: ${result.error}\nPor favor, verifique que el documento sea del tipo correcto.`,
                            getToastTheme()
                        );
                    } else if (result.errorType === 'parsing') {
                        toast.error(
                            `Error al procesar datos: ${result.error}\nPor favor, contacte al administrador.`,
                            getToastTheme()
                        );
                    } else if (result.errorType === 'azure') {
                        toast.error(result.error, getToastTheme());
                    } else {
                        console.error("Error inesperado:", result.error);
                        toast.error("Error inesperado al procesar el documento.", getToastTheme());
                    }
                }
            })
            .catch((error) => {
                console.error("Error inesperado:", error);
                toast.error("Error inesperado al procesar el documento.", getToastTheme());
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const processListadoComprasAsocArmadoresPuntaDelMoral = () => {
        setLoading(true);
        setProcessedDocuments([]);

        processDocument(file, 'listadoComprasAsocArmadoresPuntaDelMoral')
            .then((result) => {
                if (result.success) {
                    setProcessedDocuments(result.data);
                    setViewDocumentType("listadoComprasAsocArmadoresPuntaDelMoral");
                } else {
                    if (result.errorType === 'validation') {
                        toast.error(
                            `Error de validación: ${result.error}\nPor favor, verifique que el documento sea del tipo correcto.`,
                            getToastTheme()
                        );
                    } else if (result.errorType === 'parsing') {
                        toast.error(
                            `Error al procesar datos: ${result.error}\nPor favor, contacte al administrador.`,
                            getToastTheme()
                        );
                    } else if (result.errorType === 'azure') {
                        toast.error(result.error, getToastTheme());
                    } else {
                        console.error("Error inesperado:", result.error);
                        toast.error("Error inesperado al procesar el documento.", getToastTheme());
                    }
                }
            })
            .catch((error) => {
                console.error("Error inesperado:", error);
                toast.error("Error inesperado al procesar el documento.", getToastTheme());
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const processListadoComprasLonjaDeIsla = () => {
        setLoading(true);
        setProcessedDocuments([]);

        processDocument(file, 'listadoComprasLonjaDeIsla')
            .then((result) => {
                if (result.success) {
                    setProcessedDocuments(result.data);
                    setViewDocumentType("listadoComprasLonjaDeIsla");
                } else {
                    if (result.errorType === 'validation') {
                        toast.error(
                            `Error de validación: ${result.error}\nPor favor, verifique que el documento sea del tipo correcto.`,
                            getToastTheme()
                        );
                    } else if (result.errorType === 'parsing') {
                        toast.error(
                            `Error al procesar datos: ${result.error}\nPor favor, contacte al administrador.`,
                            getToastTheme()
                        );
                    } else if (result.errorType === 'azure') {
                        toast.error(result.error, getToastTheme());
                    } else {
                        console.error("Error inesperado:", result.error);
                        toast.error("Error inesperado al procesar el documento.", getToastTheme());
                    }
                }
            })
            .catch((error) => {
                console.error("Error inesperado:", error);
                toast.error("Error inesperado al procesar el documento.", getToastTheme());
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const handleProcess = () => {
        if (!documentType) {
            toast.error("Por favor, seleccione un archivo y el tipo de documento.", getToastTheme());
            return;
        }

        switch (documentType) {
            case "albaranCofradiaPescadoresSantoCristoDelMar":
                processAlbaranCofradiaPescadoresSantoCristoDelMar();
                break;
            case "listadoComprasAsocArmadoresPuntaDelMoral":
                processListadoComprasAsocArmadoresPuntaDelMoral();
                break;
            case "listadoComprasLonjaDeIsla":
                processListadoComprasLonjaDeIsla();
                break;
            default:
                toast.error("Tipo de documento no soportado.", getToastTheme());
        }
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

