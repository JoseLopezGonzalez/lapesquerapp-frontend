"use client";

import { useSession } from "next-auth/react";
import { useRef, useState } from "react";

import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell
} from "@/components/ui/table";

import {
    Card,
    CardHeader,
    CardTitle,
    CardContent
} from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, Link2, Sparkles } from "lucide-react";
import SparklesLoader from "@/components/Utilities/SparklesLoader";



const parseAzureResult = (data) => {
    const result = {};

    // Accedemos a los documentos
    const documents = data.documents || [];
    documents.forEach((document) => {
        const fields = document.fields || {}; // Campos normales

        // Extraemos los campos clave-valor y los agregamos al resultado
        for (const fieldKey in fields) {
            const field = fields[fieldKey];
            if (field && field.content) {
                result[fieldKey] = field.content; // Guardamos los campos normales
            }
        }

        // Accedemos a las tablas dentro de `documents.fields`
        const subastas = document.fields?.subastas?.valueArray || [];  // Buscamos la tabla de subastas
        const servicios = document.fields?.servicios?.valueArray || [];  // Buscamos la tabla de servicios

        const subtotalesCajas = {
            subtotal: document.fields?.subtotales_cajas?.valueObject?.columna.valueObject.cajas?.content || "",
            iva: document.fields?.subtotales_cajas?.valueObject?.columna.valueObject.iva_cajas?.content || "",
            total: document.fields?.subtotales_cajas?.valueObject?.columna.valueObject.total?.content || "",
        }

        const subtotalesPesca = {
            subtotal: document.fields?.subtotales_pesca?.valueObject?.columna.valueObject.total_pesca?.content || "",
            iva: document.fields?.subtotales_pesca?.valueObject?.columna.valueObject.iva_pesca?.content || "",
            total: document.fields?.subtotales_pesca?.valueObject?.columna.valueObject.total?.content || "",
        }

        const subtotalesServicios = {
            subtotal: document.fields?.subtotales_servicios?.valueObject?.columna.valueObject.servicios?.content || "",
            iva: document.fields?.subtotales_servicios?.valueObject?.columna.valueObject.iva_servicios?.content || "",
            total: document.fields?.subtotales_servicios?.valueObject?.columna.valueObject.total?.content || "",
        }



        // Parsear tablas como subastas, servicios, subtotales_cajas, subtotales_pesca
        result.tablaSubastas = result.tablaSubastas || [];
        result.tablaServicios = result.tablaServicios || [];
        result.subtotalesCajas = subtotalesCajas;
        result.subtotalesPesca = subtotalesPesca;
        result.subtotalesServicios = subtotalesServicios;

        // Parseamos las tablas de subastas
        subastas.forEach((tabla) => {
            if (tabla.valueObject) {
                const table = tabla.valueObject;
                result.tablaSubastas.push({
                    cajas: table.Cajas?.content || "",
                    kilos: table.Kilos?.content || "",
                    pescado: table.Pescado?.content || "",
                    codBarco: table["Cod Barco"]?.content || "",
                    armador: table.Armador?.content || "",
                    precio: table.Precio?.content || "",
                    importe: table.Importe?.content || "",
                });
            }
        });

        // Parseamos las tablas de servicios
        servicios.forEach((tabla) => {
            if (tabla.valueObject) {
                const table = tabla.valueObject;
                result.tablaServicios.push({
                    codigo: table.Código?.content || "",
                    descripcion: table.Descripción?.content || "",
                    fecha: table.Fecha?.content || "",
                    iva: table["%IVA"]?.content || "",
                    rec: table["%REC"]?.content || "",
                    unidades: table.Unidades?.content || "",
                    precio: table.Precio?.content || "",
                    importe: table.Importe?.content || "",
                });
            }
        });

        /* parsear de nuevo subastas */

        result.tablaSubastas = result.tablaSubastas.map((row) => {
            /* separar armador de cif armador 
            ejemplos:
             ADRIMAR C.B. E21610589
             PEREZ RIVERO, MARIA BELLA 29781809Y
            
            
            */
            const armador = row.armador.split(" ");
            const cifArmador = armador.pop();
            const nombreArmador = armador.join(" ");


            /* Separar Cod de Barco en codBarco ejemplo:
            816 ABUELO PURGA	
            819 BEATRIZ LA POLA	
            
            */
            const codBarco = row.codBarco.split(" ");
            const cod = codBarco.shift();
            const barco = codBarco.join(" ");

            /* eliminar codBarco */
            delete row.codBarco;

            /* Separar cajas de tipo de cajas ejemplo:
            1 M
            2 C
            3 M
            
            */
            const cajas = row.cajas.split(" ");
            const tipoCaja = cajas.pop();
            const cantidadCajas = cajas.join(" ");

            return {
                ...row,
                armador: nombreArmador,
                cifArmador,
                barco: barco,
                cod: cod,
                cajas: cantidadCajas,
                tipoCaja

            };
        });




    });

    return result;
};




export default function PdfExtractor() {
    const [selectedFile, setSelectedFile] = useState(null)
    const [documentType, setDocumentType] = useState("") // Para el tipo de documento
    const [isValid, setIsValid] = useState(false) // Estado de validación del documento
    const [loading, setLoading] = useState(false) // Estado de carga
    const fileInputRef = useRef(null)
    const [file, setFile] = useState(null);
    const [result, setResult] = useState(null);


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
                parseResult: parseAzureResult
            }
        )
    }

    // Manejador para el botón de procesar
    const handleProcess = () => {
        if ( !documentType) { /* !selectedFile || */
            alert("Por favor, seleccione un archivo y el tipo de documento.");
            return;
        }

        switch (documentType) {
            case "albaranCofraWeb":
                processAlbaranCofraWeb();
                break;
            case "listadoComprasLonjaIsla":
                /* processListadoComprasLonjaIsla(); */
                break;
            case "listadoComprasLonjaAyamonte":
                /* processListadoComprasLonjaAyamonte(); */
                break;
            default:
                alert("Tipo de documento no soportado.");
        }


        // Aquí iría la lógica para procesar el documento
        /* console.log("Procesando documento:", selectedFile, documentType); */
    }

    // Manejador para el botón de validación
    const handleValidate = () => {
        if (!selectedFile) {
            alert("Por favor, seleccione un documento antes de validarlo.");
            return;
        }
        setIsValid(true); // Confirmar que el documento está validado
    }

    // Lógica para los botones de exportación, integración y generar Excel
    const handleExport = () => {
        console.log("Exportando documento...");
    }

    const handleIntegrate = () => {
        console.log("Integrando información en la app...");
    }

    const handleGenerateExcel = () => {
        console.log("Generando Excel...");
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

            console.log("Resultado Azure completo:", analysisResult);

            // 🧹 Parsear y estructurar el resultado para que solo contenga los campos necesarios
            /* const parsedResult = parseAzureResult(analysisResult); */
            const parsedResult = parseResult(analysisResult);
            console.log("Resultado parseado:", parsedResult);

            setResult(parsedResult); // Guardar resultado en el estado

        } catch (error) {
            console.error("Error al procesar el PDF:", error);
            alert("Ocurrió un error: " + error.message);
        } finally {
            setLoading(false);
        }
    };


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
                        <Button className="w-full" variant="outline" onClick={handleExport}>
                            <Download className="mr-2 h-4 w-4" />
                            Exportar
                        </Button>
                        <Button className="w-full" variant="outline" onClick={handleIntegrate}>
                            <Link2 className="mr-2 h-4 w-4" />
                            Integrar en la app
                        </Button>
                        <Button className="w-full" variant="outline" onClick={handleGenerateExcel}>
                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                            Generar Excel
                        </Button>
                    </div>
                </Card>

                {/* Panel de vista previa (70%) */}
                <div className="w-full  flex flex-col">

                    {/*                 <h2 className="text-2xl font-bold">Datos Extraidos con IA</h2>
 */}

                    <div className="w-full h-full flex  justify-center  overflow-y-auto">

                        {loading ? (
                            <div className="w-full h-full flex items-center justify-center">
                                <SparklesLoader loading={loading} />
                            </div>

                        ) : result ? (
                            <div>
                                <div className="container mx-auto py-3 space-y-3">
                                    {/* Sección de Datos del Albarán */}
                                    <Card>
                                        <CardHeader className="pb-0">
                                            <CardTitle className="text-base">Albarán Cofra Web</CardTitle>
                                        </CardHeader>
                                        <CardContent className="px-10 py-5">
                                            <div className="flex flex-col  gap-2">
                                                {/* Información de la Lonja - Lado izquierdo */}
                                                <div className="flex-1">
                                                    <div className="text-base font-bold">
                                                        {result.lonja}
                                                    </div>
                                                    <div className="text-sm">C.I.F.: {result.cif_lonja}</div>
                                                </div>

                                                {/* Información del Albarán - Lado derecho */}
                                                <div className="flex-1 grid grid-cols-2 gap-3">
                                                    <div className="border border-muted p-3 rounded-md text-sm">
                                                        <div className="flex gap-1">
                                                            <div className="font-semibold">Nº Albarán:</div>
                                                            <div>{result.numero}</div>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <div className="font-semibold">Fecha:</div>
                                                            <div>{result.fecha}</div>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <div className="font-semibold">Ejercicio:</div>
                                                            <div>{result.ejercicio}</div>
                                                        </div>
                                                    </div>

                                                    <div className=" border border-muted p-3 rounded-md text-sm">
                                                        <div className="flex gap-1">
                                                            <div className="font-semibold">Comprador:</div>
                                                            <div className="">{result.comprador}</div>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <div className="font-semibold">Codigo:</div>
                                                            <div className="">{result.numero_comprador}</div>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <div className="font-semibold">C.I.F.:</div>
                                                            <div className="">{result.cif_comprador}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Tabla de Subastas */}
                                    <Card>
                                        <CardHeader className="pb-0 pt-3 px-3">
                                            <CardTitle>Subastas</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-3">
                                            <div className="overflow-x-auto">
                                                <Table className="border-collapse [&_th]:p-2 [&_td]:p-2">
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Cajas</TableHead>
                                                            <TableHead>Kilos</TableHead>
                                                            <TableHead>Pescado</TableHead>
                                                            <TableHead>Cod</TableHead>
                                                            <TableHead>Barco</TableHead>
                                                            <TableHead>Armador</TableHead>
                                                            <TableHead>Precio</TableHead>
                                                            <TableHead>Importe</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {result.tablaSubastas.map((row, index) => (
                                                            <TableRow key={index}>
                                                                <TableCell>{row.cajas} {row.tipoCaja}</TableCell>
                                                                <TableCell>{row.kilos}</TableCell>
                                                                <TableCell>{row.pescado}</TableCell>
                                                                <TableCell>{row.cod}</TableCell>
                                                                <TableCell>{row.barco}</TableCell>
                                                                <TableCell>
                                                                    {row.armador} <br />
                                                                    {row.cifArmador}
                                                                </TableCell>
                                                                <TableCell>{row.precio}</TableCell>
                                                                <TableCell>{row.importe}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Tabla de Servicios */}
                                    <Card>
                                        <CardHeader className="pb-0 pt-3 px-3">
                                            <CardTitle>Servicios</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-3">
                                            <div className="overflow-x-auto">
                                                <Table className="border-collapse [&_th]:p-2 [&_td]:p-2">
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Código</TableHead>
                                                            <TableHead>Descripción</TableHead>
                                                            <TableHead>Fecha</TableHead>
                                                            <TableHead>%IVA</TableHead>
                                                            <TableHead>%REC</TableHead>
                                                            <TableHead>Unidades</TableHead>
                                                            <TableHead>Precio</TableHead>
                                                            <TableHead>Importe</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {result.tablaServicios.map((row, index) => (
                                                            <TableRow key={index}>
                                                                <TableCell>{row.codigo}</TableCell>
                                                                <TableCell>{row.descripcion}</TableCell>
                                                                <TableCell>{row.fecha}</TableCell>
                                                                <TableCell>{row.iva}</TableCell>
                                                                <TableCell>{row.rec}</TableCell>
                                                                <TableCell>{row.unidades}</TableCell>
                                                                <TableCell>{row.precio}</TableCell>
                                                                <TableCell>{row.importe}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Subtotales */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                        {/* Subtotales Pesca */}
                                        <Card>
                                            <CardHeader className="pb-0 pt-3 px-3">
                                                <CardTitle>Subtotales Pesca</CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-3">
                                                <Table className="border-collapse [&_th]:p-2 [&_td]:p-2">
                                                    <TableBody>
                                                        <TableRow>
                                                            <TableCell className="font-medium">Total Pesca</TableCell>
                                                            <TableCell className="text-right">
                                                                {result.subtotalesPesca.subtotal}
                                                            </TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell className="font-medium">IVA Pesca</TableCell>
                                                            <TableCell className="text-right">
                                                                {result.subtotalesPesca.iva}
                                                            </TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell className="font-medium">Total</TableCell>
                                                            <TableCell className="text-right">
                                                                {result.subtotalesPesca.total}
                                                            </TableCell>
                                                        </TableRow>
                                                    </TableBody>
                                                </Table>
                                            </CardContent>
                                        </Card>

                                        {/* Subtotales Servicios */}
                                        <Card>
                                            <CardHeader className="pb-0 pt-3 px-3">
                                                <CardTitle>Subtotales Servicios</CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-3">
                                                <Table className="border-collapse [&_th]:p-2 [&_td]:p-2">
                                                    <TableBody>
                                                        <TableRow>
                                                            <TableCell className="font-medium">Total Servicios</TableCell>
                                                            <TableCell className="text-right">
                                                                {result.subtotalesServicios.subtotal}
                                                            </TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell className="font-medium">IVA Servicios</TableCell>
                                                            <TableCell className="text-right">
                                                                {result.subtotalesServicios.iva}
                                                            </TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell className="font-medium">Total</TableCell>
                                                            <TableCell className="text-right">
                                                                {result.subtotalesServicios.total}
                                                            </TableCell>
                                                        </TableRow>
                                                    </TableBody>
                                                </Table>
                                            </CardContent>
                                        </Card>

                                        {/* Subtotales Cajas */}
                                        <Card>
                                            <CardHeader className="pb-0 pt-3 px-3">
                                                <CardTitle>Subtotales Cajas</CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-3">
                                                <Table className="border-collapse [&_th]:p-2 [&_td]:p-2">
                                                    <TableBody>
                                                        <TableRow>
                                                            <TableCell className="font-medium">Cajas</TableCell>
                                                            <TableCell className="text-right">
                                                                {result.subtotalesCajas.subtotal}
                                                            </TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell className="font-medium">IVA Cajas</TableCell>
                                                            <TableCell className="text-right">
                                                                {result.subtotalesCajas.iva}
                                                            </TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell className="font-medium">Total</TableCell>
                                                            <TableCell className="text-right">
                                                                {result.subtotalesCajas.total}
                                                            </TableCell>
                                                        </TableRow>
                                                    </TableBody>
                                                </Table>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Total */}
                                    <Card className="flex items-center justify-between p-3">
                                        <span>Total</span>
                                        <div className="text-2xl font-bold text-right">
                                            {result.importe_total} €
                                        </div>
                                    </Card>
                                </div>
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
