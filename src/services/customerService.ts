/**
 * Customer Service - API client for customer-related endpoints
 * @module services/customerService
 */

import { fetchWithTenant } from '@lib/fetchWithTenant';
import { API_URL_V2 } from '@/configs/config';
import { getErrorMessage } from '@/lib/api/apiHelpers';
import { getUserAgent } from '@/lib/utils/getUserAgent';

/** Auth token for API requests */
type AuthToken = string;

/** Options for getCustomerOrderHistory */
export interface CustomerOrderHistoryOptions {
  dateFrom?: string;
  dateTo?: string;
  year?: number;
}

/** Response from getCustomerOrderHistory */
export interface CustomerOrderHistoryResponse {
  available_years: number[];
  data: unknown[];
}

export interface CustomerOrderHistoryRangesData {
  first_order_date: string | null;
  last_order_date: string | null;
  available_years: number[];
  available_months_by_year: Record<string, number[]>;
}

export interface CustomerOrderHistoryRangesResponse {
  data: CustomerOrderHistoryRangesData;
}

/**
 * Obtiene las opciones de clientes (para selects/autocomplete).
 */
export function getCustomersOptions(token: AuthToken): Promise<unknown> {
  return fetchWithTenant(`${API_URL_V2}customers/options`, {
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
          throw new Error(getErrorMessage(errorData) || 'Error al obtener customers');
        });
      }
      return response.json();
    })
    .catch((error) => {
      throw error;
    });
}

/**
 * Obtiene los detalles de un cliente por ID.
 */
export async function getCustomer(id: string | number, token: AuthToken): Promise<unknown> {
  const response = await fetchWithTenant(`${API_URL_V2}customers/${id}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(getErrorMessage(errorData) || 'Error al obtener customer');
  }

  const data = await response.json();
  return data.data;
}

/**
 * Obtiene el historial de pedidos de un cliente.
 */
export async function getCustomerOrderHistory(
  customerId: string | number,
  token: AuthToken,
  options: CustomerOrderHistoryOptions = {}
): Promise<CustomerOrderHistoryResponse> {
  const { dateFrom, dateTo, year } = options;

  const queryParams = new URLSearchParams();
  if (dateFrom && dateTo) {
    queryParams.append('date_from', dateFrom);
    queryParams.append('date_to', dateTo);
  } else if (year !== undefined && year !== null) {
    queryParams.append('year', year.toString());
  }

  const url = `${API_URL_V2}customers/${customerId}/order-history${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  const response = await fetchWithTenant(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(getErrorMessage(errorData) || 'Error al obtener historial del cliente');
  }

  const data = await response.json();
  return {
    available_years: data.available_years || [],
    data: data.data || [],
  };
}

/**
 * Obtiene los rangos de historial de pedidos disponibles para un cliente.
 */
export async function getCustomerOrderHistoryRanges(
  customerId: string | number,
  token: AuthToken
): Promise<CustomerOrderHistoryRangesResponse> {
  const response = await fetchWithTenant(
    `${API_URL_V2}customers/${customerId}/order-history/ranges`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'User-Agent': getUserAgent(),
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      getErrorMessage(errorData) || 'Error al obtener rangos de historial del cliente'
    );
  }

  const responseData = await response.json();
  const data = responseData?.data || {};

  return {
    data: {
      first_order_date: data.first_order_date || null,
      last_order_date: data.last_order_date || null,
      available_years: data.available_years || [],
      available_months_by_year: data.available_months_by_year || {},
    },
  };
}
