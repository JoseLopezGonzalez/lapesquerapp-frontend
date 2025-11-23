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
 * @param {Array} inputsData - Array de datos de inputs
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Inputs creados
 */
export function createMultipleProductionInputs(inputsData, token) {
    return fetchWithTenant(`${API_URL_V2}production-inputs/multiple`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
        body: JSON.stringify({ inputs: inputsData }),
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

