import { fetchWithTenant } from "@lib/fetchWithTenant";
import { API_URL_V2 } from "@/configs/config";

/**
 * Obtiene todas las producciones
 * @param {string} token - Token de autenticación
 * @param {object} params - Parámetros de consulta (filtros, paginación, etc.)
 * @returns {Promise<Object>} - Lista de producciones
 */
export function getProductions(token, params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const url = `${API_URL_V2}productions${queryParams ? `?${queryParams}` : ''}`;
    
    return fetchWithTenant(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(errorData.message || 'Error al obtener las producciones');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data;
        })
        .catch((error) => {
            throw error;
        });
}

/**
 * Obtiene una producción por ID
 * @param {string|number} productionId - ID de la producción
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Datos de la producción
 */
export function getProduction(productionId, token) {
    return fetchWithTenant(`${API_URL_V2}productions/${productionId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(errorData.message || 'Error al obtener la producción');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data.data;
        })
        .catch((error) => {
            throw error;
        });
}

/**
 * Crea una nueva producción
 * @param {Object} productionData - Datos de la producción
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Producción creada
 */
export function createProduction(productionData, token) {
    return fetchWithTenant(`${API_URL_V2}productions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
        body: JSON.stringify(productionData),
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(errorData.message || 'Error al crear la producción');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data;
        })
        .catch((error) => {
            throw error;
        });
}

/**
 * Actualiza una producción
 * @param {string|number} productionId - ID de la producción
 * @param {Object} productionData - Datos actualizados
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Producción actualizada
 */
export function updateProduction(productionId, productionData, token) {
    return fetchWithTenant(`${API_URL_V2}productions/${productionId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
        body: JSON.stringify(productionData),
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(errorData.message || 'Error al actualizar la producción');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data;
        })
        .catch((error) => {
            throw error;
        });
}

/**
 * Elimina una producción
 * @param {string|number} productionId - ID de la producción
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export function deleteProduction(productionId, token) {
    return fetchWithTenant(`${API_URL_V2}productions/${productionId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(errorData.message || 'Error al eliminar la producción');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data;
        })
        .catch((error) => {
            throw error;
        });
}

/**
 * Obtiene el diagrama calculado de una producción
 * @param {string|number} productionId - ID de la producción
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Diagrama calculado
 */
export function getProductionDiagram(productionId, token) {
    return fetchWithTenant(`${API_URL_V2}productions/${productionId}/diagram`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(errorData.message || 'Error al obtener el diagrama');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data.data;
        })
        .catch((error) => {
            throw error;
        });
}

/**
 * Obtiene el árbol de procesos de una producción
 * @param {string|number} productionId - ID de la producción
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Árbol de procesos
 */
export function getProductionProcessTree(productionId, token) {
    return fetchWithTenant(`${API_URL_V2}productions/${productionId}/process-tree`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(errorData.message || 'Error al obtener el árbol de procesos');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data.data;
        })
        .catch((error) => {
            throw error;
        });
}

/**
 * Obtiene los totales globales de una producción
 * @param {string|number} productionId - ID de la producción
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Totales globales
 */
export function getProductionTotals(productionId, token) {
    return fetchWithTenant(`${API_URL_V2}productions/${productionId}/totals`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(errorData.message || 'Error al obtener los totales');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data.data;
        })
        .catch((error) => {
            throw error;
        });
}

/**
 * Obtiene la conciliación de una producción
 * @param {string|number} productionId - ID de la producción
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Datos de conciliación
 */
export function getProductionReconciliation(productionId, token) {
    return fetchWithTenant(`${API_URL_V2}productions/${productionId}/reconciliation`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(errorData.message || 'Error al obtener la conciliación');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data.data;
        })
        .catch((error) => {
            throw error;
        });
}

// ==================== PRODUCTION RECORDS ====================

/**
 * Obtiene todos los production records
 * @param {string} token - Token de autenticación
 * @param {object} params - Parámetros de consulta
 * @returns {Promise<Object>} - Lista de production records
 */
export function getProductionRecords(token, params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const url = `${API_URL_V2}production-records${queryParams ? `?${queryParams}` : ''}`;
    
    return fetchWithTenant(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(errorData.message || 'Error al obtener los procesos');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data;
        })
        .catch((error) => {
            throw error;
        });
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
    const queryParams = new URLSearchParams(params).toString();
    const url = `${API_URL_V2}production-records/options${queryParams ? `?${queryParams}` : ''}`;
    
    return fetchWithTenant(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(errorData.message || 'Error al obtener las opciones de records');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data.data || data || [];
        })
        .catch((error) => {
            throw error;
        });
}

/**
 * Obtiene un production record por ID
 * @param {string|number} recordId - ID del record
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Datos del record
 */
export function getProductionRecord(recordId, token) {
    return fetchWithTenant(`${API_URL_V2}production-records/${recordId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(errorData.message || 'Error al obtener el proceso');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data.data;
        })
        .catch((error) => {
            throw error;
        });
}


/**
 * Crea un nuevo production record
 * @param {Object} recordData - Datos del record
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Record creado
 */
export function createProductionRecord(recordData, token) {
    return fetchWithTenant(`${API_URL_V2}production-records`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
        body: JSON.stringify(recordData),
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(errorData.message || 'Error al crear el proceso');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data;
        })
        .catch((error) => {
            throw error;
        });
}

/**
 * Actualiza un production record
 * @param {string|number} recordId - ID del record
 * @param {Object} recordData - Datos actualizados
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Record actualizado
 */
export function updateProductionRecord(recordId, recordData, token) {
    return fetchWithTenant(`${API_URL_V2}production-records/${recordId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
        body: JSON.stringify(recordData),
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(errorData.message || 'Error al actualizar el proceso');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data;
        })
        .catch((error) => {
            throw error;
        });
}

/**
 * Elimina un production record
 * @param {string|number} recordId - ID del record
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export function deleteProductionRecord(recordId, token) {
    return fetchWithTenant(`${API_URL_V2}production-records/${recordId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(errorData.message || 'Error al eliminar el proceso');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data;
        })
        .catch((error) => {
            throw error;
        });
}

/**
 * Finaliza un production record
 * @param {string|number} recordId - ID del record
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Record finalizado
 */
export function finishProductionRecord(recordId, token) {
    return fetchWithTenant(`${API_URL_V2}production-records/${recordId}/finish`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(errorData.message || 'Error al finalizar el proceso');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data;
        })
        .catch((error) => {
            throw error;
        });
}

// ==================== PRODUCTION INPUTS ====================

/**
 * Obtiene todos los production inputs
 * @param {string} token - Token de autenticación
 * @param {object} params - Parámetros de consulta
 * @returns {Promise<Object>} - Lista de inputs
 */
export function getProductionInputs(token, params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const url = `${API_URL_V2}production-inputs${queryParams ? `?${queryParams}` : ''}`;
    
    return fetchWithTenant(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(errorData.message || 'Error al obtener las entradas');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data;
        })
        .catch((error) => {
            throw error;
        });
}

/**
 * Crea un nuevo production input
 * @param {Object} inputData - Datos del input
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Input creado
 */
export function createProductionInput(inputData, token) {
    return fetchWithTenant(`${API_URL_V2}production-inputs`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
        body: JSON.stringify(inputData),
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(errorData.message || 'Error al crear la entrada');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data;
        })
        .catch((error) => {
            throw error;
        });
}

/**
 * Crea múltiples production inputs
 * @param {number} productionRecordId - ID del registro de producción
 * @param {Array<number>} boxIds - Array de IDs de cajas
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Inputs creados
 */
export function createMultipleProductionInputs(productionRecordId, boxIds, token) {
    return fetchWithTenant(`${API_URL_V2}production-inputs/multiple`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
        body: JSON.stringify({
            production_record_id: productionRecordId,
            box_ids: boxIds
        }),
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(errorData.message || 'Error al crear las entradas');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data;
        })
        .catch((error) => {
            throw error;
        });
}

/**
 * Elimina un production input
 * @param {string|number} inputId - ID del input
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export function deleteProductionInput(inputId, token) {
    return fetchWithTenant(`${API_URL_V2}production-inputs/${inputId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(errorData.message || 'Error al eliminar la entrada');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data;
        })
        .catch((error) => {
            throw error;
        });
}

// ==================== PRODUCTION OUTPUTS ====================

/**
 * Obtiene todos los production outputs
 * @param {string} token - Token de autenticación
 * @param {object} params - Parámetros de consulta
 * @returns {Promise<Object>} - Lista de outputs
 */
export function getProductionOutputs(token, params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const url = `${API_URL_V2}production-outputs${queryParams ? `?${queryParams}` : ''}`;
    
    return fetchWithTenant(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(errorData.message || 'Error al obtener las salidas');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data;
        })
        .catch((error) => {
            throw error;
        });
}

/**
 * Crea un nuevo production output
 * @param {Object} outputData - Datos del output
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Output creado
 */
export function createProductionOutput(outputData, token) {
    return fetchWithTenant(`${API_URL_V2}production-outputs`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
        body: JSON.stringify(outputData),
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(errorData.message || 'Error al crear la salida');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data;
        })
        .catch((error) => {
            throw error;
        });
}

/**
 * Actualiza un production output
 * @param {string|number} outputId - ID del output
 * @param {Object} outputData - Datos actualizados
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Output actualizado
 */
export function updateProductionOutput(outputId, outputData, token) {
    return fetchWithTenant(`${API_URL_V2}production-outputs/${outputId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
        body: JSON.stringify(outputData),
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(errorData.message || 'Error al actualizar la salida');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data;
        })
        .catch((error) => {
            throw error;
        });
}

/**
 * Elimina un production output
 * @param {string|number} outputId - ID del output
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export function deleteProductionOutput(outputId, token) {
    return fetchWithTenant(`${API_URL_V2}production-outputs/${outputId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(errorData.message || 'Error al eliminar la salida');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data;
        })
        .catch((error) => {
            throw error;
        });
}

/**
 * Crea múltiples production outputs en una sola petición
 * @param {Object} data - Datos con production_record_id y outputs array
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Outputs creados
 */
export function createMultipleProductionOutputs(data, token) {
    return fetchWithTenant(`${API_URL_V2}production-outputs/multiple`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
        body: JSON.stringify(data),
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(errorData.message || 'Error al crear las salidas');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data;
        })
        .catch((error) => {
            throw error;
        });
}

/**
 * Sincroniza todas las salidas de un proceso (crear, actualizar, eliminar)
 * @param {string|number} productionRecordId - ID del proceso
 * @param {Object} data - Datos con outputs array
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Proceso actualizado con salidas sincronizadas
 */
export function syncProductionOutputs(productionRecordId, data, token) {
    return fetchWithTenant(`${API_URL_V2}production-records/${productionRecordId}/outputs`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
        body: JSON.stringify(data),
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(errorData.message || 'Error al sincronizar las salidas');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data;
        })
        .catch((error) => {
            throw error;
        });
}

// ==================== PRODUCTION RECORD IMAGES ====================

/**
 * Obtiene todas las imágenes de un production record
 * @param {string|number} recordId - ID del record
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Lista de imágenes
 */
export function getProductionRecordImages(recordId, token) {
    return fetchWithTenant(`${API_URL_V2}production-records/${recordId}/images`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(errorData.message || 'Error al obtener las imágenes');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data.data || data || [];
        })
        .catch((error) => {
            throw error;
        });
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

    return fetchWithTenant(`${API_URL_V2}production-records/${recordId}/images`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
        body: formData,
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(errorData.message || 'Error al subir la imagen');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data.data || data;
        })
        .catch((error) => {
            throw error;
        });
}

/**
 * Elimina una imagen de un production record
 * @param {string|number} recordId - ID del record
 * @param {string|number} imageId - ID de la imagen
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export function deleteProductionRecordImage(recordId, imageId, token) {
    return fetchWithTenant(`${API_URL_V2}production-records/${recordId}/images/${imageId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            Authorization: `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(errorData.message || 'Error al eliminar la imagen');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data;
        })
        .catch((error) => {
            throw error;
        });
}

// ==================== PRODUCTION OUTPUT CONSUMPTIONS ====================

/**
 * Obtiene todos los consumos de outputs del padre
 * @param {string} token - Token de autenticación
 * @param {object} params - Parámetros de consulta
 * @returns {Promise<Object>} - Lista de consumos
 */
export function getProductionOutputConsumptions(token, params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const url = `${API_URL_V2}production-output-consumptions${queryParams ? `?${queryParams}` : ''}`;
    
    return fetchWithTenant(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(errorData.message || 'Error al obtener los consumos');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data;
        })
        .catch((error) => {
            throw error;
        });
}

/**
 * Obtiene los outputs disponibles del proceso padre para un proceso hijo
 * @param {string|number} productionRecordId - ID del proceso hijo
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Lista de outputs disponibles
 */
export function getAvailableOutputs(productionRecordId, token) {
    return fetchWithTenant(`${API_URL_V2}production-output-consumptions/available-outputs/${productionRecordId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(errorData.message || 'Error al obtener los outputs disponibles');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data;
        })
        .catch((error) => {
            throw error;
        });
}

/**
 * Crea un nuevo consumo de output del padre
 * @param {Object} consumptionData - Datos del consumo
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Consumo creado
 */
export function createProductionOutputConsumption(consumptionData, token) {
    return fetchWithTenant(`${API_URL_V2}production-output-consumptions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
        body: JSON.stringify(consumptionData),
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(errorData.message || 'Error al crear el consumo');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data;
        })
        .catch((error) => {
            throw error;
        });
}

/**
 * Actualiza un consumo de output del padre
 * @param {string|number} consumptionId - ID del consumo
 * @param {Object} consumptionData - Datos actualizados
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Consumo actualizado
 */
export function updateProductionOutputConsumption(consumptionId, consumptionData, token) {
    return fetchWithTenant(`${API_URL_V2}production-output-consumptions/${consumptionId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
        body: JSON.stringify(consumptionData),
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(errorData.message || 'Error al actualizar el consumo');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data;
        })
        .catch((error) => {
            throw error;
        });
}

/**
 * Elimina un consumo de output del padre
 * @param {string|number} consumptionId - ID del consumo
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export function deleteProductionOutputConsumption(consumptionId, token) {
    return fetchWithTenant(`${API_URL_V2}production-output-consumptions/${consumptionId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(errorData.message || 'Error al eliminar el consumo');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data;
        })
        .catch((error) => {
            throw error;
        });
}

/**
 * Crea múltiples consumos de outputs del padre en una sola petición
 * @param {Object} data - Datos con production_record_id y consumptions array
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Consumos creados
 */
export function createMultipleProductionOutputConsumptions(data, token) {
    return fetchWithTenant(`${API_URL_V2}production-output-consumptions/multiple`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
        body: JSON.stringify(data),
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(errorData.message || 'Error al crear los consumos');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data;
        })
        .catch((error) => {
            throw error;
        });
}

/**
 * Sincroniza todos los consumos de outputs del padre de un proceso (crear, actualizar, eliminar)
 * @param {string|number} productionRecordId - ID del proceso
 * @param {Object} data - Datos con consumptions array
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Proceso actualizado con consumos sincronizados
 */
export function syncProductionOutputConsumptions(productionRecordId, data, token) {
    return fetchWithTenant(`${API_URL_V2}production-records/${productionRecordId}/parent-output-consumptions`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
        body: JSON.stringify(data),
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(errorData.message || 'Error al sincronizar los consumos');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data;
        })
        .catch((error) => {
            throw error;
        });
}

