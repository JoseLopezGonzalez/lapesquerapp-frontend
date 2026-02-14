/**
 * Store Service - API client for store-related endpoints
 * @module services/storeService
 */

import { fetchWithTenant } from '@lib/fetchWithTenant';
import { API_URL_V2 } from '@/configs/config';
import { getErrorMessage } from '@/lib/api/apiHelpers';
import { getUserAgent } from '@/lib/utils/getUserAgent';

/** Auth token for API requests */
type AuthToken = string;

/** Response from getStores */
export interface GetStoresResponse {
  data: unknown[];
  links: unknown;
  meta: unknown;
}

export async function getStore(
  id: number | string,
  token: AuthToken
): Promise<unknown> {
  const response = await fetchWithTenant(`${API_URL_V2}stores/${id}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      getErrorMessage(errorData) || 'Error al obtener stores'
    );
  }

  const data = await response.json();
  return data.data;
}

export async function getStores(
  token: AuthToken,
  page = 1
): Promise<GetStoresResponse> {
  const url = `${API_URL_V2}stores?page=${page}&perPage=6`;
  const response = await fetchWithTenant(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      getErrorMessage(errorData) || 'Error al obtener stores'
    );
  }

  const data = await response.json();
  return {
    data: data.data || [],
    links: data.links ?? null,
    meta: data.meta ?? null,
  };
}

export function getStoreOptions(token: AuthToken): Promise<unknown> {
  return fetchWithTenant(`${API_URL_V2}stores/options`, {
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
            getErrorMessage(errorData) || 'Error al obtener los almacenes'
          );
        });
      }
      return response.json();
    })
    .catch((error) => {
      throw error;
    });
}

export async function getTotalStockStats(token: AuthToken): Promise<unknown> {
  const response = await fetchWithTenant(
    `${API_URL_V2}statistics/stock/total`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': getUserAgent(),
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      getErrorMessage(errorData) || 'Error al obtener el stock total'
    );
  }

  return response.json();
}

export async function getStockBySpeciesStats(
  token: AuthToken
): Promise<unknown> {
  const response = await fetchWithTenant(
    `${API_URL_V2}statistics/stock/total-by-species`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': getUserAgent(),
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      getErrorMessage(errorData) || 'Error al obtener el stock por especies'
    );
  }

  return response.json();
}

export async function getStockByProducts(token: AuthToken): Promise<unknown> {
  const response = await fetchWithTenant(
    `${API_URL_V2}stores/total-stock-by-products`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': getUserAgent(),
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      getErrorMessage(errorData) || 'Error al obtener el stock por productos'
    );
  }

  return response.json();
}

export async function getRegisteredPallets(token: AuthToken): Promise<unknown> {
  const response = await fetchWithTenant(`${API_URL_V2}pallets/registered`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      getErrorMessage(errorData) || 'Error al obtener los palets registrados'
    );
  }

  const data = await response.json();
  return data?.data ?? data;
}
