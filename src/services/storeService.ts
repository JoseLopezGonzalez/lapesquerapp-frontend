/**
 * Store Service - API client for store-related endpoints
 * @module services/storeService
 */

import { fetchWithTenant } from '@/lib/fetchWithTenant';
import { getAuthToken } from '@/lib/auth/getAuthToken';
import { API_URL_V2 } from '@/configs/config';
import { getErrorMessage } from '@/lib/api/apiHelpers';
import { getUserAgent } from '@/lib/utils/getUserAgent';

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getAuthToken();
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'User-Agent': getUserAgent(),
  };
}

export interface StockByProductItem {
  id: number;
  name: string;
  total_kg: number;
  average_cost_per_kg: number | null;
  percentage: number;
}

type ApiListResponse<T> = T[] | { data: T[] };

/** Response from getStores */
export interface GetStoresResponse {
  data: unknown[];
  links: unknown;
  meta: unknown;
}

export async function getStore(id: number | string): Promise<unknown> {
  const response = await fetchWithTenant(`${API_URL_V2}stores/${id}`, {
    method: 'GET',
    headers: await authHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(getErrorMessage(errorData) || 'Error al obtener stores');
  }

  const data = await response.json();
  return data.data;
}

export async function getStores(page = 1): Promise<GetStoresResponse> {
  const url = `${API_URL_V2}stores?page=${page}&perPage=6`;
  const response = await fetchWithTenant(url, {
    method: 'GET',
    headers: await authHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(getErrorMessage(errorData) || 'Error al obtener stores');
  }

  const data = await response.json();
  return {
    data: data.data || [],
    links: data.links ?? null,
    meta: data.meta ?? null,
  };
}

export async function getStoreOptions(): Promise<unknown> {
  const response = await fetchWithTenant(`${API_URL_V2}stores/options`, {
    method: 'GET',
    headers: await authHeaders(),
  });

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(getErrorMessage(errorData) || 'Error al obtener los almacenes');
  }

  return response.json();
}

export async function getTotalStockStats(): Promise<unknown> {
  const response = await fetchWithTenant(`${API_URL_V2}statistics/stock/total`, {
    method: 'GET',
    headers: await authHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(getErrorMessage(errorData) || 'Error al obtener el stock total');
  }

  return response.json();
}

export async function getStockBySpeciesStats(): Promise<unknown> {
  const response = await fetchWithTenant(`${API_URL_V2}statistics/stock/total-by-species`, {
    method: 'GET',
    headers: await authHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(getErrorMessage(errorData) || 'Error al obtener el stock por especies');
  }

  return response.json();
}

export async function getStockByProducts(): Promise<ApiListResponse<StockByProductItem>> {
  const response = await fetchWithTenant(`${API_URL_V2}stores/total-stock-by-products`, {
    method: 'GET',
    headers: await authHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(getErrorMessage(errorData) || 'Error al obtener el stock por productos');
  }

  return response.json();
}

export async function getRegisteredPallets(): Promise<unknown> {
  const response = await fetchWithTenant(`${API_URL_V2}pallets/registered`, {
    method: 'GET',
    headers: await authHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(getErrorMessage(errorData) || 'Error al obtener los palets registrados');
  }

  const data = await response.json();
  return data?.data ?? data;
}
