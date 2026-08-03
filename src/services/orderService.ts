/**
 * Order Service - API client for order-related endpoints
 * @module services/orderService
 */

import { fetchWithTenant } from '@/lib/fetchWithTenant';
import { API_URL_V2 } from '@/configs/config';
import { getAuthToken } from '@/lib/auth/getAuthToken';
import { getErrorMessage, handleServiceResponse, ApiError } from '@/lib/api/apiHelpers';
import { getUserAgent } from '@/lib/utils/getUserAgent';

import type {
  Order,
  OrderPayload,
  OrderPlannedProductDetailPayload,
  AuxiliaryOrderLine,
  AuxiliaryOrderLinePayload,
  OrderCostAnalysisSummary,
  OrderCostAnalysisProductLine,
  OrderCostAnalysisPallet,
  OrderCostAnalysisResponse,
  OrdersProfitabilitySummaryParams,
  OrdersProfitabilityExportJobParams,
  OrdersProfitabilityExportJobStatus,
  OrdersProfitabilityExportJob,
  OrdersProfitabilityExportDownload,
  OrdersProfitabilityTimelineParams,
  OrdersProfitabilityProductsParams,
  OrdersProfitabilitySalePriceAlert,
  ProfitabilitySummaryResponse,
  ProfitabilityTimelinePoint,
  ProfitabilityTimelineResponse,
  ProfitabilityProductItem,
  ProfitabilityProductsResponse,
  ProfitabilitySummaryJob,
  ProfitabilityProductsJob,
  OrderIncidentPayload,
  OrderRankingStatsParams,
  SalesChartParams,
  AuxiliaryLinesTotalAmountStats,
  AuxiliaryLinesByProductStat,
  AuxiliaryLinesByCustomerStat,
  AuxiliaryLinesChartPoint,
  TransportChartParams,
  OrderStatus,
} from '@/types/orders';

// Re-exportado por compatibilidad de transición — los tipos de dominio de orders
// viven en @/types/orders (GAP-V2-032); importar desde ahí en código nuevo.
export type {
  Order,
  OrderPayload,
  OrderPlannedProductDetailPayload,
  AuxiliaryOrderLine,
  AuxiliaryOrderLinePayload,
  OrderCostAnalysisSummary,
  OrderCostAnalysisProductLine,
  OrderCostAnalysisPallet,
  OrderCostAnalysisResponse,
  OrdersProfitabilitySummaryParams,
  OrdersProfitabilityExportJobParams,
  OrdersProfitabilityExportJobStatus,
  OrdersProfitabilityExportJob,
  OrdersProfitabilityExportDownload,
  OrdersProfitabilityTimelineParams,
  OrdersProfitabilityProductsParams,
  OrdersProfitabilitySalePriceAlert,
  ProfitabilitySummaryResponse,
  ProfitabilityTimelinePoint,
  ProfitabilityTimelineResponse,
  ProfitabilityProductItem,
  ProfitabilityProductsResponse,
  ProfitabilitySummaryJob,
  ProfitabilityProductsJob,
  OrderIncidentPayload,
  OrderRankingStatsParams,
  SalesChartParams,
  AuxiliaryLinesTotalAmountStats,
  AuxiliaryLinesByProductStat,
  AuxiliaryLinesByCustomerStat,
  AuxiliaryLinesChartPoint,
  TransportChartParams,
  OrderStatus,
} from '@/types/orders';

/**
 * Punto único de construcción de la petición HTTP para todo este service:
 * obtiene el token, fusiona los headers comunes (Content-Type, Authorization,
 * User-Agent) con los headers específicos de cada llamada, y delega en
 * fetchWithTenant. Devuelve la Response sin parsear — cada función decide cómo
 * leerla (JSON u blob) según su contrato de retorno.
 */
async function orderFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAuthToken();
  return fetchWithTenant(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
      ...options.headers,
    },
  });
}

function buildProfitabilityQuery(
  params: OrdersProfitabilitySummaryParams & { granularity?: string }
): URLSearchParams {
  const query = new URLSearchParams({
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  });

  if (params.granularity) {
    query.append('granularity', params.granularity);
  }

  for (const productId of params.productIds ?? []) {
    const normalizedId = String(productId);
    if (normalizedId && normalizedId !== 'all') {
      query.append('productIds[]', normalizedId);
    }
  }

  return query;
}

function unwrapProfitabilityExportJob(data: unknown): OrdersProfitabilityExportJob {
  return ((data as { data?: OrdersProfitabilityExportJob })?.data ??
    data) as OrdersProfitabilityExportJob;
}

function unwrapProfitabilityJob<T>(data: unknown): T {
  return ((data as { data?: T })?.data ?? data) as T;
}

/**
 * Señal de que el rango de fechas supera el límite de la consulta síncrona de
 * rentabilidad (60 días, backend Sprint 4 2026-08-03) — distinguible de otros
 * errores para que el hook pueda hacer fallback automático al flujo async
 * (POST .../jobs + polling) sin depender de parsear el mensaje.
 */
export class ProfitabilityRangeTooLargeError extends Error {
  constructor() {
    super('El rango de fechas no puede superar 60 días en la consulta síncrona.');
    this.name = 'ProfitabilityRangeTooLargeError';
  }
}

function normalizeProfitabilityProductIds(productIds?: Array<string | number>): number[] {
  return (productIds ?? [])
    .map((productId) => Number(productId))
    .filter((productId) => Number.isFinite(productId));
}

function buildProfitabilityExportJobPayload(params: OrdersProfitabilityExportJobParams): Required<
  Pick<OrdersProfitabilityExportJobParams, 'dateFrom' | 'dateTo' | 'onlyMissingCosts'>
> & {
  productIds: number[];
} {
  return {
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    productIds: normalizeProfitabilityProductIds(params.productIds),
    onlyMissingCosts: params.onlyMissingCosts ?? true,
  };
}

function normalizeProfitabilityExportDownloadUrl(downloadUrl: string): string {
  if (downloadUrl.startsWith('http://') || downloadUrl.startsWith('https://')) {
    return downloadUrl;
  }

  if (downloadUrl.startsWith('/api/v2/')) {
    return `${API_URL_V2}${downloadUrl.replace(/^\/api\/v2\//, '')}`;
  }

  if (downloadUrl.startsWith('/api-backend/')) {
    return downloadUrl;
  }

  return `${API_URL_V2}${downloadUrl.replace(/^\/+/, '')}`;
}

function getFilenameFromContentDisposition(contentDisposition: string | null): string | null {
  if (!contentDisposition) return null;

  const encodedMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (encodedMatch?.[1]) {
    return decodeURIComponent(encodedMatch[1].replace(/"/g, ''));
  }

  const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
  return filenameMatch?.[1] ?? null;
}

/**
 * Fetches the details of an order by its ID.
 */
export async function getOrder(orderId: string): Promise<Order | null> {
  const response = await orderFetch(`${API_URL_V2}orders/${orderId}`, { method: 'GET' });
  const data = await handleServiceResponse(response, null, 'Error al obtener el pedido');
  if (!data) return null;
  return (data.data || data) as Order;
}

/**
 * Fetches detailed cost analysis for an order.
 */
export async function getOrderCostAnalysis(
  orderId: string | number
): Promise<OrderCostAnalysisResponse | null> {
  const response = await orderFetch(`${API_URL_V2}orders/${orderId}/cost-analysis`, {
    method: 'GET',
  });
  const data = await handleServiceResponse(
    response,
    null,
    'Error al obtener el análisis económico'
  );
  if (!data) return null;
  return (data.data || data) as OrderCostAnalysisResponse;
}

/**
 * Updates an order with the given data.
 *
 * Mantiene el parseo de error manual con `ApiError` (no `handleServiceResponse`)
 * porque `OrderEditSheet` depende de `error.status === 422` y `error.data.errors`
 * para mapear errores de validación a los campos del formulario.
 */
export async function updateOrder(
  orderId: string,
  orderData: OrderPayload
): Promise<Order | undefined> {
  const response = await orderFetch(`${API_URL_V2}orders/${orderId}`, {
    method: 'PUT',
    headers: { Accept: 'application/json' },
    body: JSON.stringify(orderData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new ApiError(
      getErrorMessage(errorData) || 'Error al actualizar el pedido',
      response.status,
      errorData
    );
  }
  const data: { data?: Order } | Order = await response.json();
  return (data && typeof data === 'object' && 'data' in data ? data.data : data) as
    | Order
    | undefined;
}

/**
 * Normalizes a raw order from the list endpoint.
 * The list endpoint (/orders/active) returns a lighter response than the detail endpoint:
 * - `externalProcessor` may be null even when `externalProcessorId` is set (relation not eager-loaded)
 * - `orderType` may come as `order_type` (snake_case) in some API versions
 * This ensures the UI always has consistent field names for badge rendering.
 */
function normalizeActiveOrder(order: Record<string, unknown>): Order {
  const normalized: Record<string, unknown> = { ...order };

  if (!normalized.orderType && normalized.order_type) {
    normalized.orderType = normalized.order_type;
  }

  if (!normalized.externalProcessor && normalized.externalProcessorId) {
    normalized.externalProcessor = { id: normalized.externalProcessorId };
  }

  return normalized as Order;
}

/**
 * Fetches the active orders from the API.
 */
export async function getActiveOrders(): Promise<Order[]> {
  const response = await orderFetch(`${API_URL_V2}orders/active`, { method: 'GET' });
  const data: Order[] | { data?: Order[] } | null = await handleServiceResponse(
    response,
    null,
    'Error al obtener los pedidos activos'
  );
  const raw: Order[] = Array.isArray(data)
    ? data
    : Array.isArray((data as { data?: Order[] } | null)?.data)
      ? (data as { data: Order[] }).data
      : [];
  return raw.map((order) => normalizeActiveOrder(order));
}

/**
 * Downloads the XLS report of active planned products.
 *
 * Descarga de blob sin cuerpo JSON de error estructurado — no se unifica con
 * `handleServiceResponse` (pensado para respuestas JSON).
 */
export async function downloadActivePlannedProductsXls(): Promise<Blob> {
  const response = await orderFetch(`${API_URL_V2}orders/xlsx/active-planned-products`, {
    method: 'GET',
  });
  if (!response.ok) throw new Error(`Error ${response.status} al exportar`);
  return response.blob();
}

/**
 * Updates the planned product detail of an order.
 */
export async function updateOrderPlannedProductDetail(
  detailId: string,
  detailData: OrderPlannedProductDetailPayload
): Promise<unknown> {
  const response = await orderFetch(`${API_URL_V2}order-planned-product-details/${detailId}`, {
    method: 'PUT',
    headers: { Accept: 'application/json' },
    body: JSON.stringify(detailData),
  });

  const data = await handleServiceResponse(
    response,
    null,
    'Error al actualizar la linea del pedido'
  );
  return data?.data;
}

/**
 * Deletes the planned product detail of an order.
 */
export async function deleteOrderPlannedProductDetail(detailId: string): Promise<unknown> {
  const response = await orderFetch(`${API_URL_V2}order-planned-product-details/${detailId}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  });

  const data = await handleServiceResponse(response, null, 'Error al eliminar la linea del pedido');
  return data?.data;
}

/**
 * Creates a planned product detail for an order.
 */
export async function createOrderPlannedProductDetail(
  detailData: OrderPlannedProductDetailPayload
): Promise<unknown> {
  const response = await orderFetch(`${API_URL_V2}order-planned-product-details`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: JSON.stringify(detailData),
  });

  const data = await handleServiceResponse(response, null, 'Error al crear la linea del pedido');
  return data?.data;
}

/**
 * Fetches the auxiliary lines of an order.
 */
export async function getOrderAuxiliaryLines(orderId: string): Promise<AuxiliaryOrderLine[]> {
  const response = await orderFetch(`${API_URL_V2}orders/${orderId}/auxiliary-lines`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  const data = await handleServiceResponse(
    response,
    null,
    'Error al obtener las líneas auxiliares'
  );
  return data?.data ?? [];
}

/**
 * Creates an auxiliary line for an order.
 */
export async function createOrderAuxiliaryLine(
  orderId: string,
  lineData: AuxiliaryOrderLinePayload
): Promise<AuxiliaryOrderLine> {
  const response = await orderFetch(`${API_URL_V2}orders/${orderId}/auxiliary-lines`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: JSON.stringify(lineData),
  });

  const data = await handleServiceResponse(response, null, 'Error al crear la línea auxiliar');
  return data?.data;
}

/**
 * Updates an auxiliary line of an order.
 */
export async function updateOrderAuxiliaryLine(
  orderId: string,
  lineId: string,
  lineData: AuxiliaryOrderLinePayload
): Promise<AuxiliaryOrderLine> {
  const response = await orderFetch(`${API_URL_V2}orders/${orderId}/auxiliary-lines/${lineId}`, {
    method: 'PATCH',
    headers: { Accept: 'application/json' },
    body: JSON.stringify(lineData),
  });

  const data = await handleServiceResponse(response, null, 'Error al actualizar la línea auxiliar');
  return data?.data;
}

/**
 * Deletes an auxiliary line of an order.
 */
export async function deleteOrderAuxiliaryLine(orderId: string, lineId: string): Promise<void> {
  const response = await orderFetch(`${API_URL_V2}orders/${orderId}/auxiliary-lines/${lineId}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  });

  await handleServiceResponse(response, null, 'Error al eliminar la línea auxiliar');
}

/**
 * Updates the status of an order.
 */
export async function setOrderStatus(orderId: string, status: OrderStatus): Promise<unknown> {
  const response = await orderFetch(`${API_URL_V2}orders/${orderId}/status`, {
    method: 'PUT',
    headers: { Accept: 'application/json' },
    body: JSON.stringify({ status }),
  });

  const data = await handleServiceResponse(response, null, 'Error al actualizar el pedido');
  return data?.data;
}

/**
 * Creates an incident for an order.
 */
export async function createOrderIncident(orderId: string, description: string): Promise<unknown> {
  const response = await orderFetch(`${API_URL_V2}orders/${orderId}/incident`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: JSON.stringify({ description }),
  });

  return handleServiceResponse(response, null, 'Error al crear la incidencia');
}

/**
 * Updates an order incident with resolution.
 */
export async function updateOrderIncident(
  orderId: string,
  resolutionType: string,
  resolutionNotes: string
): Promise<unknown> {
  const response = await orderFetch(`${API_URL_V2}orders/${orderId}/incident`, {
    method: 'PUT',
    headers: { Accept: 'application/json' },
    body: JSON.stringify({
      resolution_type: resolutionType,
      resolution_notes: resolutionNotes,
    }),
  });

  return handleServiceResponse(response, null, 'Error al resolver la incidencia');
}

/**
 * Deletes an order incident.
 */
export async function destroyOrderIncident(orderId: string): Promise<unknown> {
  const response = await orderFetch(`${API_URL_V2}orders/${orderId}/incident`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  });

  return handleServiceResponse(response, null, 'Error al eliminar la incidencia');
}

/**
 * Fetches active orders options.
 */
export async function getActiveOrdersOptions(): Promise<unknown> {
  const response = await orderFetch(`${API_URL_V2}active-orders/options`, { method: 'GET' });
  return handleServiceResponse(response, null, 'Error al obtener los pedidos activos');
}

/**
 * Fetches production view data.
 */
export async function getProductionViewData(): Promise<unknown[]> {
  const response = await orderFetch(`${API_URL_V2}orders/production-view`, { method: 'GET' });
  const data = await handleServiceResponse(
    response,
    null,
    'Error al obtener los datos de producción'
  );
  if (
    data &&
    typeof data === 'object' &&
    'data' in data &&
    Array.isArray((data as { data?: unknown[] }).data)
  ) {
    return (data as { data: unknown[] }).data;
  }
  if (Array.isArray(data)) return data;
  return [];
}

/**
 * Fetches order ranking statistics.
 */
export async function getOrderRankingStats(params: OrderRankingStatsParams): Promise<unknown> {
  const query = new URLSearchParams({
    groupBy: params.groupBy,
    valueType: params.valueType,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  });

  if (params.speciesId && params.speciesId !== 'all') {
    query.append('speciesId', params.speciesId);
  }

  const response = await orderFetch(`${API_URL_V2}statistics/orders/ranking?${query.toString()}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  return handleServiceResponse(response, null, 'Error al obtener el ranking de pedidos');
}

/**
 * Fetches sales by salesperson.
 */
export async function getSalesBySalesperson(params: {
  dateFrom: string;
  dateTo: string;
}): Promise<unknown> {
  const query = new URLSearchParams(params);
  const response = await orderFetch(
    `${API_URL_V2}orders/sales-by-salesperson?${query.toString()}`,
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
    }
  );

  return handleServiceResponse(response, null, 'Error al obtener las ventas por comercial');
}

/**
 * Fetches total net weight stats for orders.
 */
export async function getOrdersTotalNetWeightStats(params: {
  dateFrom: string;
  dateTo: string;
}): Promise<unknown> {
  const query = new URLSearchParams(params);
  const response = await orderFetch(
    `${API_URL_V2}statistics/orders/total-net-weight?${query.toString()}`,
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
    }
  );

  return handleServiceResponse(response, null, 'Error al obtener la cantidad total vendida');
}

/**
 * Fetches total amount stats for orders.
 */
export async function getOrdersTotalAmountStats(params: {
  dateFrom: string;
  dateTo: string;
  includeAuxiliary?: boolean;
}): Promise<unknown> {
  const { includeAuxiliary, ...rest } = params;
  const query = new URLSearchParams(rest);
  if (includeAuxiliary) {
    query.set('includeAuxiliary', 'true');
  }
  const response = await orderFetch(
    `${API_URL_V2}statistics/orders/total-amount?${query.toString()}`,
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
    }
  );

  return handleServiceResponse(response, null, 'Error al obtener el importe total vendido');
}

/**
 * Fetches total amount stats for auxiliary lines, with previous-year comparison.
 */
export async function getAuxiliaryLinesTotalAmountStats(params: {
  dateFrom: string;
  dateTo: string;
}): Promise<AuxiliaryLinesTotalAmountStats> {
  const query = new URLSearchParams(params);
  const response = await orderFetch(
    `${API_URL_V2}statistics/auxiliary-lines/total-amount?${query.toString()}`,
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
    }
  );

  return handleServiceResponse(
    response,
    null,
    'Error al obtener el importe total de líneas auxiliares'
  );
}

/**
 * Fetches auxiliary lines ranking by product.
 */
export async function getAuxiliaryLinesByProductStats(params: {
  dateFrom: string;
  dateTo: string;
}): Promise<AuxiliaryLinesByProductStat[]> {
  const query = new URLSearchParams(params);
  const response = await orderFetch(
    `${API_URL_V2}statistics/auxiliary-lines/by-product?${query.toString()}`,
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
    }
  );

  return handleServiceResponse(
    response,
    null,
    'Error al obtener el ranking de líneas auxiliares por artículo'
  );
}

/**
 * Fetches auxiliary lines ranking by customer.
 */
export async function getAuxiliaryLinesByCustomerStats(params: {
  dateFrom: string;
  dateTo: string;
}): Promise<AuxiliaryLinesByCustomerStat[]> {
  const query = new URLSearchParams(params);
  const response = await orderFetch(
    `${API_URL_V2}statistics/auxiliary-lines/by-customer?${query.toString()}`,
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
    }
  );

  return handleServiceResponse(
    response,
    null,
    'Error al obtener el ranking de líneas auxiliares por cliente'
  );
}

/**
 * Fetches auxiliary lines time series (chart data).
 */
export async function getAuxiliaryLinesChartData(params: {
  dateFrom: string;
  dateTo: string;
  groupBy?: 'day' | 'week' | 'month';
}): Promise<AuxiliaryLinesChartPoint[]> {
  const query = new URLSearchParams({
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    groupBy: params.groupBy ?? 'day',
  });
  const response = await orderFetch(
    `${API_URL_V2}statistics/auxiliary-lines/chart-data?${query.toString()}`,
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
    }
  );

  return handleServiceResponse(
    response,
    null,
    'Error al obtener la serie temporal de líneas auxiliares'
  );
}

/**
 * Fetches profitability summary stats for orders.
 */
export async function getOrdersProfitabilitySummary(
  params: OrdersProfitabilitySummaryParams
): Promise<ProfitabilitySummaryResponse> {
  const query = buildProfitabilityQuery(params);
  const response = await orderFetch(
    `${API_URL_V2}statistics/orders/profitability-summary?${query.toString()}`,
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
    }
  );

  if (response.status === 422) {
    throw new ProfitabilityRangeTooLargeError();
  }

  const data = await handleServiceResponse(
    response,
    null,
    'Error al obtener el resumen de rentabilidad'
  );

  return ((data as { data?: ProfitabilitySummaryResponse })?.data ??
    data) as ProfitabilitySummaryResponse;
}

/**
 * Crea un job asíncrono para calcular el resumen de rentabilidad — usar cuando
 * el rango de fechas supera 60 días (o tras un 422 de getOrdersProfitabilitySummary).
 */
export async function createOrdersProfitabilitySummaryJob(
  params: OrdersProfitabilitySummaryParams
): Promise<ProfitabilitySummaryJob> {
  const response = await orderFetch(`${API_URL_V2}statistics/orders/profitability-summary/jobs`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: JSON.stringify({
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      productIds: normalizeProfitabilityProductIds(params.productIds),
    }),
  });

  const data = await handleServiceResponse(
    response,
    null,
    'Error al iniciar el cálculo de rentabilidad'
  );

  return unwrapProfitabilityJob<ProfitabilitySummaryJob>(data);
}

/**
 * Consulta el estado/resultado de un job de resumen de rentabilidad (polling).
 */
export async function getOrdersProfitabilitySummaryJob(id: string): Promise<ProfitabilitySummaryJob> {
  const response = await orderFetch(
    `${API_URL_V2}statistics/orders/profitability-summary/jobs/${id}`,
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
    }
  );

  const data = await handleServiceResponse(
    response,
    null,
    'Error al consultar el cálculo de rentabilidad'
  );

  return unwrapProfitabilityJob<ProfitabilitySummaryJob>(data);
}

/**
 * Creates an async profitability export job for orders.
 */
export async function createOrdersProfitabilityExportJob(
  params: OrdersProfitabilityExportJobParams
): Promise<OrdersProfitabilityExportJob> {
  const response = await orderFetch(
    `${API_URL_V2}statistics/orders/profitability-summary/export-jobs`,
    {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: JSON.stringify(buildProfitabilityExportJobPayload(params)),
    }
  );

  const data = await handleServiceResponse(
    response,
    null,
    'Error al crear la exportacion de rentabilidad'
  );

  return unwrapProfitabilityExportJob(data);
}

/**
 * Fetches the current status of an async profitability export job.
 */
export async function getOrdersProfitabilityExportJob(
  id: string
): Promise<OrdersProfitabilityExportJob> {
  const response = await orderFetch(
    `${API_URL_V2}statistics/orders/profitability-summary/export-jobs/${id}`,
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
    }
  );

  const data = await handleServiceResponse(
    response,
    null,
    'Error al consultar la exportacion de rentabilidad'
  );

  return unwrapProfitabilityExportJob(data);
}

/**
 * Downloads a finished async profitability export job.
 *
 * Descarga de blob con nombre de fichero leído de `content-disposition` — no se
 * unifica con `handleServiceResponse` (pensado para respuestas JSON).
 */
export async function downloadOrdersProfitabilityExportJob(
  downloadUrl: string
): Promise<OrdersProfitabilityExportDownload> {
  const response = await orderFetch(normalizeProfitabilityExportDownloadUrl(downloadUrl), {
    method: 'GET',
    headers: {
      Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
  });

  if (!response.ok) {
    let errorData: unknown = null;
    try {
      errorData = await response.json();
    } catch (_error) {
      errorData = { message: `Error ${response.status} al descargar la exportacion` };
    }

    throw new Error(
      getErrorMessage(errorData as object) || 'Error al descargar la exportacion de rentabilidad'
    );
  }

  return {
    blob: await response.blob(),
    filename:
      getFilenameFromContentDisposition(response.headers.get('content-disposition')) ??
      'rentabilidad.xlsx',
  };
}

/**
 * Fetches profitability timeline stats for orders.
 */
export async function getOrdersProfitabilityTimeline(
  params: OrdersProfitabilityTimelineParams
): Promise<ProfitabilityTimelineResponse> {
  const query = buildProfitabilityQuery(params);
  const response = await orderFetch(
    `${API_URL_V2}statistics/orders/profitability-timeline?${query.toString()}`,
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
    }
  );

  const data = await handleServiceResponse(
    response,
    null,
    'Error al obtener la evolución de rentabilidad'
  );

  return ((data as { data?: ProfitabilityTimelineResponse })?.data ??
    data) as ProfitabilityTimelineResponse;
}

/**
 * Fetches profitability by products stats for orders.
 */
export async function getOrdersProfitabilityProducts(
  params: OrdersProfitabilityProductsParams
): Promise<ProfitabilityProductsResponse> {
  const query = new URLSearchParams({
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  });

  const response = await orderFetch(
    `${API_URL_V2}statistics/orders/profitability-products?${query.toString()}`,
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
    }
  );

  if (response.status === 422) {
    throw new ProfitabilityRangeTooLargeError();
  }

  const data = await handleServiceResponse(
    response,
    null,
    'Error al obtener la rentabilidad por producto'
  );

  return ((data as { data?: ProfitabilityProductsResponse })?.data ??
    data) as ProfitabilityProductsResponse;
}

/**
 * Crea un job asíncrono para calcular la rentabilidad por producto — usar cuando
 * el rango de fechas supera 60 días (o tras un 422 de getOrdersProfitabilityProducts).
 */
export async function createOrdersProfitabilityProductsJob(
  params: OrdersProfitabilityProductsParams
): Promise<ProfitabilityProductsJob> {
  const response = await orderFetch(`${API_URL_V2}statistics/orders/profitability-products/jobs`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: JSON.stringify({
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
    }),
  });

  const data = await handleServiceResponse(
    response,
    null,
    'Error al iniciar el cálculo de rentabilidad por producto'
  );

  return unwrapProfitabilityJob<ProfitabilityProductsJob>(data);
}

/**
 * Consulta el estado/resultado de un job de rentabilidad por producto (polling).
 */
export async function getOrdersProfitabilityProductsJob(
  id: string
): Promise<ProfitabilityProductsJob> {
  const response = await orderFetch(
    `${API_URL_V2}statistics/orders/profitability-products/jobs/${id}`,
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
    }
  );

  const data = await handleServiceResponse(
    response,
    null,
    'Error al consultar el cálculo de rentabilidad por producto'
  );

  return unwrapProfitabilityJob<ProfitabilityProductsJob>(data);
}

/**
 * Fetches sales chart data.
 */
export async function getSalesChartData(params: SalesChartParams): Promise<unknown[]> {
  const query = new URLSearchParams({
    dateFrom: params.from,
    dateTo: params.to,
    valueType: params.unit,
    groupBy: params.groupBy,
  });

  if (params.speciesId && params.speciesId !== 'all') {
    query.append('speciesId', params.speciesId);
  }
  if (params.categoryId && params.categoryId !== 'all') {
    query.append('categoryId', params.categoryId);
  }
  if (params.familyId && params.familyId !== 'all') {
    query.append('familyId', params.familyId);
  }

  const response = await orderFetch(`${API_URL_V2}orders/sales-chart-data?${query.toString()}`, {
    method: 'GET',
  });
  const result = await handleServiceResponse(
    response,
    [],
    'Error al obtener datos del gráfico de ventas'
  );
  if (!result) return [];

  return (result as { data?: unknown[] })?.data ?? (result as unknown[]);
}

/**
 * Fetches transport chart data.
 * @param params - { from, to, token } - date range and auth token
 */
export async function getTransportChartData(params: TransportChartParams): Promise<unknown> {
  const query = new URLSearchParams({
    dateFrom: params.from,
    dateTo: params.to,
  });

  const response = await orderFetch(
    `${API_URL_V2}orders/transport-chart-data?${query.toString()}`,
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
    }
  );

  return handleServiceResponse(response, null, 'Error al obtener los datos de transporte');
}

/**
 * Creates a new order.
 *
 * Mantiene el parseo de error manual con `ApiError` (no `handleServiceResponse`)
 * porque `CreateOrderForm` depende de `error.status === 422` y `error.data.errors`
 * para mapear errores de validación a los campos del formulario.
 */
export const createOrder = async (orderPayload: OrderPayload): Promise<Order> => {
  const response = await orderFetch(`${API_URL_V2}orders`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: JSON.stringify(orderPayload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new ApiError(
      getErrorMessage(errorData) || `Error ${response.status}: Error al crear el pedido.`,
      response.status,
      errorData
    );
  }

  const data = await response.json();
  return data.data as Order;
};
