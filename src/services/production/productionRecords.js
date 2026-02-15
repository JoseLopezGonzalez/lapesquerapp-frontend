import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api/apiHelpers';
import { API_URL_V2 } from '@/configs/config';
import {
  normalizeProductionRecord,
  normalizeProductionRecordsResponse,
  normalizeProductionRecordResponse,
} from '@/helpers/production/normalizers';

export function getProductionRecords(token, params = {}) {
  return apiGet(`${API_URL_V2}production-records`, token, params, {
    transform: normalizeProductionRecordsResponse,
  });
}

export function getProductionRecordsOptions(token, productionId, excludeId = null) {
  const params = { production_id: productionId };
  if (excludeId) params.exclude_id = excludeId;
  return apiGet(`${API_URL_V2}production-records/options`, token, params, {
    transform: (data) => data.data || data || [],
  });
}

export function getProductionRecord(recordId, token) {
  return apiGet(`${API_URL_V2}production-records/${recordId}`, token, {}, {
    transform: normalizeProductionRecordResponse,
  });
}

export function getProductionRecordSourcesData(recordId, token) {
  return apiGet(`${API_URL_V2}production-records/${recordId}/sources-data`, token, {}, {
    transform: (data) => data.data || data,
  });
}

export function createProductionRecord(recordData, token) {
  return apiPost(`${API_URL_V2}production-records`, token, recordData, {
    transform: (data) => {
      const record = data.data || data;
      return { ...data, data: normalizeProductionRecord(record) };
    },
  });
}

export function updateProductionRecord(recordId, recordData, token) {
  return apiPut(`${API_URL_V2}production-records/${recordId}`, token, recordData, {
    transform: (data) => {
      const record = data.data || data;
      return { ...data, data: normalizeProductionRecord(record) };
    },
  });
}

export function deleteProductionRecord(recordId, token) {
  return apiDelete(`${API_URL_V2}production-records/${recordId}`, token);
}

export function finishProductionRecord(recordId, token) {
  return apiPost(`${API_URL_V2}production-records/${recordId}/finish`, token, {}, {
    transform: (data) => {
      const record = data.data || data;
      return { ...data, data: normalizeProductionRecord(record) };
    },
  });
}
