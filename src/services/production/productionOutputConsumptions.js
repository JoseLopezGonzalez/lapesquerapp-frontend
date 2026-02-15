import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api/apiHelpers';
import { API_URL_V2 } from '@/configs/config';
import {
  normalizeProductionOutputConsumption,
  normalizeProductionRecord,
} from '@/helpers/production/normalizers';

/** @param {string} token @param {object} [params] @returns {Promise<Object>} */
export function getProductionOutputConsumptions(token, params = {}) {
  return apiGet(`${API_URL_V2}production-output-consumptions`, token, params, {
    transform: (data) => {
      const consumptions = data.data || data || [];
      return {
        ...data,
        data: Array.isArray(consumptions) ? consumptions.map(normalizeProductionOutputConsumption) : [],
      };
    },
  });
}

/** @param {string|number} productionRecordId @param {string} token @returns {Promise<Object>} */
export function getAvailableOutputs(productionRecordId, token) {
  return apiGet(
    `${API_URL_V2}production-output-consumptions/available-outputs/${productionRecordId}`,
    token,
    {},
    { transform: (data) => data.data || data }
  );
}

/** @param {Object} consumptionData @param {string} token @returns {Promise<Object>} */
export function createProductionOutputConsumption(consumptionData, token) {
  return apiPost(`${API_URL_V2}production-output-consumptions`, token, consumptionData, {
    transform: (data) => {
      const consumption = data.data || data;
      return { ...data, data: normalizeProductionOutputConsumption(consumption) };
    },
  });
}

/** @param {string|number} consumptionId @param {Object} consumptionData @param {string} token @returns {Promise<Object>} */
export function updateProductionOutputConsumption(consumptionId, consumptionData, token) {
  return apiPut(`${API_URL_V2}production-output-consumptions/${consumptionId}`, token, consumptionData, {
    transform: (data) => {
      const consumption = data.data || data;
      return { ...data, data: normalizeProductionOutputConsumption(consumption) };
    },
  });
}

/** @param {string|number} consumptionId @param {string} token @returns {Promise<Object>} */
export function deleteProductionOutputConsumption(consumptionId, token) {
  return apiDelete(`${API_URL_V2}production-output-consumptions/${consumptionId}`, token);
}

/** @param {Object} data @param {string} token @returns {Promise<Object>} */
export function createMultipleProductionOutputConsumptions(data, token) {
  return apiPost(`${API_URL_V2}production-output-consumptions/multiple`, token, data, {
    transform: (response) => {
      const consumptions = response.data || response || [];
      return {
        ...response,
        data: Array.isArray(consumptions) ? consumptions.map(normalizeProductionOutputConsumption) : [],
      };
    },
  });
}

/** @param {string|number} productionRecordId @param {Object} data @param {string} token @returns {Promise<Object>} */
export function syncProductionOutputConsumptions(productionRecordId, data, token) {
  return apiPut(
    `${API_URL_V2}production-records/${productionRecordId}/parent-output-consumptions`,
    token,
    data,
    {
      transform: (response) => {
        const record = response.data || response;
        return { ...response, data: normalizeProductionRecord(record) };
      },
    }
  );
}
