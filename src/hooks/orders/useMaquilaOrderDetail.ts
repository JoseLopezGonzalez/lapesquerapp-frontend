'use client';

import { useQuery } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { maquilaOrderKeys } from '@/lib/routes/queryKeys';
import { maquilaOrderService } from '@/services/domain/orders/maquilaOrderService';

/** Detalle de un pedido propio — GET /maquila/orders/{id}. */
export function useMaquilaOrderDetail(orderId: number | string | null | undefined) {
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: maquilaOrderKeys.detail(tenantId, orderId),
    queryFn: () => maquilaOrderService.getById(orderId as number | string),
    enabled: !!tenantId && orderId != null,
    staleTime: 60 * 1000,
  });

  return {
    data: data ?? null,
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
}
