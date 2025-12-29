import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api/apiHelpers";
import { API_URL_V2 } from "@/configs/config";
import {
    normalizeCostCatalog,
    normalizeProductionCost,
    normalizeCostBreakdown,
} from "@/helpers/production/costNormalizers";
import { normalizeProductionOutput } from "@/helpers/production/normalizers";

// ==================== COST CATALOG ====================

/**
 * Obtiene el catálogo de costes
 * @param {string} token - Token de autenticación
 * @param {object} params - Parámetros de consulta (cost_type, active_only, perPage)
 * @returns {Promise<Object>} - Lista de costes del catálogo
 */
export function getCostCatalog(token, params = {}) {
    return apiGet(`${API_URL_V2}cost-catalog`, token, params, {
        transform: (data) => {
            const catalog = data.data || data || [];
            return {
                ...data,
                data: Array.isArray(catalog) 
                    ? catalog.map(normalizeCostCatalog) 
                    : []
            };
        }
    });
}

/**
 * Obtiene un coste del catálogo por ID
 * @param {string|number} catalogId - ID del coste
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Coste del catálogo
 */
export function getCostCatalogItem(catalogId, token) {
    return apiGet(`${API_URL_V2}cost-catalog/${catalogId}`, token, {}, {
        transform: (data) => {
            const catalog = data.data || data;
            return normalizeCostCatalog(catalog);
        }
    });
}

/**
 * Crea un nuevo coste en el catálogo
 * @param {Object} catalogData - Datos del coste
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Coste creado
 */
export function createCostCatalogItem(catalogData, token) {
    return apiPost(`${API_URL_V2}cost-catalog`, token, catalogData, {
        transform: (data) => {
            const catalog = data.data || data;
            return {
                ...data,
                data: normalizeCostCatalog(catalog)
            };
        }
    });
}

/**
 * Actualiza un coste del catálogo
 * @param {string|number} catalogId - ID del coste
 * @param {Object} catalogData - Datos actualizados
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Coste actualizado
 */
export function updateCostCatalogItem(catalogId, catalogData, token) {
    return apiPut(`${API_URL_V2}cost-catalog/${catalogId}`, token, catalogData, {
        transform: (data) => {
            const catalog = data.data || data;
            return {
                ...data,
                data: normalizeCostCatalog(catalog)
            };
        }
    });
}

/**
 * Elimina un coste del catálogo
 * @param {string|number} catalogId - ID del coste
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export function deleteCostCatalogItem(catalogId, token) {
    return apiDelete(`${API_URL_V2}cost-catalog/${catalogId}`, token);
}

// ==================== PRODUCTION COSTS ====================

/**
 * Obtiene los costes de producción
 * @param {string} token - Token de autenticación
 * @param {object} params - Parámetros de consulta (production_record_id, production_id, cost_type, perPage)
 * @returns {Promise<Object>} - Lista de costes
 */
export function getProductionCosts(token, params = {}) {
    return apiGet(`${API_URL_V2}production-costs`, token, params, {
        transform: (data) => {
            const costs = data.data || data || [];
            return {
                ...data,
                data: Array.isArray(costs) 
                    ? costs.map(normalizeProductionCost) 
                    : []
            };
        }
    });
}

/**
 * Obtiene un coste de producción por ID
 * @param {string|number} costId - ID del coste
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Coste de producción
 */
export function getProductionCost(costId, token) {
    return apiGet(`${API_URL_V2}production-costs/${costId}`, token, {}, {
        transform: (data) => {
            const cost = data.data || data;
            return normalizeProductionCost(cost);
        }
    });
}

/**
 * Crea un nuevo coste de producción
 * @param {Object} costData - Datos del coste
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Coste creado
 */
export function createProductionCost(costData, token) {
    return apiPost(`${API_URL_V2}production-costs`, token, costData, {
        transform: (data) => {
            const cost = data.data || data;
            return {
                ...data,
                data: normalizeProductionCost(cost)
            };
        }
    });
}

/**
 * Actualiza un coste de producción
 * @param {string|number} costId - ID del coste
 * @param {Object} costData - Datos actualizados
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Coste actualizado
 */
export function updateProductionCost(costId, costData, token) {
    return apiPut(`${API_URL_V2}production-costs/${costId}`, token, costData, {
        transform: (data) => {
            const cost = data.data || data;
            return {
                ...data,
                data: normalizeProductionCost(cost)
            };
        }
    });
}

/**
 * Elimina un coste de producción
 * @param {string|number} costId - ID del coste
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export function deleteProductionCost(costId, token) {
    return apiDelete(`${API_URL_V2}production-costs/${costId}`, token);
}

// ==================== COST BREAKDOWN ====================

/**
 * Obtiene el desglose completo de costes de un output
 * @param {string|number} outputId - ID del output
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Desglose de costes
 */
export function getCostBreakdown(outputId, token) {
    return apiGet(`${API_URL_V2}production-outputs/${outputId}/cost-breakdown`, token, {}, {
        transform: (data) => {
            const breakdown = data.data || data;
            return {
                ...data,
                data: {
                    output: breakdown.output ? normalizeProductionOutput(breakdown.output) : null,
                    costBreakdown: normalizeCostBreakdown(breakdown.cost_breakdown || breakdown.costBreakdown)
                }
            };
        }
    });
}

