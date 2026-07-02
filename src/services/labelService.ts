import { fetchWithTenant } from '@/lib/fetchWithTenant';
import { API_URL_V2 } from '@/configs/config';
import { getAuthToken } from '@/lib/auth/getAuthToken';
import { getUserAgent } from '@/lib/utils/getUserAgent';
import { handleLabelServiceResponse } from './labelServiceHelpers';
import type { Label, LabelFormat, LabelApiResponse } from '@/types/labelEditor';

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getAuthToken();
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
    'User-Agent': getUserAgent(),
  };
}

export async function getLabel(labelId: string): Promise<Label> {
  const headers = await authHeaders();
  return fetchWithTenant(`${API_URL_V2}labels/${labelId}`, {
    method: 'GET',
    headers,
  })
    .then((response) => handleLabelServiceResponse(response, 'Error al obtener la etiqueta'))
    .then((data: { data?: Label }) => data.data as Label)
    .catch((error) => {
      throw error;
    });
}

export async function createLabel(
  labelName: string,
  labelFormat: LabelFormat
): Promise<LabelApiResponse> {
  const headers = await authHeaders();
  return fetchWithTenant(`${API_URL_V2}labels`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: labelName, format: labelFormat }),
  })
    .then((response) => handleLabelServiceResponse(response, 'Error al crear la etiqueta'))
    .then((data) => data as LabelApiResponse)
    .catch((error) => {
      throw error;
    });
}

export async function updateLabel(
  labelId: string,
  labelName: string,
  labelFormat: LabelFormat
): Promise<LabelApiResponse> {
  const headers = await authHeaders();
  return fetchWithTenant(`${API_URL_V2}labels/${labelId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ name: labelName, format: labelFormat }),
  })
    .then((response) => handleLabelServiceResponse(response, 'Error al actualizar la etiqueta'))
    .then((data) => data as LabelApiResponse)
    .catch((error) => {
      throw error;
    });
}

export async function getLabels(): Promise<Label[]> {
  const headers = await authHeaders();
  return fetchWithTenant(`${API_URL_V2}labels`, {
    method: 'GET',
    headers,
  })
    .then((response) => handleLabelServiceResponse(response, 'Error al obtener las etiquetas'))
    .then((data: { data?: Label[] }) => (data.data ?? data) as Label[])
    .catch((error) => {
      throw error;
    });
}

export async function deleteLabel(labelId: string): Promise<void> {
  const headers = await authHeaders();
  return fetchWithTenant(`${API_URL_V2}labels/${labelId}`, {
    method: 'DELETE',
    headers,
  })
    .then((response) => handleLabelServiceResponse(response, 'Error al eliminar la etiqueta'))
    .then(() => undefined)
    .catch((error) => {
      throw error;
    });
}

export async function getLabelsOptions(): Promise<unknown> {
  const headers = await authHeaders();
  return fetchWithTenant(`${API_URL_V2}labels/options`, {
    method: 'GET',
    headers,
  })
    .then((response) =>
      handleLabelServiceResponse(response, 'Error al obtener las opciones de etiquetas')
    )
    .then((data) => data)
    .catch((error) => {
      throw error;
    });
}

export async function duplicateLabel(
  labelId: string,
  customName: string | null = null
): Promise<LabelApiResponse> {
  const headers = await authHeaders();
  return fetchWithTenant(`${API_URL_V2}labels/${labelId}/duplicate`, {
    method: 'POST',
    headers,
    body: JSON.stringify(customName ? { name: customName } : {}),
  })
    .then((response) => handleLabelServiceResponse(response, 'Error al duplicar la etiqueta'))
    .then((data) => data as LabelApiResponse)
    .catch((error) => {
      throw error;
    });
}
