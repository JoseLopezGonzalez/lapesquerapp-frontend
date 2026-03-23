'use client';

import { useQuery } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { crmService } from '@/services/crmService';

type CommercialOrder = Record<string, unknown> & {
  offerId?: unknown;
  offer_id?: unknown;
};

export function useComercialOrders(params: Record<string, unknown> = {}) {
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  const query = useQuery({
    queryKey: ['crm', 'orders', 'list', tenantId ?? 'unknown', params],
    queryFn: () => crmService.listCommercialOrders(params),
    enabled: Boolean(tenantId),
    select: (response) => ({
      data: Array.isArray(response?.data)
        ? response.data.map((order: CommercialOrder) => ({
            ...order,
            offerId: order.offerId ?? order.offer_id ?? null,
          }))
        : [],
      meta: response?.meta ?? { current_page: 1, last_page: 1, per_page: 15, total: 0 },
    }),
  });

  return {
    data: query.data?.data ?? [],
    meta: query.data?.meta ?? { current_page: 1, last_page: 1, per_page: 15, total: 0 },
    isLoading: query.isLoading,
    error: query.error,
    errorMessage: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}
