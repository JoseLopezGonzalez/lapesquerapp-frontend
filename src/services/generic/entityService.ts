/**
 * Servicios genéricos para entidades
 *
 * ESTOS SERVICIOS SON PRIVADOS - Solo deben usarse dentro de services de dominio
 * Los componentes NUNCA deben importar o usar estos servicios directamente
 */

import { fetchWithTenant } from '@lib/fetchWithTenant';
import { getAuthToken } from '@/lib/auth/getAuthToken';
import { getErrorMessage } from '@/lib/api/apiHelpers';
import { getUserAgent } from '@/lib/utils/getUserAgent';

const getAuthHeaders = async (token?: string | null): Promise<Record<string, string>> => {
  const resolvedToken = token ?? (await getAuthToken());
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${resolvedToken}`,
    'User-Agent': getUserAgent(),
  };
};

export const fetchEntitiesGeneric = async (url: string, token?: string | null): Promise<unknown> => {
  const headers = await getAuthHeaders(token);
  const response = await fetchWithTenant(url, { method: 'GET', headers });
  if (!response.ok) throw response;
  return response.json();
};

export const deleteEntityGeneric = async (
  url: string,
  body?: unknown,
  token?: string | null
): Promise<{ response: Response; data: unknown }> => {
  const headers = await getAuthHeaders(token);
  const options: RequestInit = { method: 'DELETE', headers};
  if (body) options.body = JSON.stringify(body);

  const response = await fetchWithTenant(url, options);
  if (!response.ok) throw response;

  const contentType = response.headers.get('content-type');
  const hasJsonBody = response.status !== 204 && contentType?.includes('application/json');
  const data = hasJsonBody ? await response.json() : null;
  return { response, data };
};

export const performActionGeneric = async (
  url: string,
  method: string,
  body: unknown,
  token?: string | null
): Promise<Response> => {
  const headers = await getAuthHeaders(token);
  const response = await fetchWithTenant(url, {
    method,
    headers,
    body: JSON.stringify(body),
  });
  if (!response.ok) throw response;
  return response;
};

export const downloadFileGeneric = async (
  url: string,
  fileName: string,
  type: string,
  token?: string | null
): Promise<boolean> => {
  const headers = await getAuthHeaders(token);

  const now = new Date();
  const formattedDate = now.toLocaleDateString().replace(/\//g, '-');
  const formattedTime = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  const currentDateTime = `${formattedDate}__${formattedTime}`;

  try {
    const response = await fetchWithTenant(url, { method: 'GET', headers});

    if (!response.ok) {
      let errorData: Record<string, unknown> | null = null;
      let errorText: string | null = null;

      try {
        errorData = await response.clone().json();
      } catch {
        try {
          errorText = await response.clone().text();
        } catch {
          errorText = 'No se pudo leer el contenido del error';
        }
      }

      const errorMessage = errorData
        ? getErrorMessage(errorData)
        : errorText || `Error HTTP ${response.status}: ${response.statusText}`;
      const detailedError = {
        type: 'HTTP_ERROR',
        status: response.status,
        statusText: response.statusText,
        url,
        data: errorData,
        text: errorText,
        message: errorMessage,
      };
      console.error('Error durante la descarga del archivo:', detailedError);
      throw detailedError;
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${fileName}__${currentDateTime}.${type === 'excel' ? 'xls' : type === 'xlsx' ? 'xlsx' : 'pdf'}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
    return true;
  } catch (error) {
    let errorType = 'UNKNOWN';
    let errorMessage = 'Error desconocido durante la descarga del archivo';
    const err = error as Record<string, unknown>;

    if (err['type'] === 'HTTP_ERROR') {
      errorType = 'HTTP_ERROR';
      errorMessage = err['message'] as string;
    } else if (error instanceof TypeError && (error as TypeError).message.includes('body stream already read')) {
      errorType = 'STREAM_READ_ERROR';
      errorMessage = 'Error: El stream de respuesta ya fue leído';
    } else if (error instanceof TypeError) {
      errorType = 'TYPE_ERROR';
      errorMessage = `Error de tipo: ${(error as TypeError).message}`;
    } else if (error instanceof Error && error.name === 'NetworkError') {
      errorType = 'NETWORK_ERROR';
      errorMessage = 'Error de red durante la descarga';
    } else if (error instanceof Error && error.name === 'AbortError') {
      errorType = 'ABORT_ERROR';
      errorMessage = 'La descarga fue cancelada';
    }

    const detailedError = { type: errorType, message: errorMessage, originalError: error, url, fileName, fileType: type };
    console.error('Error durante la descarga del archivo:', detailedError);
    throw detailedError;
  }
};
