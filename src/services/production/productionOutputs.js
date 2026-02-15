import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api/apiHelpers';
import { API_URL_V2 } from '@/configs/config';
import {
  normalizeProductionOutput,
  normalizeProductionRecord,
} from '@/helpers/production/normalizers';

export function getProductionOutputs(token, params = {}) {
  const queryParams = { ...params };
  if (params.with_sources === true || params.with_sources === 'true') {
    queryParams.with_sources = true;
  }
  return apiGet(`${API_URL_V2}production-outputs`, token, queryParams, {
    transform: (data) => {
      const outputs = data.data || data || [];
      return {
        ...data,
        data: Array.isArray(outputs) ? outputs.map(normalizeProductionOutput) : [],
      };
    },
  });
}

export function createProductionOutput(outputData, token) {
  return apiPost(`${API_URL_V2}production-outputs`, token, outputData, {
    transform: (data) => {
      const output = data.data || data;
      return { ...data, data: normalizeProductionOutput(output) };
    },
  });
}

export function updateProductionOutput(outputId, outputData, token) {
  return apiPut(`${API_URL_V2}production-outputs/${outputId}`, token, outputData, {
    transform: (data) => {
      const output = data.data || data;
      return { ...data, data: normalizeProductionOutput(output) };
    },
  });
}

export function deleteProductionOutput(outputId, token) {
  return apiDelete(`${API_URL_V2}production-outputs/${outputId}`, token);
}

export function createMultipleProductionOutputs(data, token) {
  return apiPost(`${API_URL_V2}production-outputs/multiple`, token, data, {
    transform: (response) => {
      const outputs = response.data?.outputs || response.outputs || [];
      return {
        ...response,
        data: {
          ...response.data,
          outputs: Array.isArray(outputs) ? outputs.map(normalizeProductionOutput) : [],
        },
      };
    },
  });
}

export function syncProductionOutputs(productionRecordId, data, token) {
  return apiPut(`${API_URL_V2}production-records/${productionRecordId}/outputs`, token, data, {
    transform: (response) => {
      const record = response.data || response;
      return { ...response, data: normalizeProductionRecord(record) };
    },
  });
}
