/**
 * Helpers genéricos para peticiones API
 * Abstrae el manejo común de errores y transformación de respuestas
 */

import { fetchWithTenant } from '@/lib/fetchWithTenant'

/**
 * Clase de error personalizada para errores de API
 */
export class ApiError extends Error {
    constructor(message, status, data = null) {
        super(message)
        this.name = 'ApiError'
        this.status = status
        this.data = data
    }
}

/**
 * Verifica si hay un logout en curso
 * @returns {boolean} true si hay un logout en curso
 */
export const isLoggingOut = () => {
    if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
        return false;
    }
    return sessionStorage.getItem('__is_logging_out__') === 'true';
};

/**
 * Maneja una respuesta de fetch verificando si hay logout en curso
 * Si hay logout en curso, retorna un valor por defecto en lugar de lanzar error
 * @param {Response} response - Respuesta de fetch
 * @param {any} defaultValue - Valor por defecto a retornar si hay logout en curso
 * @param {string} errorMessage - Mensaje de error por defecto
 * @returns {Promise<any>} Datos de la respuesta o valor por defecto
 */
export const handleServiceResponse = async (response, defaultValue = null, errorMessage = 'Error en la petición') => {
    if (!response.ok) {
        // Si hay un logout en curso, no lanzar error
        if (isLoggingOut()) {
            return defaultValue;
        }
        
        // Intentar obtener el mensaje de error
        let errorData = null;
        try {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                errorData = await response.json();
            } else {
                errorData = { message: await response.text() };
            }
        } catch (e) {
            errorData = { message: `Error ${response.status}: ${response.statusText}` };
        }
        
        throw new Error(getErrorMessage(errorData) || errorMessage);
    }
    
    // Si es JSON, parsear y retornar
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return await response.json();
    }
    
    return response;
};

/**
 * Extrae el mensaje de error priorizando userMessage sobre message
 * @param {Object} errorData - Datos del error de la API
 * @returns {string} Mensaje de error para mostrar al usuario
 */
export const getErrorMessage = (errorData) => {
    if (!errorData) return 'Error desconocido';
    return errorData.userMessage || errorData.message || errorData.error || 'Error desconocido';
};

/**
 * Realiza una petición API con manejo de errores unificado
 * @param {string} url - URL de la petición
 * @param {object} options - Opciones de fetch (method, headers, body, etc.)
 * @param {object} config - Configuración adicional
 * @param {boolean} config.returnFullResponse - Si es true, retorna la respuesta completa
 * @param {Function} config.transform - Función para transformar la respuesta
 * @returns {Promise<any>} - Respuesta de la API
 */
export const apiRequest = async (url, options = {}, config = {}) => {
    const {
        returnFullResponse = false,
        transform = null,
    } = config

    try {
        const response = await fetchWithTenant(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': navigator.userAgent,
                ...options.headers,
            },
        })

        // Manejar respuestas que no son JSON (como archivos)
        const contentType = response.headers.get('content-type')
        const isJson = contentType && contentType.includes('application/json')

        if (!response.ok) {
            // Si hay un logout en curso, no lanzar error
            if (isLoggingOut()) {
                console.log('ℹ️ Logout en curso: ignorando error en apiRequest');
                // Retornar un valor por defecto según el tipo de respuesta esperado
                return isJson ? {} : null;
            }
            
            let errorData = null
            try {
                if (isJson) {
                    errorData = await response.json()
                } else {
                    errorData = { message: await response.text() }
                }
            } catch (e) {
                errorData = { message: `Error ${response.status}: ${response.statusText}` }
            }

            // Priorizar userMessage sobre message para mostrar errores en formato natural
            const errorMessage = getErrorMessage(errorData) || `Error en la petición: ${response.statusText}`;
            throw new ApiError(
                errorMessage,
                response.status,
                errorData
            )
        }

        // Si no es JSON, retornar la respuesta directamente
        if (!isJson) {
            return returnFullResponse ? response : await response.blob()
        }

        const data = await response.json()

        // Aplicar transformación si existe
        if (transform && typeof transform === 'function') {
            return transform(data)
        }

        // Si se solicita la respuesta completa, retornarla
        if (returnFullResponse) {
            return { response, data }
        }

        return data
    } catch (error) {
        // Si ya es un ApiError, re-lanzarlo
        if (error instanceof ApiError) {
            throw error
        }

        // Si es un error de red u otro tipo, envolverlo
        // Priorizar userMessage sobre message para mostrar errores en formato natural
        const errorMessage = error.userMessage || error.data?.userMessage || error.response?.data?.userMessage || error.message || 'Error de conexión';
        throw new ApiError(
            errorMessage,
            error.status || 0,
            error
        )
    }
}

/**
 * Realiza una petición GET
 * @param {string} url - URL de la petición
 * @param {string} token - Token de autenticación
 * @param {object} params - Parámetros de consulta
 * @param {object} config - Configuración adicional
 * @returns {Promise<any>} - Respuesta de la API
 */
export const apiGet = async (url, token, params = {}, config = {}) => {
    // Construir URLSearchParams manualmente para manejar arrays con corchetes
    const queryParams = new URLSearchParams()
    Object.keys(params).forEach(key => {
        const value = params[key]
        if (Array.isArray(value)) {
            // Para arrays, añadir cada elemento con corchetes
            value.forEach(item => {
                queryParams.append(`${key}[]`, item)
            })
        } else if (value !== null && value !== undefined) {
            queryParams.append(key, value)
        }
    })
    const queryString = queryParams.toString()
    const fullUrl = queryString ? `${url}?${queryString}` : url

    return apiRequest(fullUrl, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    }, config)
}

/**
 * Realiza una petición POST
 * @param {string} url - URL de la petición
 * @param {string} token - Token de autenticación
 * @param {object} body - Cuerpo de la petición
 * @param {object} config - Configuración adicional
 * @returns {Promise<any>} - Respuesta de la API
 */
export const apiPost = async (url, token, body, config = {}) => {
    return apiRequest(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
    }, config)
}

/**
 * Realiza una petición PUT
 * @param {string} url - URL de la petición
 * @param {string} token - Token de autenticación
 * @param {object} body - Cuerpo de la petición
 * @param {object} config - Configuración adicional
 * @returns {Promise<any>} - Respuesta de la API
 */
export const apiPut = async (url, token, body, config = {}) => {
    return apiRequest(url, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
    }, config)
}

/**
 * Realiza una petición DELETE
 * @param {string} url - URL de la petición
 * @param {string} token - Token de autenticación
 * @param {object} config - Configuración adicional
 * @returns {Promise<any>} - Respuesta de la API
 */
export const apiDelete = async (url, token, config = {}) => {
    return apiRequest(url, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    }, config)
}

/**
 * Realiza una petición POST con FormData (para uploads)
 * @param {string} url - URL de la petición
 * @param {string} token - Token de autenticación
 * @param {FormData} formData - FormData con los archivos
 * @param {object} config - Configuración adicional
 * @returns {Promise<any>} - Respuesta de la API
 */
export const apiPostFormData = async (url, token, formData, config = {}) => {
    return apiRequest(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            // No incluir Content-Type, el navegador lo establecerá con el boundary
        },
        body: formData,
    }, {
        ...config,
        returnFullResponse: false,
    })
}

