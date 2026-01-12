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
            const errorMessage = errorData.userMessage || errorData.message || errorData.error || `Error en la petición: ${response.statusText}`;
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
        throw new ApiError(
            error.message || 'Error de conexión',
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

