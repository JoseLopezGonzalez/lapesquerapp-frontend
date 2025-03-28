"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, Link2, Sparkles } from "lucide-react";
import SparklesLoader from "@/components/Utilities/SparklesLoader";
import AlbaranCofraWeb from "./AlbaranCofraWeb";
import toast from "react-hot-toast";
import { darkToastTheme } from "@/customs/reactHotToast";
import ListadoComprasAsocPuntaDelMoral from "./ListadoComprasAsocPuntaDelMoral";
import { parseAzureDocumentAIResult } from "@/helpers/azure/documentAI";
import { extractDataWithAzureDocumentAi } from "@/services/azure";
import { PdfUpload } from "@/components/Utilities/PdfUpload";

const parseAlbaranesCofraWeb = (data) => {

    const parsedDocuments = data.map((document) => {
        const details = {
            lonja: document.details.lonja,
            cifLonja: document.details.cif_lonja,
            numero: document.details.numero,
            fecha: document.details.fecha,
            ejercicio: document.details.ejercicio,
            comprador: document.details.comprador,
            numeroComprador: document.details.numero_comprador,
            cifComprador: document.details.cif_comprador,
            importeTotal: document.details.importe_total,
        };

        const tablaSubastas = document.tables.subastas.map((row) => {
            const armador = row.Armador.split(" ");
            const cifArmador = armador.pop();
            const nombreArmador = armador.join(" ");

            const codBarco = row["Cod Barco"].split(" ");
            const cod = codBarco.shift();
            const barco = codBarco.join(" ");


            const cajas = row.Cajas.split(" ");
            const tipoCaja = cajas.pop();
            const cantidadCajas = cajas.join(" ");

            return {
                cajas: cantidadCajas,
                tipoCaja,
                kilos: row.Kilos,
                pescado: row.Pescado,
                cod: cod,
                barco: barco,
                armador: nombreArmador,
                cifArmador,
                precio: row.Precio,
                importe: row.Importe
            };
        });

        const tablaServicios = document.tables.servicios.map((row) => {
            return {
                codigo: row.Código,
                descripcion: row.Descripción,
                fecha: row.Fecha,
                iva: row["%IVA"],
                rec: row["%REC"],
                unidades: row.Unidades,
                precio: row.Precio,
                importe: row.Importe
            };
        });

        const subtotalesPesca = {
            subtotal: document.objects.subtotales_pesca.columna.total_pesca,
            iva: document.objects.subtotales_pesca.columna.iva_pesca,
            total: document.objects.subtotales_pesca.columna.total
        };

        const subtotalesServicios = {
            subtotal: document.objects.subtotales_servicios.columna.servicios,
            iva: document.objects.subtotales_servicios.columna.iva_servicios,
            total: document.objects.subtotales_servicios.columna.total
        };

        const subtotalesCajas = {
            subtotal: document.objects.subtotales_cajas.columna.cajas,
            iva: document.objects.subtotales_cajas.columna.iva_cajas,
            total: document.objects.subtotales_cajas.columna.total
        };

        return {
            detalles: details,
            tablas: {
                subastas: tablaSubastas,
                servicios: tablaServicios
            },
            subtotales: {
                pesca: subtotalesPesca,
                servicios: subtotalesServicios,
                cajas: subtotalesCajas
            },
        }

    });

    return parsedDocuments;

}

export default function MarketDataExtractor() {
    const [documentType, setDocumentType] = useState("") // Para el tipo de documento
    const [loading, setLoading] = useState(false) // Estado de carga
    const fileInputRef = useRef(null)
    const [file, setFile] = useState(null);
    const [processedDocuments, setProcessedDocuments] = useState([]); // Para guardar los documentos procesados


    const [viewDocumentType, setViewDocumentType] = useState("");

    const processAlbaranCofradiaPescadoresSantoCristoDelMar = () => {

        setLoading(true);

        extractDataWithAzureDocumentAi({
            file,
            documentType: 'AlbaranCofradiaPescadoresSantoCristoDelMar',
        }).then((data) => {
            setProcessedDocuments(parseAlbaranesCofraWeb(data));
        }).catch((error) => {
            console.error(error);
            toast.error("Error al procesar el documento.", darkToastTheme);
        }).finally(() => {
            setLoading(false);
        });

        setViewDocumentType("albaranCofradiaPescadoresSantoCristoDelMar");
    }

    const processListadoComprasAsocArmadoresPuntaDelMoral = () => {

        setLoading(true);
        extractDataWithAzureDocumentAi(
            {
                file,
                documentType: 'ListadoComprasAsocArmadoresPuntaDelMoral',
            }
        ).then((data) => {
            setProcessedDocuments(data);
        }).catch((error) => {
            console.error(error);
            toast.error("Error al procesar el documento.", darkToastTheme);
        }).finally(() => {
            setLoading(false);
        });

        setViewDocumentType("listadoComprasAsocArmadoresPuntaDelMoral");
    }

    const handleProcess = () => {
        if (!documentType) { /* !selectedFile || */
            toast.error("Por favor, seleccione un archivo y el tipo de documento.", darkToastTheme);
            return;
        }

        switch (documentType) {
            case "albaranCofradiaPescadoresSantoCristoDelMar":
                processAlbaranCofradiaPescadoresSantoCristoDelMar();
                break;
            case "listadoComprasAsocArmadoresPuntaDelMoral":
                processListadoComprasAsocArmadoresPuntaDelMoral();
                /* no implementar por el momento*/
                break;
            case "listadoComprasLonjaIsla":
                /* no implementar por el momento*/
                break;
            case "listadoComprasLonjaAyamonts":
                /* no implementar por el momento*/
                break;
            default:
                toast.error("Tipo de documento no soportado.", darkToastTheme);
        }
    }

    const handleIntegrate = () => {
        console.log("Integrando información en la app...");
    }

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };


    const handleExportToA3Erp = () => {
        console.log("Exportando a A3ERP...");
    }

    const handleExportToFacilCom = () => {
        console.log("Exportando a FacilCom...");
    }






    return (
        <>
            <div className="flex h-full bg-background gap-4">
                {/* Panel de control (30%) */}
                <Card className="w-full md:w-[30%] p-6 flex flex-col gap-6 border-r">
                    <h2 className="text-2xl font-bold">Panel de Control</h2>

                    {/* <div className="space-y-2">
                        <label htmlFor="pdf-upload" className="text-sm font-medium">
                            Seleccionar documento PDF
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                ref={fileInputRef}
                                id="pdf-upload"
                                type="file"
                                accept="application/pdf"
                                onChange={handleFileChange}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium"
                            />
                        </div>
                    </div> */}

                    <PdfUpload onChange={setFile} />

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
                                <SelectItem value="listadoComprasLonjaIsla">Listado de compras - Lonja de Isla</SelectItem>
                                <SelectItem value="listadoComprasLonjaAyamonte">Listado de compras - Lonja de Ayamonte</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Button className="w-full" onClick={handleProcess}>
                        <Sparkles className=" h-4 w-4" />
                        Extraer datos con IA
                    </Button>

                    <div className="space-y-3 mt-auto">
                        <Button className="w-full" variant="outline" onClick={handleIntegrate}>
                            <Link2 className="mr-2 h-4 w-4" />
                            Integrar en la app
                        </Button>
                        <Button className="w-full" variant="outline" onClick={handleExportToA3Erp}>
                            <Download className="mr-2 h-4 w-4" />
                            Exportación a A3Erp
                        </Button>
                        <Button className="w-full" variant="outline" onClick={handleExportToFacilCom}>
                            <Download className="mr-2 h-4 w-4" />
                            Exportación a FacilCom
                        </Button>
                    </div>
                </Card>

                {/* Panel de vista previa (70%) */}
                <div className="w-full  flex flex-col">

                    <div className="w-full h-full flex  justify-center  overflow-y-auto">

                        {loading ? (
                            <div className="w-full h-full flex items-center justify-center">
                                <SparklesLoader loading={loading} />
                            </div>

                        ) : processedDocuments.length > 0 ? (

                            <div>
                                {
                                    viewDocumentType === "albaranCofradiaPescadoresSantoCristoDelMar" && (
                                        <AlbaranCofraWeb document={processedDocuments[0]} />
                                    )
                                }
                                {
                                    viewDocumentType === "listadoComprasAsocArmadoresPuntaDelMoral" && (
                                        <ListadoComprasAsocPuntaDelMoral document={processedDocuments[0]} />
                                    )
                                }
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center   ">
                                <p className="text-muted-foreground">Procesa un documento para ver la vista previa</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
