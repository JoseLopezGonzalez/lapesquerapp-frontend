"use client";

import { API_URL_V2 } from "@/configs/config";
import { useSession } from "next-auth/react";
import { useState } from "react";

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


export default function PdfExtractor() {
    const { data: session } = useSession();
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
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
            const endpoint = process.env.NEXT_PUBLIC_AZURE_DOCUMENT_AI_ENDPOINT;
            const apiKey = process.env.NEXT_PUBLIC_AZURE_DOCUMENT_AI_KEY;
            const apiVersion = '2023-07-31';

            // URL para Azure API
            const url = `${endpoint}formrecognizer/documentModels/prebuilt-document:analyze?api-version=${apiVersion}`;

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
            /* setResult(analysisResult); */ // Guardar resultado en estado

        } catch (error) {
            console.error("Error al procesar el PDF:", error);
            alert("Ocurrió un error: " + error.message);
        } finally {
            setLoading(false);
        }
    };





    return (
        <div style={{ margin: "0 auto", padding: "1rem" }}>
            <h1>Subir PDF y extraer texto (Document AI)</h1>
            <input type="file" accept="application/pdf" onChange={handleFileChange} />
            <button onClick={handleUpload} disabled={!file || loading}>
                {loading ? "Procesando..." : "Subir y extraer"}
            </button>



            {result && (
                <div className="max-w-5xl mx-auto mt-8 space-y-6">
                    {/* 🧾 Datos generales */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Datos del Albarán</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4 text-sm">
                            <div><strong>Nº Albarán:</strong> {result.numero_albaran}</div>
                            <div><strong>Fecha:</strong> {result.fecha_albaran}</div>
                            <div><strong>Ejercicio:</strong> {result.ejercicio_albaran}</div>
                            <div><strong>Importe Total:</strong> {result.importe_total}</div>
                            <div><strong>Lonja:</strong> {result.razon_social_lonja}</div>
                            <div><strong>CIF Lonja:</strong> {result.cif_lonja}</div>
                            <div><strong>Comprador:</strong> {result.razon_social_comprador}</div>
                            <div><strong>CIF Comprador:</strong> {result.cif_comprador}</div>
                        </CardContent>
                    </Card>

                    {/* 📊 Tabla de subastas */}
                    <Card>
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
                                        <TableHead>Cod</TableHead>
                                        <TableHead>Barco</TableHead>
                                        <TableHead>Armador</TableHead>
                                        <TableHead>CIF</TableHead>
                                        <TableHead>Precio</TableHead>
                                        <TableHead>Importe</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {result.tabla_subastas.map((row, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{row.cajas}</TableCell>
                                            <TableCell>{row.kilos}</TableCell>
                                            <TableCell>{row.pescado}</TableCell>
                                            <TableCell>{row.cod}</TableCell>
                                            <TableCell>{row.barco}</TableCell>
                                            <TableCell>{row.armador}</TableCell>
                                            <TableCell>{row.cif}</TableCell>
                                            <TableCell>{row.precio}</TableCell>
                                            <TableCell>{row.importe}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            )}

        </div>
    );
}
