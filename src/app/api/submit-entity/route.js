import { NextResponse } from 'next/server';
import { API_URL_V2 } from '@/configs/config';
import { getSession } from 'next-auth/react';

export async function POST(req) {
    try {
        // Paso 1: Asegúrate de que la solicitud llega correctamente
        const body = await req.json();
        console.log("📥 Datos recibidos en la API Route:", body);

        // Paso 2: Validar que el endpoint y los datos existen
        if (!body.endpoint || !body.data) {
            console.error("❌ Faltan el 'endpoint' o los 'data' en la solicitud.");
            return NextResponse.json({ error: "Endpoint o datos faltantes." }, { status: 400 });
        }

        // Paso 3: Hacer la solicitud al backend (Laravel)
        console.log(`🌐 Enviando datos a: ${API_URL_V2}${body.endpoint}`);
        console.log("📦 Datos enviados:", body.data);

         // Obtener sesión actual

        /* ${API_URL_V2}/${body.endpoint} */
        const apiResponse = await fetch(`https://api.congeladosbrisamar.es/api/v1/productions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                /* Authorization: `Bearer ${session?.user?.accessToken}`, */ // Enviar el token
                /*  'User-Agent': navigator.userAgent, */  // Incluye el User-Agent del cliente
                'Accept': 'application/json'  // <- Este es el header que necesitas

            },
            body: JSON.stringify(body.data),
        });

        console.log("🔄 Esperando respuesta del backend...", apiResponse);

        const contentType = apiResponse.headers.get('content-type');

        if (contentType && contentType.includes('application/json')) {
            const responseData = await apiResponse.json();
            console.log("📤 Respuesta del backend (JSON):", responseData);

            if (!apiResponse.ok) {
                console.error('❌ Error al enviar al backend:', responseData);
                return NextResponse.json({ error: responseData }, { status: apiResponse.status });
            }

            return NextResponse.json({ success: true, data: responseData }, { status: 200 });
        } else {
            const responseText = await apiResponse.text();
            console.error('❌ Respuesta no JSON del backend:', responseText);

            return NextResponse.json({ error: "La respuesta no es JSON", details: responseText }, { status: 500 });
        }


    }
    catch (error) {
        console.error("❌ Error en la API Route:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


