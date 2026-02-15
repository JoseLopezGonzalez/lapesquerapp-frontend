import { apiGet, apiPost, apiDelete, apiRequest } from '@/lib/api/apiHelpers';
import { API_URL_V2 } from '@/configs/config';
import { normalizeProductionInput } from '@/helpers/production/normalizers';

export function getProductionInputs(token, params = {}) {
  return apiGet(`${API_URL_V2}production-inputs`, token, params, {
    transform: (data) => {
      const inputs = data.data || data || [];
      return {
        ...data,
        data: Array.isArray(inputs) ? inputs.map(normalizeProductionInput) : [],
      };
    },
  });
}

export function createProductionInput(inputData, token) {
  return apiPost(`${API_URL_V2}production-inputs`, token, inputData, {
    transform: (data) => {
      const input = data.data || data;
      return { ...data, data: normalizeProductionInput(input) };
    },
  });
}

export function createMultipleProductionInputs(productionRecordId, boxIds, token) {
  if (!productionRecordId || isNaN(productionRecordId)) {
    console.error('[createMultipleProductionInputs] productionRecordId inválido:', productionRecordId);
    return Promise.reject(new Error('El ID del registro de producción no es válido'));
  }

  const validBoxIds = Array.isArray(boxIds)
    ? boxIds
        .filter((id) => {
          const isValid = id != null && id !== undefined && id !== '' && !isNaN(id) && Number(id) > 0;
          if (!isValid) {
            console.warn('[createMultipleProductionInputs] ID inválido filtrado:', id, 'tipo:', typeof id);
          }
          return isValid;
        })
        .map((id) => Number(id))
    : [];

  if (validBoxIds.length === 0) {
    console.error('[createMultipleProductionInputs] No hay boxIds válidos. boxIds original:', boxIds);
    return Promise.reject(new Error('No se han proporcionado IDs válidos de cajas'));
  }

  const requestBody = {
    production_record_id: Number(productionRecordId),
    box_ids: validBoxIds.map((id) => Number(id)),
  };

  return apiPost(`${API_URL_V2}production-inputs/multiple`, token, requestBody, {
    transform: (data) => {
      const inputs = data.data || data || [];
      return {
        ...data,
        data: Array.isArray(inputs) ? inputs.map(normalizeProductionInput) : [],
      };
    },
  });
}

export function deleteProductionInput(inputId, token) {
  return apiDelete(`${API_URL_V2}production-inputs/${inputId}`, token);
}

export function deleteMultipleProductionInputs(inputIds, token) {
  const validInputIds = Array.isArray(inputIds)
    ? inputIds
        .filter((id) => id != null && id !== undefined && id !== '' && !isNaN(id) && Number(id) > 0)
        .map((id) => Number(id))
    : [];

  if (validInputIds.length === 0) {
    console.error('[deleteMultipleProductionInputs] No hay inputIds válidos. inputIds original:', inputIds);
    return Promise.reject(new Error('No se han proporcionado IDs válidos de inputs'));
  }

  const requestBody = { ids: validInputIds };

  return apiRequest(`${API_URL_V2}production-inputs/multiple`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(requestBody),
  });
}
