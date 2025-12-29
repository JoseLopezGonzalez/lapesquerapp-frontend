import { apiGet, apiPost, apiPut, apiDelete, apiPostFormData, apiRequest } from "@/lib/api/apiHelpers";
import { API_URL_V2 } from "@/configs/config";
import {
    normalizeProductionRecord,
    normalizeProductionRecordsResponse,
    normalizeProductionRecordResponse,
    normalizeProduction,
    normalizeProductionInput,
    normalizeProductionOutput,
    normalizeProductionOutputConsumption,
} from "@/helpers/production/normalizers";

/**
 * Obtiene todas las producciones
 * @param {string} token - Token de autenticación
 * @param {object} params - Parámetros de consulta (filtros, paginación, etc.)
 * @returns {Promise<Object>} - Lista de producciones
 */
export function getProductions(token, params = {}) {
    return apiGet(`${API_URL_V2}productions`, token, params)
}

/**
 * Obtiene una producción por ID
 * @param {string|number} productionId - ID de la producción
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Datos de la producción
 */
export function getProduction(productionId, token) {
    return apiGet(`${API_URL_V2}productions/${productionId}`, token, {}, {
        transform: (data) => {
            const production = data.data || data;
            return normalizeProduction(production);
        }
    })
}

/**
 * Crea una nueva producción
 * @param {Object} productionData - Datos de la producción
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Producción creada
 */
export function createProduction(productionData, token) {
    return apiPost(`${API_URL_V2}productions`, token, productionData)
}

/**
 * Actualiza una producción
 * @param {string|number} productionId - ID de la producción
 * @param {Object} productionData - Datos actualizados
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Producción actualizada
 */
export function updateProduction(productionId, productionData, token) {
    return apiPut(`${API_URL_V2}productions/${productionId}`, token, productionData)
}

/**
 * Elimina una producción
 * @param {string|number} productionId - ID de la producción
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export function deleteProduction(productionId, token) {
    return apiDelete(`${API_URL_V2}productions/${productionId}`, token)
}

/**
 * Obtiene el diagrama calculado de una producción
 * @param {string|number} productionId - ID de la producción
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Diagrama calculado
 */
export function getProductionDiagram(productionId, token) {
    return apiGet(`${API_URL_V2}productions/${productionId}/diagram`, token, {}, {
        transform: (data) => data.data || data
    })
}

/**
 * Obtiene el árbol de procesos de una producción
 * @param {string|number} productionId - ID de la producción
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Árbol de procesos
 */
export function getProductionProcessTree(productionId, token) {
    return apiGet(`${API_URL_V2}productions/${productionId}/process-tree`, token, {}, {
        transform: (data) => data.data || data
    })
}

/**
 * Obtiene los totales globales de una producción
 * @param {string|number} productionId - ID de la producción
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Totales globales
 */
export function getProductionTotals(productionId, token) {
    return apiGet(`${API_URL_V2}productions/${productionId}/totals`, token, {}, {
        transform: (data) => data.data || data
    })
}

/**
 * Obtiene la conciliación de una producción
 * @param {string|number} productionId - ID de la producción
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Datos de conciliación
 */
export function getProductionReconciliation(productionId, token) {
    return apiGet(`${API_URL_V2}productions/${productionId}/reconciliation`, token, {}, {
        transform: (data) => data.data || data
    })
}

/**
 * Obtiene los productos disponibles para salidas de una producción
 * @param {string|number} productionId - ID de la producción
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Lista de productos disponibles con cajas y pesos
 */
export function getAvailableProductsForOutputs(productionId, token) {
    return apiGet(`${API_URL_V2}productions/${productionId}/available-products-for-outputs`, token, {}, {
        transform: (data) => data.data || data || []
    })
}

// ==================== PRODUCTION RECORDS ====================

/**
 * Obtiene todos los production records
 * @param {string} token - Token de autenticación
 * @param {object} params - Parámetros de consulta
 * @returns {Promise<Object>} - Lista de production records
 */
export function getProductionRecords(token, params = {}) {
    return apiGet(`${API_URL_V2}production-records`, token, params, {
        transform: normalizeProductionRecordsResponse
    })
}

/**
 * Obtiene los production records en formato minimal para selects (opciones)
 * @param {string} token - Token de autenticación
 * @param {number} productionId - ID de la producción
 * @param {number|null} excludeId - ID del record a excluir (opcional)
 * @returns {Promise<Array>} - Lista de records en formato minimal
 */
export function getProductionRecordsOptions(token, productionId, excludeId = null) {
    const params = { production_id: productionId }
    if (excludeId) {
        params.exclude_id = excludeId
    }
    return apiGet(`${API_URL_V2}production-records/options`, token, params, {
        transform: (data) => data.data || data || []
    })
}

/**
 * Obtiene un production record por ID
 * @param {string|number} recordId - ID del record
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Datos del record
 */
export function getProductionRecord(recordId, token) {
    return apiGet(`${API_URL_V2}production-records/${recordId}`, token, {}, {
        transform: normalizeProductionRecordResponse
    })
}

/**
 * Obtiene los datos de sources disponibles para un production record
 * Incluye stock boxes y parent outputs con toda su información
 * @param {string|number} recordId - ID del record
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Datos de sources disponibles
 */
export function getProductionRecordSourcesData(recordId, token) {
    return apiGet(`${API_URL_V2}production-records/${recordId}/sources-data`, token, {}, {
        transform: (data) => {
            // La respuesta ya viene estructurada, solo retornarla
            return data.data || data
        }
    })
}


/**
 * Crea un nuevo production record
 * @param {Object} recordData - Datos del record
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Record creado
 */
export function createProductionRecord(recordData, token) {
    return apiPost(`${API_URL_V2}production-records`, token, recordData, {
        transform: (data) => {
            const record = data.data || data;
            return {
                ...data,
                data: normalizeProductionRecord(record)
            };
        }
    })
}

/**
 * Actualiza un production record
 * @param {string|number} recordId - ID del record
 * @param {Object} recordData - Datos actualizados
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Record actualizado
 */
export function updateProductionRecord(recordId, recordData, token) {
    return apiPut(`${API_URL_V2}production-records/${recordId}`, token, recordData, {
        transform: (data) => {
            const record = data.data || data;
            return {
                ...data,
                data: normalizeProductionRecord(record)
            };
        }
    })
}

/**
 * Elimina un production record
 * @param {string|number} recordId - ID del record
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export function deleteProductionRecord(recordId, token) {
    return apiDelete(`${API_URL_V2}production-records/${recordId}`, token)
}

/**
 * Finaliza un production record
 * @param {string|number} recordId - ID del record
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Record finalizado
 */
export function finishProductionRecord(recordId, token) {
    return apiPost(`${API_URL_V2}production-records/${recordId}/finish`, token, {}, {
        transform: (data) => {
            const record = data.data || data;
            return {
                ...data,
                data: normalizeProductionRecord(record)
            };
        }
    })
}

// ==================== PRODUCTION INPUTS ====================

/**
 * Obtiene todos los production inputs
 * @param {string} token - Token de autenticación
 * @param {object} params - Parámetros de consulta
 * @returns {Promise<Object>} - Lista de inputs
 */
export function getProductionInputs(token, params = {}) {
    return apiGet(`${API_URL_V2}production-inputs`, token, params, {
        transform: (data) => {
            const inputs = data.data || data || [];
            return {
                ...data,
                data: Array.isArray(inputs) ? inputs.map(normalizeProductionInput) : []
            };
        }
    })
}

/**
 * Crea un nuevo production input
 * @param {Object} inputData - Datos del input
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Input creado
 */
export function createProductionInput(inputData, token) {
    return apiPost(`${API_URL_V2}production-inputs`, token, inputData, {
        transform: (data) => {
            const input = data.data || data;
            return {
                ...data,
                data: normalizeProductionInput(input)
            };
        }
    })
}

/**
 * Crea múltiples production inputs
 * @param {number} productionRecordId - ID del registro de producción
 * @param {Array<number>} boxIds - Array de IDs de cajas
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Inputs creados
 */
export function createMultipleProductionInputs(productionRecordId, boxIds, token) {
    // Validar que productionRecordId sea válido
    if (!productionRecordId || isNaN(productionRecordId)) {
        console.error('[createMultipleProductionInputs] productionRecordId inválido:', productionRecordId)
        return Promise.reject(new Error('El ID del registro de producción no es válido'))
    }

    // Validar y filtrar boxIds: solo números válidos
    console.log('[createMultipleProductionInputs] boxIds recibidos:', boxIds, 'tipo:', typeof boxIds, 'es array:', Array.isArray(boxIds))
    
    const validBoxIds = Array.isArray(boxIds) 
        ? boxIds
            .filter(id => {
                const isValid = id != null && id !== undefined && id !== '' && !isNaN(id) && Number(id) > 0
                if (!isValid) {
                    console.warn('[createMultipleProductionInputs] ID inválido filtrado:', id, 'tipo:', typeof id)
                }
                return isValid
            })
            .map(id => Number(id))
        : []

    console.log('[createMultipleProductionInputs] validBoxIds después de filtrar:', validBoxIds)

    if (validBoxIds.length === 0) {
        console.error('[createMultipleProductionInputs] No hay boxIds válidos. boxIds original:', boxIds)
        return Promise.reject(new Error('No se han proporcionado IDs válidos de cajas'))
    }

    // El backend podría esperar strings o números. Intentamos con números primero
    // Si falla, el error nos dirá qué espera
    const requestBody = {
        production_record_id: Number(productionRecordId),
        box_ids: validBoxIds.map(id => Number(id)) // Asegurar que sean números
    }

    console.log('[createMultipleProductionInputs] Enviando request:', {
        url: `${API_URL_V2}production-inputs/multiple`,
        body: requestBody,
        bodyStringified: JSON.stringify(requestBody)
    })

    return apiPost(`${API_URL_V2}production-inputs/multiple`, token, requestBody, {
        transform: (data) => {
            const inputs = data.data || data || [];
            return {
                ...data,
                data: Array.isArray(inputs) ? inputs.map(normalizeProductionInput) : []
            };
        }
    })
}

/**
 * Elimina un production input
 * @param {string|number} inputId - ID del input
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export function deleteProductionInput(inputId, token) {
    return apiDelete(`${API_URL_V2}production-inputs/${inputId}`, token)
}

/**
 * Elimina múltiples production inputs
 * @param {Array<number|string>} inputIds - Array de IDs de los inputs a eliminar
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export function deleteMultipleProductionInputs(inputIds, token) {
    // Validar y filtrar inputIds: solo números válidos
    const validInputIds = Array.isArray(inputIds) 
        ? inputIds
            .filter(id => id != null && id !== undefined && id !== '' && !isNaN(id) && Number(id) > 0)
            .map(id => Number(id))
        : []

    if (validInputIds.length === 0) {
        console.error('[deleteMultipleProductionInputs] No hay inputIds válidos. inputIds original:', inputIds)
        return Promise.reject(new Error('No se han proporcionado IDs válidos de inputs'))
    }

    // El endpoint DELETE espera { "ids": [1, 2, 3] }
    const requestBody = { ids: validInputIds }

    console.log('[deleteMultipleProductionInputs] Enviando request:', {
        url: `${API_URL_V2}production-inputs/multiple`,
        method: 'DELETE',
        body: requestBody,
        bodyStringified: JSON.stringify(requestBody)
    })

    return apiRequest(`${API_URL_V2}production-inputs/multiple`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
    })
}

// ==================== PRODUCTION OUTPUTS ====================

/**
 * Obtiene todos los production outputs
 * @param {string} token - Token de autenticación
 * @param {object} params - Parámetros de consulta
 * @returns {Promise<Object>} - Lista de outputs
 */
export function getProductionOutputs(token, params = {}) {
    // Construir parámetros de query
    const queryParams = { ...params }
    
    // Si se pasa with_sources, asegurarse de que se envíe como boolean true
    if (params.with_sources === true || params.with_sources === 'true') {
        queryParams.with_sources = true
    }
    
    // Log para debug: ver qué URL se está generando
    const queryString = new URLSearchParams(queryParams).toString()
    console.log('🔗 URL generada para getProductionOutputs:', `${API_URL_V2}production-outputs?${queryString}`)
    
    return apiGet(`${API_URL_V2}production-outputs`, token, queryParams, {
        transform: (data) => {
            const outputs = data.data || data || [];
            
            // Debug: verificar si los sources vienen en la respuesta cruda
            if (outputs.length > 0) {
                console.log('🔍 Raw output from API (first item):', {
                    id: outputs[0].id,
                    hasSources: !!outputs[0].sources,
                    sourcesType: Array.isArray(outputs[0].sources) ? 'array' : typeof outputs[0].sources,
                    sourcesLength: Array.isArray(outputs[0].sources) ? outputs[0].sources.length : 'N/A',
                    rawOutputKeys: Object.keys(outputs[0]),
                    rawOutput: outputs[0]
                })
            }
            
            return {
                ...data,
                data: Array.isArray(outputs) ? outputs.map(normalizeProductionOutput) : []
            };
        }
    })
}

/**
 * Crea un nuevo production output
 * @param {Object} outputData - Datos del output
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Output creado
 */
export function createProductionOutput(outputData, token) {
    return apiPost(`${API_URL_V2}production-outputs`, token, outputData, {
        transform: (data) => {
            const output = data.data || data;
            return {
                ...data,
                data: normalizeProductionOutput(output)
            };
        }
    })
}

/**
 * Actualiza un production output
 * @param {string|number} outputId - ID del output
 * @param {Object} outputData - Datos actualizados
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Output actualizado
 */
export function updateProductionOutput(outputId, outputData, token) {
    return apiPut(`${API_URL_V2}production-outputs/${outputId}`, token, outputData, {
        transform: (data) => {
            const output = data.data || data;
            return {
                ...data,
                data: normalizeProductionOutput(output)
            };
        }
    })
}

/**
 * Elimina un production output
 * @param {string|number} outputId - ID del output
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export function deleteProductionOutput(outputId, token) {
    return apiDelete(`${API_URL_V2}production-outputs/${outputId}`, token)
}

/**
 * Crea múltiples production outputs en una sola petición
 * @param {Object} data - Datos con production_record_id y outputs array
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Outputs creados
 */
export function createMultipleProductionOutputs(data, token) {
    return apiPost(`${API_URL_V2}production-outputs/multiple`, token, data, {
        transform: (response) => {
            const outputs = response.data?.outputs || response.outputs || [];
            return {
                ...response,
                data: {
                    ...response.data,
                    outputs: Array.isArray(outputs) ? outputs.map(normalizeProductionOutput) : []
                }
            };
        }
    })
}

/**
 * Sincroniza todas las salidas de un proceso (crear, actualizar, eliminar)
 * @param {string|number} productionRecordId - ID del proceso
 * @param {Object} data - Datos con outputs array
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Proceso actualizado con salidas sincronizadas
 */
export function syncProductionOutputs(productionRecordId, data, token) {
    return apiPut(`${API_URL_V2}production-records/${productionRecordId}/outputs`, token, data, {
        transform: (response) => {
            const record = response.data || response;
            return {
                ...response,
                data: normalizeProductionRecord(record)
            };
        }
    })
}

// ==================== PRODUCTION RECORD IMAGES ====================

/**
 * Obtiene todas las imágenes de un production record
 * @param {string|number} recordId - ID del record
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Lista de imágenes
 */
export function getProductionRecordImages(recordId, token) {
    return apiGet(`${API_URL_V2}production-records/${recordId}/images`, token, {}, {
        transform: (data) => data.data || data || []
    })
}

/**
 * Sube una imagen a un production record
 * @param {string|number} recordId - ID del record
 * @param {File} imageFile - Archivo de imagen
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Imagen subida
 */
export function uploadProductionRecordImage(recordId, imageFile, token) {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    return apiPostFormData(`${API_URL_V2}production-records/${recordId}/images`, token, formData, {
        transform: (data) => data.data || data
    })
}

/**
 * Elimina una imagen de un production record
 * @param {string|number} recordId - ID del record
 * @param {string|number} imageId - ID de la imagen
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export function deleteProductionRecordImage(recordId, imageId, token) {
    return apiDelete(`${API_URL_V2}production-records/${recordId}/images/${imageId}`, token)
}

// ==================== PRODUCTION OUTPUT CONSUMPTIONS ====================

/**
 * Obtiene todos los consumos de outputs del padre
 * @param {string} token - Token de autenticación
 * @param {object} params - Parámetros de consulta
 * @returns {Promise<Object>} - Lista de consumos
 */
export function getProductionOutputConsumptions(token, params = {}) {
    return apiGet(`${API_URL_V2}production-output-consumptions`, token, params, {
        transform: (data) => {
            const consumptions = data.data || data || [];
            return {
                ...data,
                data: Array.isArray(consumptions) ? consumptions.map(normalizeProductionOutputConsumption) : []
            };
        }
    })
}

/**
 * Obtiene los outputs disponibles del proceso padre para un proceso hijo
 * @param {string|number} productionRecordId - ID del proceso hijo
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Lista de outputs disponibles
 */
export function getAvailableOutputs(productionRecordId, token) {
    return apiGet(`${API_URL_V2}production-output-consumptions/available-outputs/${productionRecordId}`, token, {}, {
        transform: (data) => data.data || data
    })
}

/**
 * Crea un nuevo consumo de output del padre
 * @param {Object} consumptionData - Datos del consumo
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Consumo creado
 */
export function createProductionOutputConsumption(consumptionData, token) {
    return apiPost(`${API_URL_V2}production-output-consumptions`, token, consumptionData, {
        transform: (data) => {
            const consumption = data.data || data;
            return {
                ...data,
                data: normalizeProductionOutputConsumption(consumption)
            };
        }
    })
}

/**
 * Actualiza un consumo de output del padre
 * @param {string|number} consumptionId - ID del consumo
 * @param {Object} consumptionData - Datos actualizados
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Consumo actualizado
 */
export function updateProductionOutputConsumption(consumptionId, consumptionData, token) {
    return apiPut(`${API_URL_V2}production-output-consumptions/${consumptionId}`, token, consumptionData, {
        transform: (data) => {
            const consumption = data.data || data;
            return {
                ...data,
                data: normalizeProductionOutputConsumption(consumption)
            };
        }
    })
}

/**
 * Elimina un consumo de output del padre
 * @param {string|number} consumptionId - ID del consumo
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export function deleteProductionOutputConsumption(consumptionId, token) {
    return apiDelete(`${API_URL_V2}production-output-consumptions/${consumptionId}`, token)
}

/**
 * Crea múltiples consumos de outputs del padre en una sola petición
 * @param {Object} data - Datos con production_record_id y consumptions array
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Consumos creados
 */
export function createMultipleProductionOutputConsumptions(data, token) {
    return apiPost(`${API_URL_V2}production-output-consumptions/multiple`, token, data, {
        transform: (response) => {
            const consumptions = response.data || response || [];
            return {
                ...response,
                data: Array.isArray(consumptions) ? consumptions.map(normalizeProductionOutputConsumption) : []
            };
        }
    })
}

/**
 * Sincroniza todos los consumos de outputs del padre de un proceso (crear, actualizar, eliminar)
 * @param {string|number} productionRecordId - ID del proceso
 * @param {Object} data - Datos con consumptions array
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Proceso actualizado con consumos sincronizados
 */
export function syncProductionOutputConsumptions(productionRecordId, data, token) {
    return apiPut(`${API_URL_V2}production-records/${productionRecordId}/parent-output-consumptions`, token, data, {
        transform: (response) => {
            const record = response.data || response;
            return {
                ...response,
                data: normalizeProductionRecord(record)
            };
        }
    })
}

