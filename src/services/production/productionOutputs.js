import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api/apiHelpers';
import { API_URL_V2 } from '@/configs/config';
import {
  normalizeProductionOutput,
  normalizeProductionRecord,
} from '@/helpers/production/normalizers';

function fetchProductionOutputsPage(token, queryParams, page) {
  return apiGet(
    `${API_URL_V2}production-outputs`,
    token,
    { ...queryParams, page },
    { transform: (data) => data }
  );
}

// El endpoint pagina la respuesta (por defecto 15 por página). Si el caller no pide
// una página concreta, se asume que quiere el listado completo del production_record_id
// (así lo consume hoy useProductionOutputsManager, que no tiene UI de paginación), así
// que se recorren todas las páginas y se fusionan antes de devolver.
export async function getProductionOutputs(token, params = {}) {
  const queryParams = { ...params };
  if (params.with_sources === true || params.with_sources === 'true') {
    queryParams.with_sources = true;
  }

  if (params.page !== undefined) {
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

  const firstPage = await fetchProductionOutputsPage(token, queryParams, 1);
  let allOutputs = Array.isArray(firstPage?.data) ? firstPage.data : [];
  const lastPage = firstPage?.meta?.last_page ?? 1;

  if (lastPage > 1) {
    const remainingPages = Array.from({ length: lastPage - 1 }, (_, i) => i + 2);
    const remainingResponses = await Promise.all(
      remainingPages.map((page) => fetchProductionOutputsPage(token, queryParams, page))
    );
    remainingResponses.forEach((response) => {
      if (Array.isArray(response?.data)) allOutputs = allOutputs.concat(response.data);
    });
  }

  return {
    ...firstPage,
    data: allOutputs.map(normalizeProductionOutput),
  };
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
