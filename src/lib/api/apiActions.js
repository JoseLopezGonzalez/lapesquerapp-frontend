/**
 * Utilidades genéricas para acciones API y descargas
 * 
 * Estas funciones son genéricas y no específicas de entidades.
 * Se usan para acciones personalizadas y descargas de archivos.
 * 
 * NOTA: Estas funciones no son servicios de dominio porque:
 * - No están vinculadas a una entidad específica
 * - Se pueden usar con cualquier endpoint
 * - Son utilidades de bajo nivel para casos especiales
 */

import { fetchWithTenant } from '@lib/fetchWithTenant';
import { getSession } from 'next-auth/react';
import { getErrorMessage } from './apiHelpers';

/**
 * Obtiene headers de autenticación
 * @private
 */
const getAuthHeaders = async () => {
    const session = await getSession();
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.user?.accessToken}`,
        'User-Agent': navigator.userAgent,
    };
};

/**
 * Ejecuta una acción genérica en un endpoint
 * @param {string} url - URL completa del endpoint
 * @param {string} method - Método HTTP (POST, PUT, PATCH, etc.)
 * @param {Object} body - Cuerpo de la petición
 * @returns {Promise<Response>} Respuesta de la petición
 * 
 * @example
 * await performAction(`${API_URL_V2}orders/123/status`, 'PUT', { status: 'completed' });
 */
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

/**
 * Descarga un archivo desde una URL
 * @param {string} url - URL completa del endpoint de descarga
 * @param {string} fileName - Nombre base del archivo (sin extensión)
 * @param {string} type - Tipo de archivo ('pdf', 'excel', 'xlsx')
 * @returns {Promise<boolean>} True si la descarga fue exitosa
 * 
 * @example
 * await downloadFile(`${API_URL_V2}exports/orders`, 'reporte_pedidos', 'pdf');
 */
export const downloadFile = async (url, fileName, type) => {
    const headers = await getAuthHeaders();

    const now = new Date();
    const formattedDate = now.toLocaleDateString().replace(/\//g, '-');
    const formattedTime = now.toTimeString().split(' ')[0].replace(/:/g, '-');
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
                const responseClone = response.clone();
                errorData = await responseClone.json();
            } catch (jsonError) {
                try {
                    const responseClone = response.clone();
                    errorText = await responseClone.text();
                } catch (textError) {
                    errorText = 'No se pudo leer el contenido del error';
                }
            }

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
        a.download = `${fileName}__${currentDateTime}.${type === 'excel' ? 'xls' : type === 'xlsx' ? 'xlsx' : 'pdf'}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
        return true;
    } catch (error) {
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
        throw detailedError;
    }
};

