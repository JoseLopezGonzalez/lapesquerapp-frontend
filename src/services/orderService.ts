/**
 * Order Service - API client for order-related endpoints
 * @module services/orderService
 */

import { fetchWithTenant } from '@lib/fetchWithTenant';
import { API_URL_V2 } from '@/configs/config';
import { getAuthToken } from '@/lib/auth/getAuthToken';
import { getErrorMessage, handleServiceResponse, ApiError } from '@/lib/api/apiHelpers';
import { getUserAgent } from '@/lib/utils/getUserAgent';

/** Auth token for API requests */
type AuthToken = string;

/** Order payload for create/update */
export interface OrderPayload {
  [key: string]: unknown;
}

/** Order data from API */
export interface Order {
  id: number | string;
  orderType?: 'standard' | 'autoventa';
  revenuePerKg?: number | null;
  totalCost?: number | null;
  costPerKg?: number | null;
  grossMargin?: number | null;
  marginPercentage?: number | null;
  marginPerKg?: number | null;
  [key: string]: unknown;
}

/** Order planned product detail payload */
export interface OrderPlannedProductDetailPayload {
  [key: string]: unknown;
}

export interface OrderCostAnalysisSummary {
  totalRevenue: number;
  totalCost: number | null;
  grossMargin: number | null;
  marginPercentage: number | null;
}

export interface OrderCostAnalysisProductLine {
  product: {
    id: number;
    name: string;
  };
  unitPrice: number;
  taxRate: number;
  lineWeightKg: number;
  lineRevenue: number;
  lineRevenueWithTax: number;
  revenuePerKg?: number | null;
  lineCost: number | null;
  costPerKg?: number | null;
  lineMargin: number | null;
  lineMarginPct: number | null;
  marginPerKg?: number | null;
}

export interface OrderCostAnalysisPallet {
  palletId: number;
  totalWeightKg: number;
  totalRevenue?: number | null;
  revenuePerKg?: number | null;
  totalCost: number | null;
  costPerKg: number | null;
  totalMargin?: number | null;
  marginPercentage?: number | null;
  marginPerKg?: number | null;
  products: string[];
}

export interface OrderCostAnalysisResponse {
  summary: OrderCostAnalysisSummary;
  byProductLine: OrderCostAnalysisProductLine[];
  byPallet: OrderCostAnalysisPallet[];
}

export interface OrdersProfitabilitySummaryParams {
  dateFrom: string;
  dateTo: string;
  productIds?: Array<string | number>;
}

export interface OrdersProfitabilityExportJobParams extends OrdersProfitabilitySummaryParams {
  onlyMissingCosts?: boolean;
}

export type OrdersProfitabilityExportJobStatus = 'pending' | 'processing' | 'finished' | 'failed';

export interface OrdersProfitabilityExportJob {
  id: string;
  status: OrdersProfitabilityExportJobStatus;
  filters: {
    dateFrom: string;
    dateTo: string;
    productIds?: Array<string | number>;
    onlyMissingCosts?: boolean;
  };
  filename: string | null;
  errorMessage: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  downloadUrl: string | null;
}

export interface OrdersProfitabilityExportDownload {
  blob: Blob;
  filename: string;
}

export interface OrdersProfitabilityTimelineParams extends OrdersProfitabilitySummaryParams {
  granularity?: 'day' | 'week' | 'month';
}

export interface OrdersProfitabilityProductsParams {
  dateFrom: string;
  dateTo: string;
}

/** Alerta: cajas cuyo producto no tiene precio €/kg válido en la previsión del pedido (no suman a totalRevenue). */
export interface OrdersProfitabilitySalePriceAlert {
  active: boolean;
  boxesWithoutSalePrice: number;
  hint: string | null;
}

export interface ProfitabilitySummaryResponse {
  period: {
    from: string;
    to: string;
  };
  ordersCount: number;
  totalRevenue: number;
  totalCost: number | null;
  grossMargin: number | null;
  marginPercentage: number | null;
  coveredBoxes: number;
  uncoveredBoxes: number;
  costCoverageBoxesPct: number;
  salePriceAlert?: OrdersProfitabilitySalePriceAlert | null;
}

export interface ProfitabilityTimelinePoint {
  period: string;
  periodLabel: string;
  ordersCount: number;
  totalRevenue: number;
  totalCost: number | null;
  grossMargin: number | null;
  marginPercentage: number | null;
}

export interface ProfitabilityTimelineResponse {
  granularity: 'day' | 'week' | 'month';
  series: ProfitabilityTimelinePoint[];
}

export interface ProfitabilityProductItem {
  product: {
    id: number;
    name: string;
  };
  totalWeightKg: number;
  totalRevenue: number;
  revenuePerKg?: number | null;
  totalCost: number | null;
  costPerKg?: number | null;
  grossMargin: number | null;
  marginPercentage: number | null;
  marginPerKg?: number | null;
  ordersCount: number;
}

export interface ProfitabilityProductsResponse {
  period: {
    from: string;
    to: string;
  };
  products: ProfitabilityProductItem[];
}

/** Order incident payload */
export interface OrderIncidentPayload {
  description?: string;
  resolution_type?: string;
  resolution_notes?: string;
  [key: string]: unknown;
}

/** Ranking stats params */
export interface OrderRankingStatsParams {
  groupBy: string;
  valueType: string;
  dateFrom: string;
  dateTo: string;
  speciesId?: string;
}

/** Sales chart params */
export interface SalesChartParams {
  speciesId?: string;
  categoryId?: string;
  familyId?: string;
  from: string;
  to: string;
  unit: string;
  groupBy: string;
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
export function getOrder(orderId: string, token: AuthToken): Promise<Order | null> {
  return fetchWithTenant(`${API_URL_V2}orders/${orderId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
    },
  })
    .then(async (response) => {
      const data = await handleServiceResponse(response, null, 'Error al obtener el pedido');
      if (!data) return null;
      return (data.data || data) as Order;
    })
    .catch((error) => {
      throw error;
    });
}

/**
 * Fetches detailed cost analysis for an order.
 */
export function getOrderCostAnalysis(
  orderId: string | number,
  token: AuthToken
): Promise<OrderCostAnalysisResponse | null> {
  return fetchWithTenant(`${API_URL_V2}orders/${orderId}/cost-analysis`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
    },
  })
    .then(async (response) => {
      const data = await handleServiceResponse(
        response,
        null,
        'Error al obtener el análisis económico'
      );
      if (!data) return null;
      return (data.data || data) as OrderCostAnalysisResponse;
    })
    .catch((error) => {
      throw error;
    });
}

/**
 * Updates an order with the given data.
 */
export function updateOrder(
  orderId: string,
  orderData: OrderPayload,
  token: AuthToken
): Promise<Order | undefined> {
  return fetchWithTenant(`${API_URL_V2}orders/${orderId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
    },
    body: JSON.stringify(orderData),
  })
    .then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(
          getErrorMessage(errorData) || 'Error al actualizar el pedido',
          response.status,
          errorData
        );
      }
      return response.json();
    })
    .then(
      (data: { data?: Order } | Order) =>
        (data && typeof data === 'object' && 'data' in data ? data.data : data) as Order | undefined
    )
    .catch((error) => {
      throw error;
    });
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
export function getActiveOrders(token: AuthToken): Promise<Order[]> {
  if (!token) {
    console.error('getActiveOrders: No se proporcionó token');
    return Promise.reject(new Error('No se proporcionó token de autenticación'));
  }

  return fetchWithTenant(`${API_URL_V2}orders/active`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
    },
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then((errorData: { message?: string }) => {
          throw new Error(getErrorMessage(errorData) || 'Error al obtener los pedidos activos');
        });
      }
      return response.json();
    })
    .then((data: Order[] | { data?: Order[] }) => {
      const raw: Order[] = Array.isArray(data)
        ? data
        : Array.isArray((data as { data?: Order[] }).data)
          ? (data as { data: Order[] }).data
          : [];
      return raw.map((order) => normalizeActiveOrder(order));
    })
    .catch((error) => {
      throw error;
    });
}

/**
 * Downloads the XLS report of active planned products.
 */
export async function downloadActivePlannedProductsXls(token: AuthToken): Promise<Blob> {
  const response = await fetchWithTenant(`${API_URL_V2}orders/xlsx/active-planned-products`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
    },
  });
  if (!response.ok) throw new Error(`Error ${response.status} al exportar`);
  return response.blob();
}

/**
 * Updates the planned product detail of an order.
 */
export async function updateOrderPlannedProductDetail(
  detailId: string,
  detailData: OrderPlannedProductDetailPayload,
  token: AuthToken
): Promise<unknown> {
  const response = await fetchWithTenant(`${API_URL_V2}order-planned-product-details/${detailId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
    },
    body: JSON.stringify(detailData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(getErrorMessage(errorData) || 'Error al actualizar la linea del pedido');
  }

  const data = await response.json();
  return data.data;
}

/**
 * Deletes the planned product detail of an order.
 */
export async function deleteOrderPlannedProductDetail(
  detailId: string,
  token: AuthToken
): Promise<unknown> {
  const response = await fetchWithTenant(`${API_URL_V2}order-planned-product-details/${detailId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(getErrorMessage(errorData) || 'Error al eliminar la linea del pedido');
  }

  const data = await response.json();
  return data.data;
}

/**
 * Creates a planned product detail for an order.
 */
export async function createOrderPlannedProductDetail(
  detailData: OrderPlannedProductDetailPayload,
  token: AuthToken
): Promise<unknown> {
  const response = await fetchWithTenant(`${API_URL_V2}order-planned-product-details`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
    },
    body: JSON.stringify(detailData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(getErrorMessage(errorData) || 'Error al crear la linea del pedido');
  }

  const data = await response.json();
  return data.data;
}

/**
 * Updates the status of an order.
 */
export async function setOrderStatus(
  orderId: string,
  status: number,
  token: AuthToken
): Promise<unknown> {
  const response = await fetchWithTenant(`${API_URL_V2}orders/${orderId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(getErrorMessage(errorData) || 'Error al actualizar el pedido');
  }

  const data = await response.json();
  return data.data;
}

/**
 * Creates an incident for an order.
 */
export async function createOrderIncident(
  orderId: string,
  description: string,
  token: AuthToken
): Promise<unknown> {
  const response = await fetchWithTenant(`${API_URL_V2}orders/${orderId}/incident`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
    },
    body: JSON.stringify({ description }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(getErrorMessage(errorData) || 'Error al crear la incidencia');
  }

  return response.json();
}

/**
 * Updates an order incident with resolution.
 */
export async function updateOrderIncident(
  orderId: string,
  resolutionType: string,
  resolutionNotes: string,
  token: AuthToken
): Promise<unknown> {
  const response = await fetchWithTenant(`${API_URL_V2}orders/${orderId}/incident`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
    },
    body: JSON.stringify({
      resolution_type: resolutionType,
      resolution_notes: resolutionNotes,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(getErrorMessage(errorData) || 'Error al resolver la incidencia');
  }

  return response.json();
}

/**
 * Deletes an order incident.
 */
export async function destroyOrderIncident(orderId: string, token: AuthToken): Promise<unknown> {
  const response = await fetchWithTenant(`${API_URL_V2}orders/${orderId}/incident`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(getErrorMessage(errorData) || 'Error al eliminar la incidencia');
  }

  return response.json();
}

/**
 * Fetches active orders options.
 */
export function getActiveOrdersOptions(token: AuthToken): Promise<unknown> {
  return fetchWithTenant(`${API_URL_V2}active-orders/options`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
    },
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then((errorData: { message?: string }) => {
          throw new Error(getErrorMessage(errorData) || 'Error al obtener los pedidos activos');
        });
      }
      return response.json();
    })
    .catch((error) => {
      throw error;
    });
}

/**
 * Fetches production view data.
 */
export function getProductionViewData(token: AuthToken): Promise<unknown[]> {
  if (!token) {
    return Promise.reject(new Error('No se proporcionó token de autenticación'));
  }

  return fetchWithTenant(`${API_URL_V2}orders/production-view`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
    },
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then((errorData: { message?: string }) => {
          throw new Error(getErrorMessage(errorData) || 'Error al obtener los datos de producción');
        });
      }
      return response.json();
    })
    .then((data: unknown[] | { data?: unknown[] }) => {
      if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
        return data.data;
      }
      if (Array.isArray(data)) return data;
      return [];
    })
    .catch((error) => {
      throw error;
    });
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

  const token = await getAuthToken();
  const response = await fetchWithTenant(
    `${API_URL_V2}statistics/orders/ranking?${query.toString()}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'User-Agent': getUserAgent(),
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(getErrorMessage(errorData) || 'Error al obtener el ranking de pedidos');
  }

  return response.json();
}

/**
 * Fetches sales by salesperson.
 */
export async function getSalesBySalesperson(params: {
  dateFrom: string;
  dateTo: string;
}): Promise<unknown> {
  const token = await getAuthToken();
  const query = new URLSearchParams(params);
  const response = await fetchWithTenant(
    `${API_URL_V2}orders/sales-by-salesperson?${query.toString()}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'User-Agent': getUserAgent(),
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(getErrorMessage(errorData) || 'Error al obtener las ventas por comercial');
  }

  return response.json();
}

/**
 * Fetches total net weight stats for orders.
 */
export async function getOrdersTotalNetWeightStats(params: {
  dateFrom: string;
  dateTo: string;
}): Promise<unknown> {
  const token = await getAuthToken();
  const query = new URLSearchParams(params);
  const response = await fetchWithTenant(
    `${API_URL_V2}statistics/orders/total-net-weight?${query.toString()}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'User-Agent': getUserAgent(),
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(getErrorMessage(errorData) || 'Error al obtener la cantidad total vendida');
  }

  return response.json();
}

/**
 * Fetches total amount stats for orders.
 */
export async function getOrdersTotalAmountStats(params: {
  dateFrom: string;
  dateTo: string;
}): Promise<unknown> {
  const token = await getAuthToken();
  const query = new URLSearchParams(params);
  const response = await fetchWithTenant(
    `${API_URL_V2}statistics/orders/total-amount?${query.toString()}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'User-Agent': getUserAgent(),
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(getErrorMessage(errorData) || 'Error al obtener el importe total vendido');
  }

  return response.json();
}

/**
 * Fetches profitability summary stats for orders.
 */
export async function getOrdersProfitabilitySummary(
  params: OrdersProfitabilitySummaryParams
): Promise<ProfitabilitySummaryResponse> {
  const token = await getAuthToken();
  const query = buildProfitabilityQuery(params);
  const response = await fetchWithTenant(
    `${API_URL_V2}statistics/orders/profitability-summary?${query.toString()}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'User-Agent': getUserAgent(),
      },
    }
  );

  const data = await handleServiceResponse(
    response,
    null,
    'Error al obtener el resumen de rentabilidad'
  );

  return ((data as { data?: ProfitabilitySummaryResponse })?.data ??
    data) as ProfitabilitySummaryResponse;
}

/**
 * Creates an async profitability export job for orders.
 */
export async function createOrdersProfitabilityExportJob(
  params: OrdersProfitabilityExportJobParams,
  token: AuthToken
): Promise<OrdersProfitabilityExportJob> {
  const response = await fetchWithTenant(
    `${API_URL_V2}statistics/orders/profitability-summary/export-jobs`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'User-Agent': getUserAgent(),
      },
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
  id: string,
  token: AuthToken
): Promise<OrdersProfitabilityExportJob> {
  const response = await fetchWithTenant(
    `${API_URL_V2}statistics/orders/profitability-summary/export-jobs/${id}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'User-Agent': getUserAgent(),
      },
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
 */
export async function downloadOrdersProfitabilityExportJob(
  downloadUrl: string,
  token: AuthToken
): Promise<OrdersProfitabilityExportDownload> {
  const response = await fetchWithTenant(normalizeProfitabilityExportDownloadUrl(downloadUrl), {
    method: 'GET',
    headers: {
      Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
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
  const token = await getAuthToken();
  const query = buildProfitabilityQuery(params);
  const response = await fetchWithTenant(
    `${API_URL_V2}statistics/orders/profitability-timeline?${query.toString()}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'User-Agent': getUserAgent(),
      },
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
  const token = await getAuthToken();
  const query = new URLSearchParams({
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  });

  const response = await fetchWithTenant(
    `${API_URL_V2}statistics/orders/profitability-products?${query.toString()}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'User-Agent': getUserAgent(),
      },
    }
  );

  const data = await handleServiceResponse(
    response,
    null,
    'Error al obtener la rentabilidad por producto'
  );

  return ((data as { data?: ProfitabilityProductsResponse })?.data ??
    data) as ProfitabilityProductsResponse;
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

  const token = await getAuthToken();
  const data = await fetchWithTenant(`${API_URL_V2}orders/sales-chart-data?${query.toString()}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}`, 'User-Agent': getUserAgent() },
  }).then(async (response) => {
    const result = await handleServiceResponse(
      response,
      [],
      'Error al obtener datos del gráfico de ventas'
    );
    if (!result) return [];
    return result;
  });

  return (data as { data?: unknown[] })?.data ?? (data as unknown[]);
}

/** Transport chart params */
export interface TransportChartParams {
  from: string;
  to: string;
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

  const token = await getAuthToken();
  const response = await fetchWithTenant(
    `${API_URL_V2}orders/transport-chart-data?${query.toString()}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': getUserAgent(),
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(getErrorMessage(errorData) || 'Error al obtener los datos de transporte');
  }

  return response.json();
}

/**
 * Creates a new order.
 */
export const createOrder = async (orderPayload: OrderPayload): Promise<Order> => {
  const token = await getAuthToken();

  const response = await fetchWithTenant(`${API_URL_V2}orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
    },
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
