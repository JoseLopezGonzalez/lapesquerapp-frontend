/**
 * Servicios genéricos para entidades
 * 
 * ESTOS SERVICIOS SON PRIVADOS - Solo deben usarse dentro de services de dominio
 * Los componentes NUNCA deben importar o usar estos servicios directamente
 * 
 * Para uso público, usar los services de dominio específicos (ej: supplierService, productCategoryService)
 */

import { fetchWithTenant } from '@lib/fetchWithTenant';
import { getAuthToken } from '@/lib/auth/getAuthToken';
import { getErrorMessage } from '@/lib/api/apiHelpers';
import { getUserAgent } from '@/lib/utils/getUserAgent';

/**
 * Obtiene headers de autenticación
 * @private
 */
const getAuthHeaders = async (token) => {
    if (!token) {
        token = await getAuthToken();
    }
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'User-Agent': getUserAgent(), // ✅ Compatible con cliente y servidor
    };
};

/**
 * Obtiene entidades desde una URL
 * @param {string} url - URL completa del endpoint
 * @param {string} [token] - Token de autenticación (opcional, se obtiene automáticamente si no se proporciona)
 * @returns {Promise<Object>} Respuesta del API con datos paginados
 * @private
 */
export const fetchEntitiesGeneric = async (url, token = null) => {
    // DEBUG: Verificar URL antes de la petición
    const hasWithParam = url.includes('with');
    
    const headers = await getAuthHeaders(token);
    const response = await fetchWithTenant(url, {
        method: 'GET',
        headers: headers,
    });
    if (!response.ok) {
        throw response;
    }
    const data = await response.json();
    
    // DEBUG: Verificar respuesta
    if (typeof window !== 'undefined' && data?.data?.length > 0) {
        const firstItem = data.data[0];
        const relationKeys = Object.keys(firstItem).filter(key => {
            const value = firstItem[key];
            return typeof value === 'object' && 
                   value !== null && 
                   !Array.isArray(value) && 
                   value.id !== undefined &&
                   !(value instanceof Date);
        });
        
        // Log crítico - siempre mostrar
        window.console?.warn?.('🔍 [fetchEntitiesGeneric] DEBUG INFO:', {
            url: url.substring(0, 200), // Limitar longitud
            hasWithParam,
            relationKeysFound: relationKeys,
            sampleItem: Object.keys(firstItem).slice(0, 10)
        });
        
        if (hasWithParam && relationKeys.length === 0) {
            window.console?.error?.('❌ PROBLEMA DETECTADO: URL tiene with[] pero respuesta NO tiene relaciones');
        }
    }
    
    return data;
};

/**
 * Elimina una entidad
 * @param {string} url - URL completa del endpoint
 * @param {Object} [body] - Body opcional para la petición DELETE
 * @param {string} [token] - Token de autenticación (opcional)
 * @returns {Promise<Object>} Respuesta con datos
 * @private
 */
export const deleteEntityGeneric = async (url, body = null, token = null) => {
    const headers = await getAuthHeaders(token);
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
    const data = await response.json();
    return { response, data };
};

/**
 * Ejecuta una acción genérica (POST, PUT, etc.)
 * @param {string} url - URL completa del endpoint
 * @param {string} method - Método HTTP (POST, PUT, etc.)
 * @param {Object} body - Body de la petición
 * @param {string} [token] - Token de autenticación (opcional)
 * @returns {Promise<Response>} Respuesta de la petición
 * @private
 */
export const performActionGeneric = async (url, method, body, token = null) => {
    const headers = await getAuthHeaders(token);
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
 * Descarga un archivo (PDF, Excel, etc.)
 * @param {string} url - URL completa del endpoint
 * @param {string} fileName - Nombre del archivo sin extensión
 * @param {string} type - Tipo de archivo ('pdf', 'excel', 'xlsx')
 * @param {string} [token] - Token de autenticación (opcional)
 * @returns {Promise<boolean>} true si la descarga fue exitosa
 * @private
 */
export const downloadFileGeneric = async (url, fileName, type, token = null) => {
    const headers = await getAuthHeaders(token);

    const now = new Date();
    const formattedDate = now.toLocaleDateString().replace(/\//g, '-');
    const formattedTime = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    const currentDateTime = `${formattedDate}__${formattedTime}`;

    try {
        const response = await fetchWithTenant(url, {
            method: 'GET',
            headers: headers,
        });

        if (!response.ok) {
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

