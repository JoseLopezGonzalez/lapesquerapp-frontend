"use client";

import { API_URL_V2 } from "@/configs/config";
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
import { Brain, Download, FileSpreadsheet, Link2 } from "lucide-react";

/* const parseAzureResult = (data) => {
    const result = {};

    const keyValuePairs = data.keyValuePairs || [];
    keyValuePairs.forEach(pair => {
        if (pair.key && pair.value) {
            result[pair.key.content] = pair.value.content;
        }
    });

    const tables = data.tables || [];
    const subastasTable = tables.find(table => {
        // Filtrar solo la tabla de subastas, puedes poner condiciones según los encabezados de la tabla
        return table.cells.some(cell => cell.content.toLowerCase().includes("cajas"));
    });

    const serviciosTable = tables.find(table => {
        return table.cells.some(cell => cell.content.toLowerCase().includes("descripción"));
    });

    const subtotalesPescaTable = tables.find(table => {
    });


    if (subastasTable) {
        result.tabla_subastas = parseTable(subastasTable);
    }

    if (serviciosTable) {
        result.tabla_servicios = parseTable(serviciosTable);
    }



    return result;
}; */


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

        const subtotales_pesca = document.fields?.subtotales_pesca?.valueObject.columna || [];  // Buscamos la tabla de subtotales_pesca
        const subtotales_cajas = document.fields?.subtotales_cajas?.valueObject.columna || [];  // Buscamos la tabla de subtotales_cajas
        const subtotales_servicios = document.fields?.subtotales_servicios?.valueObject.columna || [];  // Buscamos la tabla de subtotales_servicios

        // Parsear tablas como subastas, servicios, subtotales_cajas, subtotales_pesca
        result.tabla_subastas = result.tabla_subastas || [];
        result.tabla_servicios = result.tabla_servicios || [];
        result.subtotales_cajas = result.subtotales_cajas || [];
        result.subtotales_pesca = result.subtotales_pesca || [];
        result.subtotales_servicios = result.subtotales_servicios || [];

        // Parseamos las tablas de subastas
        subastas.forEach((tabla) => {
            if (tabla.valueObject) {
                const table = tabla.valueObject;
                result.tabla_subastas.push({
                    Cajas: table.Cajas?.content || "",
                    Kilos: table.Kilos?.content || "",
                    Pescado: table.Pescado?.content || "",
                    CodBarco: table["Cod Barco"]?.content || "",
                    Armador: table.Armador?.content || "",
                    Precio: table.Precio?.content || "",
                    Importe: table.Importe?.content || "",
                });
            }
        });

        // Parseamos las tablas de servicios
        servicios.forEach((tabla) => {
            if (tabla.valueObject) {
                const table = tabla.valueObject;
                result.tabla_servicios.push({
                    Código: table.Código?.content || "",
                    Descripción: table.Descripción?.content || "",
                    Fecha: table.Fecha?.content || "",
                    IVA: table["%IVA"]?.content || "",
                    Unidades: table.Unidades?.content || "",
                    Precio: table.Precio?.content || "",
                    Importe: table.Importe?.content || "",
                });
            }
        });

        // Parseamos las tablas de subtotales_cajas

        if (subtotales_cajas.valueObject) {
            result.subtotales_cajas.push({
                subtotal: subtotales_cajas.valueObject.cajas?.content || "",
                ivaCajas: subtotales_cajas.valueObject.iva_cajas?.content || "",
                total: subtotales_cajas.valueObject.total?.content || "",
            });
        }

        // Parseamos las tablas de subtotales_pesca
        if (subtotales_pesca.valueObject) {
            result.subtotales_pesca.push({
                subtotal: subtotales_pesca.valueObject.total_pesca?.content || "",
                ivaPesca: subtotales_pesca.valueObject.iva_pesca?.content || "",
                total: subtotales_pesca.valueObject.total?.content || "",
            });
        }

        // Parseamos las tablas de subtotales_servicios
        if (subtotales_servicios.valueObject) {
            result.subtotales_servicios.push({
                subtotal: subtotales_servicios.valueObject.servicios?.content || "",
                ivaServicios: subtotales_servicios.valueObject.iva_servicios?.content || "",
                total: subtotales_servicios.valueObject.total?.content || "",
            });
        }

    });

    return result;
};






// Función para parsear la tabla de subastas
const parseTable = (table) => {
    const headers = table.cells
        .filter(cell => cell.kind === "columnHeader")
        .map(cell => cell.content);

    const rows = [];
    const rowCount = table.rowCount;

    for (let rowIndex = 1; rowIndex < rowCount; rowIndex++) {
        let row = {};
        for (let colIndex = 0; colIndex < table.columnCount; colIndex++) {
            const cell = table.cells.find(c => c.rowIndex === rowIndex && c.columnIndex === colIndex);
            row[headers[colIndex]] = cell ? cell.content : "";
        }
        rows.push(row);
    }

    return rows;
};

const parseTableSubastas = (tableSubastas) => {

}


export default function PdfExtractor() {
    const [selectedFile, setSelectedFile] = useState(null)
    const [documentType, setDocumentType] = useState("") // Para el tipo de documento
    const [isValid, setIsValid] = useState(false) // Estado de validación del documento
    const [loading, setLoading] = useState(false) // Estado de carga
    const fileInputRef = useRef(null)

    // Manejador para cuando se selecciona un archivo


    // Manejador para el botón de procesar
    const handleProcess = () => {
        if (!selectedFile || !documentType) {
            alert("Por favor, seleccione un archivo y el tipo de documento.");
            return;
        }
        // Aquí iría la lógica para procesar el documento
        console.log("Procesando documento:", selectedFile, documentType);
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

    const { data: session } = useSession();
    const [file, setFile] = useState(null);
    const [result, setResult] = useState(null);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            alert("Selecciona un archivo PDF");
            return;
        }

        setLoading(true);

        try {
            const endpoint = process.env.NEXT_PUBLIC_AZURE_DOCUMENT_AI_ENDPOINT; // Verifica que sea correcto
            const apiKey = process.env.NEXT_PUBLIC_AZURE_DOCUMENT_AI_KEY;
            const modelId = process.env.NEXT_PUBLIC_AZURE_DOCUMENT_AI_MODEL_ID;
            const apiVersion = '2023-07-31'; // Versión estable de la API '2024-11-30'

            // URL para Azure API (con la versión correcta de API)
            /* const url = `${endpoint}formrecognizer/documentModels/prebuilt-document:analyze?api-version=${apiVersion}`; */
            const url = `${endpoint}formrecognizer/documentModels/${modelId}:analyze?api-version=${apiVersion}`;
            /* const url = `${endpoint}formrecognizer/documentModels/prebuilt-document:analyze?api-version=${apiVersion}`; */


            console.log("URL de la API:", url); // Verifica la URL construida


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
            const parsedResult = parseAzureResult(analysisResult);

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

            <div className="flex h-full bg-background">
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
                                <SelectValue placeholder="Seleccionar tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="albaran">Albarán</SelectItem>
                                <SelectItem value="listado">Listado de compra</SelectItem>
                                <SelectItem value="otros">Otros</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Botón de procesar */}
                    <Button className="w-full" onClick={handleUpload}>
                        <Brain className="mr-2 h-4 w-4" />
                        Procesar con IA
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
                <div className="w-full p-6 flex flex-col">

                    <h2 className="text-2xl font-bold">Vista Previa</h2>



                    <div className="w-full h-full flex  justify-center  p-4 overflow-y-auto">
                        {result ? (
                            <div>
                                <Card className='max-w-3xl text-black bg-white'>
                                    <Card className='border-0 text-black bg-transparent'>
                                        <CardHeader>
                                            <CardTitle>Datos del Albarán</CardTitle>
                                        </CardHeader>
                                        <CardContent className="grid grid-cols-2 gap-4 text-sm">
                                            <div><strong>Nº Albarán:</strong> {result["numero"]}</div>
                                            <div><strong>Fecha:</strong> {result["fecha"]}</div>
                                            <div><strong>Ejercicio:</strong> {result["ejercicio"]}</div>
                                            <div><strong>Lonja:</strong> {result["lonja"]}</div>
                                            <div><strong>C.I.F. Lonja:</strong> {result["cif_lonja"]}</div>
                                            <div><strong>Comprador:</strong> {result["comprador"]}</div>
                                            <div><strong>C.I.F. Comprador:</strong> {result["cif_comprador"]}</div>
                                        </CardContent>
                                    </Card>

                                    <Card className='border-0 text-black bg-transparent'>
                                        <CardHeader>
                                            <CardTitle>Tabla de Subastas</CardTitle>
                                        </CardHeader>
                                        <CardContent className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Cajas</TableHead>
                                                        <TableHead>Kilos</TableHead>
                                                        <TableHead>Pescado</TableHead>
                                                        <TableHead>Cod Barco</TableHead>
                                                        <TableHead>Armador</TableHead>
                                                        <TableHead>Precio</TableHead>
                                                        <TableHead>Importe</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {result.tabla_subastas.map((row, index) => (
                                                        <TableRow key={index}>
                                                            <TableCell>{row.Cajas}</TableCell>
                                                            <TableCell>{row.Kilos}</TableCell>
                                                            <TableCell>{row.Pescado}</TableCell>
                                                            <TableCell>{row.CodBarco}</TableCell>
                                                            <TableCell>{row.Armador}</TableCell>
                                                            <TableCell>{row.Precio}</TableCell>
                                                            <TableCell>{row.Importe}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </CardContent>
                                    </Card>



                                    <Card className="border-0 text-black bg-transparent">
                                        <CardHeader>
                                            <CardTitle>Tabla de Servicios</CardTitle>
                                        </CardHeader>
                                        <CardContent className="overflow-x-auto">
                                            <Table>
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
                                                    {result.tabla_servicios.map((row, index) => (
                                                        <TableRow key={index}>
                                                            <TableCell>{row.Código}</TableCell>
                                                            <TableCell>{row.Descripción}</TableCell>
                                                            <TableCell>{row.Fecha}</TableCell>
                                                            <TableCell>{row.IVA}</TableCell>
                                                            <TableCell></TableCell>
                                                            <TableCell>{row.Unidades}</TableCell>
                                                            <TableCell>{row.Precio}</TableCell>
                                                            <TableCell>{row.Importe}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </CardContent>
                                    </Card>

                                    <div className="grid grid-cols-3 gap-4 text-sm">



                                        <Card className="border-0 text-black bg-transparent">
                                            <CardHeader>
                                                <CardTitle>Tabla de Subtotales Pesca</CardTitle>
                                            </CardHeader>
                                            <CardContent className="overflow-x-auto">
                                                <Table>
                                                    <TableBody>
                                                        {Object.entries(result.subtotales_pesca[0] || {}).map(([key, value], index) => (
                                                            <TableRow key={index}>
                                                                <TableCell>{key.replace(/([A-Z])/g, ' $1').toUpperCase()}</TableCell> 
                                                                <TableCell>{value}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </CardContent>
                                        </Card>

                                        <Card className="border-0 text-black bg-transparent">
                                            <CardHeader>
                                                <CardTitle>Tabla de Subtotales Servicios</CardTitle>
                                            </CardHeader>
                                            <CardContent className="overflow-x-auto">
                                                <Table>
                                                    <TableBody>
                                                        {Object.entries(result.subtotales_servicios[0] || {}).map(([key, value], index) => (
                                                            <TableRow key={index}>
                                                                <TableCell>{key.replace(/([A-Z])/g, ' $1').toUpperCase()}</TableCell> 
                                                                <TableCell>{value}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </CardContent>
                                        </Card>

                                        <Card className="border-0 text-black bg-transparent">
                                            <CardHeader>
                                                <CardTitle>Tabla de Subtotales Cajas</CardTitle>
                                            </CardHeader>
                                            <CardContent className="overflow-x-auto">
                                                <Table>
                                                    <TableBody>
                                                        {Object.entries(result.subtotales_cajas[0] || {}).map(([key, value], index) => (
                                                            <TableRow key={index}>
                                                                <TableCell>{key.replace(/([A-Z])/g, ' $1').toUpperCase()}</TableCell> 
                                                                <TableCell>{value}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </CardContent>
                                        </Card>

                                    </div>



                                </Card>
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center border rounded-lg bg-muted/20">
                                <p className="text-muted-foreground">Procesa un documento para ver la vista previa</p>
                            </div>
                        )}
                    </div>



                </div>
            </div>


            <div style={{ margin: "0 auto", padding: "1rem" }} className="h-full overflow-y-auto flex ">
                <div>
                    <h1>Subir PDF y extraer texto (Document AI)</h1>
                    <input type="file" accept="application/pdf" onChange={handleFileChange} />
                    <button onClick={handleUpload} disabled={!file || loading}>
                        {loading ? "Procesando..." : "Subir y extraer"}
                    </button>
                </div>

                {result && (
                    <Card className='max-w-3xl'>
                        <Card className='border-0'>
                            <CardHeader>
                                <CardTitle>Datos del Albarán</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4 text-sm">
                                <div><strong>Nº Albarán:</strong> {result["Albarán"]}</div>
                                <div><strong>Fecha:</strong> {result["Fecha:"]}</div>
                                <div><strong>Ejercicio:</strong> {result["Ejercicio:"]}</div>
                                <div><strong>Serie:</strong> {result["Serie:"]}</div>
                                <div><strong>C.I.F.:</strong> {result["C.I.F."]}</div>
                                <div><strong>Comprador:</strong> {result["Comprador:"]}</div>
                                <div><strong>C.I.F. Comprador:</strong> {result["C.I.F. :"]}</div>
                                <div><strong>Teléfono:</strong> {result["Tel:"]}</div>
                                <div><strong>Móvil:</strong> {result["Móvil:"]}</div>
                                <div><strong>Email:</strong> {result["Email:"]}</div>
                            </CardContent>
                        </Card>

                        <Card className='border-0'>
                            <CardHeader>
                                <CardTitle>Tabla de Subastas</CardTitle>
                            </CardHeader>
                            <CardContent className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Cajas</TableHead>
                                            <TableHead>Kilos</TableHead>
                                            <TableHead>Pescado</TableHead>
                                            <TableHead>Cod Barco</TableHead>
                                            <TableHead>Armador</TableHead>
                                            <TableHead>Precio</TableHead>
                                            <TableHead>Importe</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {result.tabla_subastas.map((row, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{row.Cajas}</TableCell>
                                                <TableCell>{row.Kilos}</TableCell>
                                                <TableCell>{row.Pescado}</TableCell>
                                                <TableCell>{row["Cod Barco"]}</TableCell>
                                                <TableCell>{row.Armador}</TableCell>
                                                <TableCell>{row.Precio}</TableCell>
                                                <TableCell>{row.Importe}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </Card>

                )}

            </div>
        </>
    );
}
