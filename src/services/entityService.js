import { fetchWithTenant } from '@lib/fetchWithTenant';
import { getSession } from 'next-auth/react';
import { getErrorMessage } from '@/lib/api/apiHelpers';
import { getUserAgent } from '@/lib/utils/getUserAgent';

const getAuthHeaders = async () => {
    const session = await getSession();
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.user?.accessToken}`,
        'User-Agent': getUserAgent(), // ✅ Compatible con cliente y servidor
    };
};

export const fetchEntities = async (url) => {
    const headers = await getAuthHeaders();
    const response = await fetchWithTenant(url, {
        method: 'GET',
        headers: headers,
    });
    if (!response.ok) {
        // You might want to throw the full response to access status for more granular error handling
        throw response;
    }
    return await response.json();
};

export const deleteEntity = async (url, body = null) => {
    const headers = await getAuthHeaders();
    const options = {
        method: 'DELETE',
        headers: headers,
    };
    if (body) {
        options.body = JSON.stringify(body);
    }
    const response = await fetchWithTenant(url, options);
    if (!response.ok) {
        throw response;
    }
    // Retornar tanto la respuesta como el JSON parseado para acceder al mensaje
    const data = await response.json();
    return { response, data };
};

export const performAction = async (url, method, body) => {
    const headers = await getAuthHeaders();
    const response = await fetchWithTenant(url, {
        method: method,
        headers: headers,
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        throw response;
    }
    return response;
};


export const downloadFile = async (url, fileName, type) => {
    const headers = await getAuthHeaders();

    const now = new Date();

    const formattedDate = now.toLocaleDateString().replace(/\//g, '-'); // Ej: 05-08-2025
    const formattedTime = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // "12-34-56"

    const currentDateTime = `${formattedDate}__${formattedTime}`;

    try {
        const response = await fetchWithTenant(url, {
            method: 'GET',
            headers: headers,
        });

        // Verificar si la respuesta es exitosa
        if (!response.ok) {
            // Intentar obtener el error como JSON primero
            let errorData = null;
            let errorText = null;
            
            try {
                // Clonar la respuesta para poder leer el body
                const responseClone = response.clone();
                errorData = await responseClone.json();
            } catch (jsonError) {
                // Si no es JSON, intentar leer como texto
                try {
                    const responseClone = response.clone();
                    errorText = await responseClone.text();
                } catch (textError) {
                    errorText = 'No se pudo leer el contenido del error';
                }
            }

            // Crear un objeto de error más detallado
            const errorMessage = errorData ? getErrorMessage(errorData) : (errorText || `Error HTTP ${response.status}: ${response.statusText}`);
            const detailedError = {
                type: 'HTTP_ERROR',
                status: response.status,
                statusText: response.statusText,
                url: url,
                data: errorData,
                text: errorText,
                message: errorMessage
            };

            console.error("Error durante la descarga del archivo:", detailedError);
            throw detailedError;
        }

        // Si la respuesta es exitosa, proceder con la descarga
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `${fileName}__${currentDateTime}.${type === 'excel' ? 'xls' : type === 'xlsx' ? 'xlsx' : 'pdf'}`; // Dynamic file extension
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
        return true; // Indicate success
    } catch (error) {
        // Determinar el tipo de error
        let errorType = 'UNKNOWN';
        let errorMessage = 'Error desconocido durante la descarga del archivo';
        
        if (error.type === 'HTTP_ERROR') {
            errorType = 'HTTP_ERROR';
            errorMessage = error.message;
        } else if (error.name === 'TypeError' && error.message.includes('body stream already read')) {
            errorType = 'STREAM_READ_ERROR';
            errorMessage = 'Error: El stream de respuesta ya fue leído';
        } else if (error.name === 'TypeError') {
            errorType = 'TYPE_ERROR';
            errorMessage = `Error de tipo: ${error.message}`;
        } else if (error.name === 'NetworkError') {
            errorType = 'NETWORK_ERROR';
            errorMessage = 'Error de red durante la descarga';
        } else if (error.name === 'AbortError') {
            errorType = 'ABORT_ERROR';
            errorMessage = 'La descarga fue cancelada';
        }

        const detailedError = {
            type: errorType,
            message: errorMessage,
            originalError: error,
            url: url,
            fileName: fileName,
            fileType: type
        };

        console.error("Error durante la descarga del archivo:", detailedError);
        throw detailedError; // Re-throw para que sea capturado por el componente
    }
};