'use client';

import { useQuery } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { maquilaOrderKeys } from '@/lib/routes/queryKeys';
import { maquilaOrderService } from '@/services/domain/orders/maquilaOrderService';
import type { MaquilaOrderStatus } from '@/types/maquilaOrder';

/** Listado de pedidos propios — GET /maquila/orders (🔶 solo status como filtro hoy). */
export function useMaquilaOrderList(
  params: { status?: MaquilaOrderStatus; page?: number; perPage?: number } = {}
) {
  const { status, page = 1, perPage = 15 } = params;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: maquilaOrderKeys.list(tenantId, status, page, perPage),
    queryFn: () => maquilaOrderService.list({ status }, { page, perPage }),
    enabled: !!tenantId,
    staleTime: 60 * 1000,
  });

  return {
    data: response?.data ?? [],
    meta: response?.meta ?? { current_page: 1, last_page: 1, per_page: perPage, total: 0 },
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
}
