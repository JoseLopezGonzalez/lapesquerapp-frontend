import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api/apiHelpers';
import { API_URL_V2 } from '@/configs/config';
import { normalizeProduction } from '@/helpers/production/normalizers';

/** @param {string} token @param {object} [params] @returns {Promise<Object>} */
export function getProductions(token, params = {}) {
  return apiGet(`${API_URL_V2}productions`, token, params);
}

/** @param {string|number} productionId @param {string} token @returns {Promise<Object>} */
export function getProduction(productionId, token) {
  return apiGet(`${API_URL_V2}productions/${productionId}`, token, {}, {
    transform: (data) => {
      const production = data.data || data;
      return normalizeProduction(production);
    },
  });
}

/** @param {Object} productionData @param {string} token @returns {Promise<Object>} */
export function createProduction(productionData, token) {
  return apiPost(`${API_URL_V2}productions`, token, productionData);
}

/** @param {string|number} productionId @param {Object} productionData @param {string} token @returns {Promise<Object>} */
export function updateProduction(productionId, productionData, token) {
  return apiPut(`${API_URL_V2}productions/${productionId}`, token, productionData);
}

/** @param {string|number} productionId @param {string} token @returns {Promise<Object>} */
export function deleteProduction(productionId, token) {
  return apiDelete(`${API_URL_V2}productions/${productionId}`, token);
}

/** @param {string|number} productionId @param {string} token @returns {Promise<Object>} */
export function getProductionDiagram(productionId, token) {
  return apiGet(`${API_URL_V2}productions/${productionId}/diagram`, token, {}, {
    transform: (data) => data.data || data,
  });
}

/** @param {string|number} productionId @param {string} token @returns {Promise<Object>} */
export function getProductionProcessTree(productionId, token) {
  return apiGet(`${API_URL_V2}productions/${productionId}/process-tree`, token, {}, {
    transform: (data) => data.data || data,
  });
}

/** @param {string|number} productionId @param {string} token @returns {Promise<Object>} */
export function getProductionTotals(productionId, token) {
  return apiGet(`${API_URL_V2}productions/${productionId}/totals`, token, {}, {
    transform: (data) => data.data || data,
  });
}

/** @param {string|number} productionId @param {string} token @returns {Promise<Object>} */
export function getProductionReconciliation(productionId, token) {
  return apiGet(`${API_URL_V2}productions/${productionId}/reconciliation`, token, {}, {
    transform: (data) => data.data || data,
  });
}

/** @param {string|number} productionId @param {string} token @returns {Promise<Object>} */
export function getAvailableProductsForOutputs(productionId, token) {
  return apiGet(`${API_URL_V2}productions/${productionId}/available-products-for-outputs`, token, {}, {
    transform: (data) => data.data || data || [],
  });
}
