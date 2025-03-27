"use client";

import { useRef, useState } from "react";
import {
    Card,
} from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, Link2, Sparkles } from "lucide-react";
import SparklesLoader from "@/components/Utilities/SparklesLoader";
import AlbaranCofraWeb from "./AlbaranCofraWeb";
import toast from "react-hot-toast";
import { darkToastTheme } from "@/customs/reactHotToast";


const analyzeAzureResult = (data) => {
    const analyzedDocuments = [];

    // Accedemos a los documentos
    const documents = data.documents || [];

    documents.forEach((document) => {

        const fields = document.fields || {};

        const details = {}

        for (const fieldKey in fields) {
            const field = fields[fieldKey];
            if (field && field.content) {
                details[fieldKey] = field.content;
            }
        }


        const tables = {};

        for (const field in fields) {
            if (fields[field].type === 'array' && fields[field].valueArray) {
                tables[field] = [];
                fields[field].valueArray.forEach((item, index) => {
                    const row = item.valueObject;
                    const formattedRow = {};
                    for (const key in row) {
                        if (row[key].content) {
                            formattedRow[key] = row[key].content;
                        }
                    }
                    if (formattedRow) {
                        tables[field].push(formattedRow);
                    }
                });
            }
        }


        const objects = {};

        for (const field in fields) {
            if (fields[field].type === 'object' && fields[field].valueObject) {
                objects[field] = {};
                const obj = fields[field].valueObject;
                for (const key in obj) {
                    if (obj[key].valueObject) {
                        objects[field][key] = {};
                        const subObj = obj[key].valueObject;
                        for (const subKey in subObj) {
                            if (subObj[subKey].content) {
                                objects[field][key][subKey] = subObj[subKey].content;
                            }
                        }
                    }
                }
            }
        }

        analyzedDocuments.push({
            details,
            tables,
            objects
        });

    });

    return analyzedDocuments;
};

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


    const processAlbaranCofraWeb = () => {

        const endpoint = process.env.NEXT_PUBLIC_AZURE_DOCUMENT_AI_COFRAWEB_ENDPOINT;
        const apiKey = process.env.NEXT_PUBLIC_AZURE_DOCUMENT_AI_COFRAWEB_KEY;
        const modelId = process.env.NEXT_PUBLIC_AZURE_DOCUMENT_AI_COFRAWEB_MODEL_ID;
        const apiVersion = '2023-07-31';


        handleUpload(
            {
                modelId,
                endpoint,
                apiKey,
                apiVersion,
                parseResult: parseAlbaranesCofraWeb
            }
        )
    }

    // Manejador para el botón de procesar
    const handleProcess = () => {
        if (!documentType) { /* !selectedFile || */
            toast.error("Por favor, seleccione un archivo y el tipo de documento.", darkToastTheme);
            return;
        }

        switch (documentType) {
            case "albaranCofraWeb":
                processAlbaranCofraWeb();
                break;
            case "listadoComprasLonjaIsla":
                /* no implementar por el momento*/
                break;
            case "listadoComprasLonjaAyamonte":
                /* no implementar por el momento*/
                break;
            default:
                alert("Tipo de documento no soportado.");
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

    const handleUpload = async ({ modelId, endpoint, apiKey, apiVersion, parseResult }) => {
        if (!file) {
            alert("Selecciona un archivo PDF");
            return;
        }

        setLoading(true);

        try {
            /* const endpoint = process.env.NEXT_PUBLIC_AZURE_DOCUMENT_AI_COFRAWEB_ENDPOINT;
            const apiKey = process.env.NEXT_PUBLIC_AZURE_DOCUMENT_AI_COFRAWEB_KEY;
            const modelId = process.env.NEXT_PUBLIC_AZURE_DOCUMENT_AI_COFRAWEB_MODEL_ID;
            const apiVersion = '2023-07-31'; */
            /* const endpoint = process.env.NEXT_PUBLIC_AZURE_DOCUMENT_AI_ENDPOINT; // Verifica que sea correcto
            const apiKey = process.env.NEXT_PUBLIC_AZURE_DOCUMENT_AI_KEY;
            const modelId = process.env.NEXT_PUBLIC_AZURE_DOCUMENT_AI_MODEL_ID;
            const apiVersion = '2023-07-31'; */ // Versión estable de la API '2024-11-30'

            // URL para Azure API (con la versión correcta de API)
            /* const url = `${endpoint}formrecognizer/documentModels/prebuilt-document:analyze?api-version=${apiVersion}`; */
            const url = `${endpoint}formrecognizer/documentModels/${modelId}:analyze?api-version=${apiVersion}`;
            console.log("URL:", url);
            /* const url = `${endpoint}formrecognizer/documentModels/prebuilt-document:analyze?api-version=${apiVersion}`; */

            // Leer archivo PDF como binary
            const fileBuffer = await file.arrayBuffer();

            // Hacer llamada inicial a Azure
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/pdf',
                    'Ocp-Apim-Subscription-Key': apiKey,
                },
                body: fileBuffer,
            });

            if (!response.ok) {
                throw new Error(`Error Azure inicial: ${response.statusText}`);
            }

            // Obtener URL de resultado
            const operationLocation = response.headers.get('Operation-Location');
            if (!operationLocation) {
                throw new Error("Operation-Location no encontrado en respuesta.");
            }

            // Esperar el resultado final (polling)
            let analysisResult = null;
            let status = null;

            do {
                await new Promise(resolve => setTimeout(resolve, 2000)); // esperar 2 segundos
                const resultResponse = await fetch(operationLocation, {
                    headers: { 'Ocp-Apim-Subscription-Key': apiKey },
                });

                if (!resultResponse.ok) {
                    throw new Error(`Error Azure resultado: ${resultResponse.statusText}`);
                }

                const resultData = await resultResponse.json();
                status = resultData.status;

                if (status === 'succeeded') {
                    analysisResult = resultData.analyzeResult;
                } else if (status === 'failed') {
                    throw new Error("Análisis fallido en Azure.");
                }

            } while (status === 'running' || status === 'notStarted');

            /*  console.log("Resultado Azure completo:", analysisResult); */

            // 🧹 Parsear y estructurar el resultado para que solo contenga los campos necesarios
            const parsedResult = parseResult(analyzeAzureResult(analysisResult));
            console.log("Resultado parseado:", parsedResult);

            setProcessedDocuments(parsedResult);

        } catch (error) {
            console.error("Error al procesar el PDF:", error);
            alert("Ocurrió un error: " + error.message);
        } finally {
            setLoading(false);
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

                    {/* Input de archivo */}
                    <div className="space-y-2">
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
                    </div>

                    {/* Selector de tipo de documento */}
                    <div className="space-y-2">
                        <label htmlFor="document-type" className="text-sm font-medium">
                            Tipo de documento
                        </label>
                        <Select value={documentType} onValueChange={setDocumentType}>
                            <SelectTrigger id="document-type">
                                <SelectValue placeholder="Seleccionar documento" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="albaranCofraWeb">Albarán Cofra Web</SelectItem>
                                <SelectItem value="listadoComprasLonjaIsla">Listado de compras - Lonja de Isla</SelectItem>
                                <SelectItem value="listadoComprasLonjaAyamonte">Listado de compras - Lonja de Ayamonte</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Botón de procesar */}
                    <Button className="w-full" onClick={handleProcess}>
                        <Sparkles className=" h-4 w-4" />
                        Extraer datos con IA
                    </Button>

                    {/* Botones de acción */}
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
                                <AlbaranCofraWeb document={processedDocuments[0]} />
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
