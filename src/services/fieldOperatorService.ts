import { fetchWithTenant } from '@lib/fetchWithTenant';
import { API_URL_V2 } from '@/configs/config';
import { getErrorMessage, ApiError } from '@/lib/api/apiHelpers';
import { getUserAgent } from '@/lib/utils/getUserAgent';

type QueryValue = string | number | boolean | null | undefined;
type QueryParams = Record<string, QueryValue>;
type RequestPayload = Record<string, unknown>;

function buildQuery(params: QueryParams = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value == null || value === '') return;
    query.append(key, String(value));
  });
  return query.toString();
}

function getHeaders(token?: string | null) {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    'User-Agent': getUserAgent(),
  };
}

async function handleResponse(response: Response, fallbackMessage: string) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(getErrorMessage(data) || fallbackMessage, response.status, data);
  }
  return data;
}

export async function getFieldCustomersOptions(token: string) {
  const response = await fetchWithTenant(`${API_URL_V2}field/customers/options`, {
    method: 'GET',
    headers: getHeaders(token),
  });
  return handleResponse(response, 'Error al obtener clientes operativos');
}

export async function getFieldProductsOptions(token: string) {
  const response = await fetchWithTenant(`${API_URL_V2}field/products/options`, {
    method: 'GET',
    headers: getHeaders(token),
  });
  return handleResponse(response, 'Error al obtener productos operativos');
}

export async function getFieldTaxesOptions(token: string) {
  const response = await fetchWithTenant(`${API_URL_V2}field/taxes/options`, {
    method: 'GET',
    headers: getHeaders(token),
  });
  return handleResponse(response, 'Error al obtener impuestos operativos');
}

export async function getFieldOrders(token: string, params: QueryParams = {}) {
  const qs = buildQuery(params);
  const response = await fetchWithTenant(`${API_URL_V2}field/orders${qs ? `?${qs}` : ''}`, {
    method: 'GET',
    headers: getHeaders(token),
  });
  return handleResponse(response, 'Error al obtener pedidos operativos');
}

export async function getFieldOrder(token: string, orderId: number | string) {
  const response = await fetchWithTenant(`${API_URL_V2}field/orders/${orderId}`, {
    method: 'GET',
    headers: getHeaders(token),
  });
  return handleResponse(response, 'Error al obtener el pedido operativo');
}

export async function updateFieldOrder(
  token: string,
  orderId: number | string,
  payload: RequestPayload
) {
  const response = await fetchWithTenant(`${API_URL_V2}field/orders/${orderId}`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify(payload),
  });
  return handleResponse(response, 'Error al actualizar el pedido operativo');
}

export async function createFieldAutoventa(token: string, payload: RequestPayload) {
  const response = await fetchWithTenant(`${API_URL_V2}field/autoventas`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(payload),
  });
  return handleResponse(response, 'Error al crear la autoventa operativa');
}

export async function getFieldRoutes(token: string, params: QueryParams = {}) {
  const qs = buildQuery(params);
  const response = await fetchWithTenant(`${API_URL_V2}field/routes${qs ? `?${qs}` : ''}`, {
    method: 'GET',
    headers: getHeaders(token),
  });
  return handleResponse(response, 'Error al obtener rutas operativas');
}

export async function getFieldRoute(token: string, routeId: number | string) {
  const response = await fetchWithTenant(`${API_URL_V2}field/routes/${routeId}`, {
    method: 'GET',
    headers: getHeaders(token),
  });
  return handleResponse(response, 'Error al obtener la ruta operativa');
}

export async function updateFieldRouteStop(
  token: string,
  routeId: number | string,
  stopId: number | string,
  payload: RequestPayload
) {
  const response = await fetchWithTenant(`${API_URL_V2}field/routes/${routeId}/stops/${stopId}`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify(payload),
  });
  return handleResponse(response, 'Error al actualizar la parada');
}

export async function getFieldOperatorsOptions(token: string) {
  const response = await fetchWithTenant(`${API_URL_V2}field-operators/options`, {
    method: 'GET',
    headers: getHeaders(token),
  });
  return handleResponse(response, 'Error al obtener repartidores');
}

export async function getRouteTemplates(token: string, params: QueryParams = {}) {
  const qs = buildQuery(params);
  const response = await fetchWithTenant(`${API_URL_V2}route-templates${qs ? `?${qs}` : ''}`, {
    method: 'GET',
    headers: getHeaders(token),
  });
  return handleResponse(response, 'Error al obtener plantillas de ruta');
}

export async function createRouteTemplate(token: string, payload: RequestPayload) {
  const response = await fetchWithTenant(`${API_URL_V2}route-templates`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(payload),
  });
  return handleResponse(response, 'Error al crear la plantilla');
}

export async function updateRouteTemplate(
  token: string,
  templateId: number | string,
  payload: RequestPayload
) {
  const response = await fetchWithTenant(`${API_URL_V2}route-templates/${templateId}`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify(payload),
  });
  return handleResponse(response, 'Error al actualizar la plantilla');
}

export async function getRoutes(token: string, params: QueryParams = {}) {
  const qs = buildQuery(params);
  const response = await fetchWithTenant(`${API_URL_V2}routes${qs ? `?${qs}` : ''}`, {
    method: 'GET',
    headers: getHeaders(token),
  });
  return handleResponse(response, 'Error al obtener rutas');
}

export async function getRoute(token: string, routeId: number | string) {
  const response = await fetchWithTenant(`${API_URL_V2}routes/${routeId}`, {
    method: 'GET',
    headers: getHeaders(token),
  });
  return handleResponse(response, 'Error al obtener la ruta');
}

export async function createRoute(token: string, payload: RequestPayload) {
  const response = await fetchWithTenant(`${API_URL_V2}routes`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(payload),
  });
  return handleResponse(response, 'Error al crear la ruta');
}

export async function updateRoute(
  token: string,
  routeId: number | string,
  payload: RequestPayload
) {
  const response = await fetchWithTenant(`${API_URL_V2}routes/${routeId}`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify(payload),
  });
  return handleResponse(response, 'Error al actualizar la ruta');
}
