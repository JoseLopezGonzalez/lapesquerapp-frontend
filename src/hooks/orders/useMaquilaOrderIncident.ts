'use client';

import { useQuery } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { maquilaOrderKeys } from '@/lib/routes/queryKeys';
import { maquilaOrderService } from '@/services/domain/orders/maquilaOrderService';

/** Incidencia de un pedido (lectura) — GET /orders/{id}/incident. null si no tiene. */
export function useMaquilaOrderIncident(orderId: number | string | null | undefined) {
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  const { data, isLoading, error } = useQuery({
    queryKey: maquilaOrderKeys.incident(tenantId, orderId),
    queryFn: () => maquilaOrderService.getIncident(orderId as number | string),
    enabled: !!tenantId && orderId != null,
    staleTime: 60 * 1000,
  });

  return {
    incident: data ?? null,
    isLoading,
    error: error?.message ?? null,
  };
}
