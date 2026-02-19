/**
 * Order Service - API client for order-related endpoints
 * @module services/orderService
 */

import { fetchWithTenant } from '@lib/fetchWithTenant';
import { API_URL_V2 } from '@/configs/config';
import { getSession } from 'next-auth/react';
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
  [key: string]: unknown;
}

/** Order planned product detail payload */
export interface OrderPlannedProductDetailPayload {
  [key: string]: unknown;
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
  token: AuthToken;
  speciesId?: string;
  categoryId?: string;
  familyId?: string;
  from: string;
  to: string;
  unit: string;
  groupBy: string;
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
    .then((data: { data?: Order } | Order) => (data && typeof data === 'object' && 'data' in data ? data.data : data) as Order | undefined)
    .catch((error) => {
      throw error;
    });
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
          throw new Error(
            getErrorMessage(errorData) || 'Error al obtener los pedidos activos'
          );
        });
      }
      return response.json();
    })
    .then((data: Order[] | { data?: Order[] }) => {
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.data)) return data.data;
      return [];
    })
    .catch((error) => {
      throw error;
    });
}

/**
 * Updates the planned product detail of an order.
 */
export async function updateOrderPlannedProductDetail(
  detailId: string,
  detailData: OrderPlannedProductDetailPayload,
  token: AuthToken
): Promise<unknown> {
  const response = await fetchWithTenant(
    `${API_URL_V2}order-planned-product-details/${detailId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'User-Agent': getUserAgent(),
      },
      body: JSON.stringify(detailData),
    }
  );

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
  const response = await fetchWithTenant(
    `${API_URL_V2}order-planned-product-details/${detailId}`,
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
export async function destroyOrderIncident(
  orderId: string,
  token: AuthToken
): Promise<unknown> {
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
          throw new Error(
            getErrorMessage(errorData) || 'Error al obtener los pedidos activos'
          );
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
          throw new Error(
            getErrorMessage(errorData) || 'Error al obtener los datos de producción'
          );
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
export async function getOrderRankingStats(
  params: OrderRankingStatsParams,
  token: AuthToken
): Promise<unknown> {
  const query = new URLSearchParams({
    groupBy: params.groupBy,
    valueType: params.valueType,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  });

  if (params.speciesId && params.speciesId !== 'all') {
    query.append('speciesId', params.speciesId);
  }

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
    throw new Error(
      getErrorMessage(errorData) || 'Error al obtener el ranking de pedidos'
    );
  }

  return response.json();
}

/**
 * Fetches sales by salesperson.
 */
export async function getSalesBySalesperson(
  params: { dateFrom: string; dateTo: string },
  token: AuthToken
): Promise<unknown> {
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
    throw new Error(
      getErrorMessage(errorData) || 'Error al obtener las ventas por comercial'
    );
  }

  return response.json();
}

/**
 * Fetches total net weight stats for orders.
 */
export async function getOrdersTotalNetWeightStats(
  params: { dateFrom: string; dateTo: string },
  token: AuthToken
): Promise<unknown> {
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
    throw new Error(
      getErrorMessage(errorData) || 'Error al obtener la cantidad total vendida'
    );
  }

  return response.json();
}

/**
 * Fetches total amount stats for orders.
 */
export async function getOrdersTotalAmountStats(
  params: { dateFrom: string; dateTo: string },
  token: AuthToken
): Promise<unknown> {
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
    throw new Error(
      getErrorMessage(errorData) || 'Error al obtener el importe total vendido'
    );
  }

  return response.json();
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

  const data = await fetchWithTenant(
    `${API_URL_V2}orders/sales-chart-data?${query.toString()}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${params.token}`,
        'User-Agent': getUserAgent(),
      },
    }
  ).then(async (response) => {
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
  token: AuthToken;
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

  const response = await fetchWithTenant(
    `${API_URL_V2}orders/transport-chart-data?${query.toString()}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${params.token}`,
        'User-Agent': getUserAgent(),
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      getErrorMessage(errorData) || 'Error al obtener los datos de transporte'
    );
  }

  return response.json();
}

/**
 * Creates a new order.
 */
export const createOrder = async (orderPayload: OrderPayload): Promise<Order> => {
  const session = await getSession();
  const token = session?.user?.accessToken;

  if (!token) {
    throw new Error('No hay sesión autenticada. No se puede crear el pedido.');
  }

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
