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

        // 1. Tomar el token (si tu app protege la ruta con auth)
        const token = session?.user?.accessToken;

        try {
            // 2. Crear formData con el PDF
            const formData = new FormData();
            formData.append("pdf", file);

            // 3. Hacer la petición a la API de Laravel que llama Document AI
            const response = await fetch(`${API_URL_V2}document-ai/parse`, {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Authorization": `Bearer ${token}`,
                    "User-Agent": navigator.userAgent
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error("Error al procesar el PDF");
            }

            // 4. Leer la respuesta JSON
            const data = await response.json();
            const parsedData = parseDocumentAIResponse(data.entities);

            // Mostrar el objeto final en consola
            console.log(parsedData);
            setResult(parsedData);
        } catch (error) {
            console.error(error);
            alert("Ocurrió un error al extraer el texto del PDF");
        } finally {
            setLoading(false);
        }
    };

    // 🛠️ Función para transformar la respuesta en el formato deseado
    const parseDocumentAIResponse = (data) => {
        const parsed = {};

        data.forEach((item) => {
            if (item.type === "tabla_subastas") {
                parsed["tabla_subastas"] = parseTablaSubastas(item.value);
            } else if (item.type === "tabla_servicios") {
                parsed["tabla_servicios"] = parseTablaServicios(item.value);
            } else {
                parsed[item.type] = item.value;
            }
        });

        return parsed;
    };

    // 🛠️ Parseo de la Tabla de Subastas
    const parseTablaSubastas = (text) => {
        if (!text) return [];

        // Dividir el texto en líneas y limpiar espacios extra
        let lines = text.split("\n").map(line => line.trim()).filter(line => line);

        /* si algun elemento es M o algun digito + M , eliminar o bien completo o bien solo dejando el digito */
        lines = lines.map(line => {
            // Si la línea contiene solo "M" => eliminarla (devolver string vacío)
            if (line.trim() === "M") {
                return "";
            }

            // Si es "1 M", "12 M", "45 M" => quedarnos solo con el número
            if (line.match(/^\d+\s+M$/)) {
                return line.replace(/\s*M$/, "");
            }

            // Si es "1M", "12M" (pegado) => separar el número
            if (line.match(/^\d+M$/)) {
                return line.replace(/M$/, "");
            }

            // Si es "M 1" => quedarnos con el número
            if (line.match(/^M\s+\d+$/)) {
                return line.replace(/^M\s+/, "");
            }

            return line; // en cualquier otro caso la dejamos igual
        });

        lines = lines.filter(line => line);

        /* quitar los 8 primeros elementos */
        lines = lines.slice(8);

        /* eliminar los ultimos 5 elementos */
        lines = lines.slice(0, -5);

        /* Crear array con un array dentro por cada 8 elementos */
        lines = lines.reduce((acc, line, index) => {
            const i = Math.floor(index / 8);
            if (!acc[i]) {
                acc[i] = [];
            }
            acc[i].push(line);
            return acc;
        }
            , []);

        /* Crear objeto con los valores de cada array */
        lines = lines.map(line => {
            const codSplit = line[3].split(" ");
            const cod = codSplit[0]; // "816"
            const barco = codSplit.slice(1).join(" ");


            return {
                cajas: line[0] || "",
                kilos: line[1] || "",
                pescado: line[2] || "",
                cod: cod || "",
                barco: barco || "",
                armador: line[4] || "",
                cif: line[5] || "",
                precio: line[6] || "",
                importe: line[7] || "",
            };
        }
        );


        console.log(lines);
        return lines;

        // Eliminar la línea que contiene "Subastas" y encabezados
        /* const headerIndex = lines.findIndex(line => line.toLowerCase().includes("subastas"));
        if (headerIndex !== -1) {
            lines = lines.slice(headerIndex + 1); // Cortar desde después de "Subastas"
        }

        // Identificar el índice de "Lineas de Venta" para ignorar totales
        const totalIndex = lines.findIndex(line => line.toLowerCase().includes("lineas de venta"));
        if (totalIndex !== -1) {
            lines = lines.slice(0, totalIndex); // Cortar hasta antes de "Lineas de Venta"
        }

        let parsedRows = [];
        let tempRow = [];

        lines.forEach(line => {
            const values = line.split(/\s+/);

            // Si el primer valor de la fila es un número seguido de "M", eliminamos la "M"
            if (values[0].match(/^\d+M$/)) {
                values[0] = values[0].replace("M", ""); // Se queda solo el número
            }

            tempRow = tempRow.concat(values); // Agregar los valores a la fila temporal

            if (tempRow.length >= 7) {
                // Si la fila tiene al menos 7 elementos, la agregamos y reiniciamos tempRow
                parsedRows.push(tempRow.slice(0, 7)); // Tomamos solo los primeros 7 valores
                tempRow = tempRow.slice(7); // Si hay valores sobrantes, se mantienen en tempRow
            }
        });

        // Mapeamos las filas al objeto final con los nombres correctos
        return parsedRows.map(row => ({
            Cajas: row[0] || "",
            Kilos: row[1] || "",
            Pescado: row[2] || "",
            CodBarco: row[3] || "",
            Armador: row.slice(4, row.length - 2).join(" ") || "", // Unir el nombre del armador
            Precio: row[row.length - 2] || "",
            Importe: row[row.length - 1] || "",
        })); */
    };



    // 🛠️ Parseo de la Tabla de Servicios
    const parseTablaServicios = (text) => {
        if (!text) return [];

        // Dividir el texto en líneas y limpiar espacios extra
        let lines = text.split("\n").map(line => line.trim()).filter(line => line);

        /* si algun elemento es M o algun digito + M , eliminar o bien completo o bien solo dejando el digito */
        lines = lines.map(line => {
            // Si la línea contiene solo "M" => eliminarla (devolver string vacío)
            if (line.trim() === "M") {
                return "";
            }

            // Si es "1 M", "12 M", "45 M" => quedarnos solo con el número
            if (line.match(/^\d+\s+M$/)) {
                return line.replace(/\s*M$/, "");
            }

            // Si es "1M", "12M" (pegado) => separar el número
            if (line.match(/^\d+M$/)) {
                return line.replace(/M$/, "");
            }

            // Si es "M 1" => quedarnos con el número
            if (line.match(/^M\s+\d+$/)) {
                return line.replace(/^M\s+/, "");
            }

            return line; // en cualquier otro caso la dejamos igual
        });

        lines = lines.filter(line => line);

        /* quitar los 8 primeros elementos */
        lines = lines.slice(8);

        /* eliminar los ultimos 5 elementos */
        lines = lines.slice(0, -5);

        /* Crear array con un array dentro por cada 8 elementos */
        lines = lines.reduce((acc, line, index) => {
            const i = Math.floor(index / 8);
            if (!acc[i]) {
                acc[i] = [];
            }
            acc[i].push(line);
            return acc;
        }
            , []);

        /* Crear objeto con los valores de cada array */
        lines = lines.map(line => {
            const codSplit = line[3].split(" ");
            const cod = codSplit[0]; // "816"
            const barco = codSplit.slice(1).join(" ");


            return {
                cajas: line[0] || "",
                kilos: line[1] || "",
                pescado: line[2] || "",
                cod: cod || "",
                barco: barco || "",
                armador: line[4] || "",
                cif: line[5] || "",
                precio: line[6] || "",
                importe: line[7] || "",
            };
        }
        );


        console.log(lines);
        return lines;

        // Eliminar la línea que contiene "Subastas" y encabezados
        /* const headerIndex = lines.findIndex(line => line.toLowerCase().includes("subastas"));
        if (headerIndex !== -1) {
            lines = lines.slice(headerIndex + 1); // Cortar desde después de "Subastas"
        }

        // Identificar el índice de "Lineas de Venta" para ignorar totales
        const totalIndex = lines.findIndex(line => line.toLowerCase().includes("lineas de venta"));
        if (totalIndex !== -1) {
            lines = lines.slice(0, totalIndex); // Cortar hasta antes de "Lineas de Venta"
        }

        let parsedRows = [];
        let tempRow = [];

        lines.forEach(line => {
            const values = line.split(/\s+/);

            // Si el primer valor de la fila es un número seguido de "M", eliminamos la "M"
            if (values[0].match(/^\d+M$/)) {
                values[0] = values[0].replace("M", ""); // Se queda solo el número
            }

            tempRow = tempRow.concat(values); // Agregar los valores a la fila temporal

            if (tempRow.length >= 7) {
                // Si la fila tiene al menos 7 elementos, la agregamos y reiniciamos tempRow
                parsedRows.push(tempRow.slice(0, 7)); // Tomamos solo los primeros 7 valores
                tempRow = tempRow.slice(7); // Si hay valores sobrantes, se mantienen en tempRow
            }
        });

        // Mapeamos las filas al objeto final con los nombres correctos
        return parsedRows.map(row => ({
            Cajas: row[0] || "",
            Kilos: row[1] || "",
            Pescado: row[2] || "",
            CodBarco: row[3] || "",
            Armador: row.slice(4, row.length - 2).join(" ") || "", // Unir el nombre del armador
            Precio: row[row.length - 2] || "",
            Importe: row[row.length - 1] || "",
        })); */
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
