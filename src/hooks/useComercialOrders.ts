'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { fetchWithTenant } from '@/lib/fetchWithTenant';
import { API_URL_V2 } from '@/configs/config';
import { getUserAgent } from '@/lib/utils/getUserAgent';
import { getErrorMessage } from '@/lib/api/apiHelpers';

type CommercialOrder = Record<string, unknown> & {
  offerId?: unknown;
  offer_id?: unknown;
};

async function fetchCommercialOrders(
  token: string,
  params: Record<string, unknown> = {}
) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value == null || value === '') return;
    if (Array.isArray(value)) {
      value.forEach((item) => query.append(`${key}[]`, String(item)));
      return;
    }
    query.append(key, String(value));
  });

  const response = await fetchWithTenant(`${API_URL_V2}orders?${query.toString()}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(getErrorMessage(errorData) || 'Error al obtener pedidos del comercial');
  }

  return response.json();
}

export function useComercialOrders(params: Record<string, unknown> = {}) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken as string | undefined;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['crm', 'orders', 'list', tenantId ?? 'unknown', params],
    queryFn: () => {
      if (!token) throw new Error('Missing access token');
      return fetchCommercialOrders(token, params);
    },
    enabled: Boolean(tenantId) && typeof token === 'string' && token.length > 0,
  });

  return {
    data: Array.isArray(data?.data)
      ? data.data.map((order: CommercialOrder) => ({
          ...order,
          offerId: order.offerId ?? order.offer_id ?? null,
        }))
      : [],
    meta: data?.meta ?? { current_page: 1, last_page: 1, per_page: 15, total: 0 },
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
}
