/**
 * Order Service - API client for order-related endpoints
 * @module services/orderService
 */

import { fetchWithTenant } from '@/lib/fetchWithTenant';
import { API_URL_V2 } from '@/configs/config';
import { getAuthToken } from '@/lib/auth/getAuthToken';
import { getErrorMessage, handleServiceResponse, ApiError } from '@/lib/api/apiHelpers';
import { getUserAgent } from '@/lib/utils/getUserAgent';

/** Auth token for API requests — used by profitability export functions still pending migration */
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
  auxiliaryLines?: AuxiliaryOrderLine[];
  auxiliarySubtotal?: number | null;
  auxiliaryTotal?: number | null;
  [key: string]: unknown;
}

/** Order planned product detail payload */
export interface OrderPlannedProductDetailPayload {
  [key: string]: unknown;
}

/** Auxiliary order line — línea de venta directa (nieve, envases, palets, servicios) */
export interface AuxiliaryOrderLine {
  id: number | string;
  orderId?: number | string;
  auxiliaryProduct?: { id: number | string; name: string } | null;
  description?: string | null;
  effectiveDescription?: string;
  quantity?: string | number;
  unit?: string;
  unitPrice?: string | number;
  tax?: { id: number | string; name?: string; rate?: number } | null;
  subtotal?: number;
  total?: number;
  [key: string]: unknown;
}

/** Auxiliary order line payload for create/update */
export interface AuxiliaryOrderLinePayload {
  auxiliaryProductId?: number | string | null;
  description?: string | null;
  quantity?: number | string;
  unit?: string;
  unitPrice?: number | string;
  taxId?: number | string | null;
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
export async function getOrder(orderId: string): Promise<Order | null> {
  const token = await getAuthToken();
  const response = await fetchWithTenant(`${API_URL_V2}orders/${orderId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
    },
  });
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
  const token = await getAuthToken();
  const response = await fetchWithTenant(`${API_URL_V2}orders/${orderId}/cost-analysis`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
    },
  });
  const data = await handleServiceResponse(response, null, 'Error al obtener el análisis económico');
  if (!data) return null;
  return (data.data || data) as OrderCostAnalysisResponse;
}

/**
 * Updates an order with the given data.
 */
export async function updateOrder(
  orderId: string,
  orderData: OrderPayload
): Promise<Order | undefined> {
  const token = await getAuthToken();
  const response = await fetchWithTenant(`${API_URL_V2}orders/${orderId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
    },
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
  return (data && typeof data === 'object' && 'data' in data ? data.data : data) as Order | undefined;
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
  const token = await getAuthToken();
  const response = await fetchWithTenant(`${API_URL_V2}orders/active`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
    },
  });
  if (!response.ok) {
    const errorData: { message?: string } = await response.json();
    throw new Error(getErrorMessage(errorData) || 'Error al obtener los pedidos activos');
  }
  const data: Order[] | { data?: Order[] } = await response.json();
  const raw: Order[] = Array.isArray(data)
    ? data
    : Array.isArray((data as { data?: Order[] }).data)
      ? (data as { data: Order[] }).data
      : [];
  return raw.map((order) => normalizeActiveOrder(order));
}

/**
 * Downloads the XLS report of active planned products.
 */
export async function downloadActivePlannedProductsXls(): Promise<Blob> {
  const token = await getAuthToken();
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
  detailData: OrderPlannedProductDetailPayload
): Promise<unknown> {
  const token = await getAuthToken();
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
export async function deleteOrderPlannedProductDetail(detailId: string): Promise<unknown> {
  const token = await getAuthToken();
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
  detailData: OrderPlannedProductDetailPayload
): Promise<unknown> {
  const token = await getAuthToken();
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
 * Fetches the auxiliary lines of an order.
 */
export async function getOrderAuxiliaryLines(orderId: string): Promise<AuxiliaryOrderLine[]> {
  const token = await getAuthToken();
  const response = await fetchWithTenant(`${API_URL_V2}orders/${orderId}/auxiliary-lines`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(getErrorMessage(errorData) || 'Error al obtener las líneas auxiliares');
  }

  const data = await response.json();
  return data.data;
}

/**
 * Creates an auxiliary line for an order.
 */
export async function createOrderAuxiliaryLine(
  orderId: string,
  lineData: AuxiliaryOrderLinePayload
): Promise<AuxiliaryOrderLine> {
  const token = await getAuthToken();
  const response = await fetchWithTenant(`${API_URL_V2}orders/${orderId}/auxiliary-lines`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
    },
    body: JSON.stringify(lineData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(getErrorMessage(errorData) || 'Error al crear la línea auxiliar');
  }

  const data = await response.json();
  return data.data;
}

/**
 * Updates an auxiliary line of an order.
 */
export async function updateOrderAuxiliaryLine(
  orderId: string,
  lineId: string,
  lineData: AuxiliaryOrderLinePayload
): Promise<AuxiliaryOrderLine> {
  const token = await getAuthToken();
  const response = await fetchWithTenant(
    `${API_URL_V2}orders/${orderId}/auxiliary-lines/${lineId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'User-Agent': getUserAgent(),
      },
      body: JSON.stringify(lineData),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(getErrorMessage(errorData) || 'Error al actualizar la línea auxiliar');
  }

  const data = await response.json();
  return data.data;
}

/**
 * Deletes an auxiliary line of an order.
 */
export async function deleteOrderAuxiliaryLine(orderId: string, lineId: string): Promise<void> {
  const token = await getAuthToken();
  const response = await fetchWithTenant(
    `${API_URL_V2}orders/${orderId}/auxiliary-lines/${lineId}`,
    {
      method: 'DELETE',
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
    throw new Error(getErrorMessage(errorData) || 'Error al eliminar la línea auxiliar');
  }
}

/**
 * Updates the status of an order.
 */
export async function setOrderStatus(orderId: string, status: number): Promise<unknown> {
  const token = await getAuthToken();
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
export async function createOrderIncident(orderId: string, description: string): Promise<unknown> {
  const token = await getAuthToken();
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
  resolutionNotes: string
): Promise<unknown> {
  const token = await getAuthToken();
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
export async function destroyOrderIncident(orderId: string): Promise<unknown> {
  const token = await getAuthToken();
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
export async function getActiveOrdersOptions(): Promise<unknown> {
  const token = await getAuthToken();
  const response = await fetchWithTenant(`${API_URL_V2}active-orders/options`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
    },
  });
  if (!response.ok) {
    const errorData: { message?: string } = await response.json();
    throw new Error(getErrorMessage(errorData) || 'Error al obtener los pedidos activos');
  }
  return response.json();
}

/**
 * Fetches production view data.
 */
export async function getProductionViewData(): Promise<unknown[]> {
  const token = await getAuthToken();
  const response = await fetchWithTenant(`${API_URL_V2}orders/production-view`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
    },
  });
  if (!response.ok) {
    const errorData: { message?: string } = await response.json();
    throw new Error(getErrorMessage(errorData) || 'Error al obtener los datos de producción');
  }
  const data: unknown[] | { data?: unknown[] } = await response.json();
  if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as { data?: unknown[] }).data)) {
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
  includeAuxiliary?: boolean;
}): Promise<unknown> {
  const token = await getAuthToken();
  const { includeAuxiliary, ...rest } = params;
  const query = new URLSearchParams(rest);
  if (includeAuxiliary) {
    query.set('includeAuxiliary', 'true');
  }
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

/** Auxiliary lines statistics response — total amount with previous-year comparison */
export interface AuxiliaryLinesTotalAmountStats {
  value: number;
  subtotal: number;
  tax: number;
  comparisonValue: number | null;
  comparisonSubtotal: number | null;
  comparisonTax: number | null;
  percentageChange: number | null;
  range: { from: string; to: string; fromPrev: string; toPrev: string };
}

/** Auxiliary lines statistics response — ranking by product */
export interface AuxiliaryLinesByProductStat {
  name: string;
  quantity: number;
  unit: string;
  subtotal: number;
}

/** Auxiliary lines statistics response — ranking by customer */
export interface AuxiliaryLinesByCustomerStat {
  customerName: string;
  subtotal: number;
  total: number;
}

/** Auxiliary lines statistics response — time series point */
export interface AuxiliaryLinesChartPoint {
  date: string;
  subtotal: number;
  total: number;
}

/**
 * Fetches total amount stats for auxiliary lines, with previous-year comparison.
 */
export async function getAuxiliaryLinesTotalAmountStats(params: {
  dateFrom: string;
  dateTo: string;
}): Promise<AuxiliaryLinesTotalAmountStats> {
  const token = await getAuthToken();
  const query = new URLSearchParams(params);
  const response = await fetchWithTenant(
    `${API_URL_V2}statistics/auxiliary-lines/total-amount?${query.toString()}`,
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
    throw new Error(
      getErrorMessage(errorData) || 'Error al obtener el importe total de líneas auxiliares'
    );
  }

  return response.json();
}

/**
 * Fetches auxiliary lines ranking by product.
 */
export async function getAuxiliaryLinesByProductStats(params: {
  dateFrom: string;
  dateTo: string;
}): Promise<AuxiliaryLinesByProductStat[]> {
  const token = await getAuthToken();
  const query = new URLSearchParams(params);
  const response = await fetchWithTenant(
    `${API_URL_V2}statistics/auxiliary-lines/by-product?${query.toString()}`,
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
    throw new Error(
      getErrorMessage(errorData) || 'Error al obtener el ranking de líneas auxiliares por artículo'
    );
  }

  return response.json();
}

/**
 * Fetches auxiliary lines ranking by customer.
 */
export async function getAuxiliaryLinesByCustomerStats(params: {
  dateFrom: string;
  dateTo: string;
}): Promise<AuxiliaryLinesByCustomerStat[]> {
  const token = await getAuthToken();
  const query = new URLSearchParams(params);
  const response = await fetchWithTenant(
    `${API_URL_V2}statistics/auxiliary-lines/by-customer?${query.toString()}`,
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
    throw new Error(
      getErrorMessage(errorData) || 'Error al obtener el ranking de líneas auxiliares por cliente'
    );
  }

  return response.json();
}

/**
 * Fetches auxiliary lines time series (chart data).
 */
export async function getAuxiliaryLinesChartData(params: {
  dateFrom: string;
  dateTo: string;
  groupBy?: 'day' | 'week' | 'month';
}): Promise<AuxiliaryLinesChartPoint[]> {
  const token = await getAuthToken();
  const query = new URLSearchParams({
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    groupBy: params.groupBy ?? 'day',
  });
  const response = await fetchWithTenant(
    `${API_URL_V2}statistics/auxiliary-lines/chart-data?${query.toString()}`,
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
    throw new Error(
      getErrorMessage(errorData) || 'Error al obtener la serie temporal de líneas auxiliares'
    );
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
