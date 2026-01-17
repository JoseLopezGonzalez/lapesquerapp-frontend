import { NextResponse } from 'next/server';
import { API_URL_V2 } from '@/configs/config';
import { fetchWithTenant } from "@lib/fetchWithTenant";

export async function POST(req) {
    try {
        // Leer el body de la solicitud
        const body = await req.json();
        // console.log("📥 Datos recibidos en la API Route:", body);

        // Validar que 'endpoint' y 'data' están presentes
        if (!body.endpoint || !body.data) {
            console.error("❌ Faltan el 'endpoint' o los 'data' en la solicitud.");
            return NextResponse.json({ error: "Endpoint o datos faltantes." }, { status: 400 });
        }

        // Obtener el User-Agent del cliente
        const userAgent = req.headers.get('user-agent');
        const authorization = req.headers.get('authorization');

        // Hacer la solicitud al backend (Laravel)
        // console.log(`🌐 Enviando datos a: ${API_URL_V2}${body.endpoint}`);
        // console.log("📦 Datos enviados:", body.data);

        const apiResponse = await fetchWithTenant(`${API_URL_V2}${body.endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authorization,  // Token de autenticación
                'User-Agent': userAgent,  // User-Agent del cliente
                'Accept': 'application/json'
            },
            body: JSON.stringify(body.data),
        });

        // console.log("🔄 Esperando respuesta del backend...");

        const contentType = apiResponse.headers.get('content-type');

        if (contentType && contentType.includes('application/json')) {
            const responseData = await apiResponse.json();
            // console.log("📤 Respuesta del backend (JSON):", responseData);

            if (!apiResponse.ok) {
                console.error('❌ Error al enviar al backend:', responseData);
                // Extraer userMessage si está disponible
                const errorMessage = getErrorMessage(responseData);
                return NextResponse.json({ 
                    error: responseData,
                    message: errorMessage 
                }, { status: apiResponse.status });
            }

            return NextResponse.json({ success: true, data: responseData }, { status: 200 });
        } else {
            const responseText = await apiResponse.text();
            console.error('❌ Respuesta no JSON del backend:', responseText);

            return NextResponse.json({ error: "La respuesta no es JSON", details: responseText }, { status: 500 });
        }
    } catch (error) {
        console.error("❌ Error en la API Route:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
