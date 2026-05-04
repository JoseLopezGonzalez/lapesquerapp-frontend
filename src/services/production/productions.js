import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api/apiHelpers';
import { API_URL_V2 } from '@/configs/config';
import { normalizeProduction } from '@/helpers/production/normalizers';

/** @param {string} token @param {object} [params] @returns {Promise<Object>} */
export function getProductions(token, params = {}) {
  return apiGet(`${API_URL_V2}productions`, token, params);
}

/** @param {string} token @param {object} [params] @returns {Promise<Object>} */
export function getProductionControlPanel(token, params = {}) {
  return apiGet(`${API_URL_V2}productions/control-panel`, token, params, {
    transform: (data) => data.data || data,
  });
}

/** @param {string} token @param {object} [params] @returns {Promise<Object>} */
export function getProductionOrphanStock(token, params = {}) {
  return apiGet(`${API_URL_V2}productions/orphan-stock`, token, params, {
    transform: (data) => data.data || data,
  });
}

/** @param {string} token @param {object} [params] @returns {Promise<Object>} Cajas sin fila en pallet_boxes */
export function getProductionOrphanBoxes(token, params = {}) {
  return apiGet(`${API_URL_V2}productions/orphan-boxes`, token, params, {
    transform: (data) => {
      const payload = data.data ?? data;
      const summary = payload.summary ?? {};
      const pag = payload.pagination ?? {};
      return {
        summary: {
          totalOrphanBoxes:
            summary.totalOrphanBoxes ?? summary.total_orphan_boxes ?? 0,
          totalOrphanWeightKg:
            summary.totalOrphanWeightKg ?? summary.total_orphan_weight_kg ?? 0,
        },
        boxes: payload.boxes ?? [],
        pagination: {
          currentPage: pag.currentPage ?? pag.current_page ?? 1,
          perPage: pag.perPage ?? pag.per_page ?? 25,
          total: pag.total ?? 0,
          lastPage: pag.lastPage ?? pag.last_page ?? 1,
        },
      };
    },
  });
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

/** @param {string|number} productionId @param {string} token @returns {Promise<Object>} */
export function getProductionClosureCheck(productionId, token) {
  return apiGet(`${API_URL_V2}productions/${productionId}/closure-check`, token, {}, {
    transform: (data) => data.data || data,
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

/** @param {string|number} productionId @param {{ reason: string }} data @param {string} token @returns {Promise<Object>} */
export function closeProduction(productionId, data, token) {
  return apiPost(`${API_URL_V2}productions/${productionId}/close`, token, data, {
    transform: (response) => {
      const production = response.data || response;
      return { ...response, data: normalizeProduction(production) };
    },
  });
}

/** @param {string|number} productionId @param {{ reason: string }} data @param {string} token @returns {Promise<Object>} */
export function reopenProduction(productionId, data, token) {
  return apiPost(`${API_URL_V2}productions/${productionId}/reopen`, token, data, {
    transform: (response) => {
      const production = response.data || response;
      return { ...response, data: normalizeProduction(production) };
    },
  });
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
