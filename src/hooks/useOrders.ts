'use client';

import { useQuery } from '@tanstack/react-query';
import { getActiveOrders } from '@/services/orderService';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { orderListKeys } from '@/lib/routes/queryKeys';
import type { OrderListItem } from '@/lib/orders/orderListFilters';

/**
 * Hook para obtener los pedidos activos usando React Query.
 * Usa orderListKeys.active(tenantId) para caché tenant-aware.
 */
export function useOrders() {
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const queryKey = orderListKeys.active(tenantId);

  const {
    data: orders = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => getActiveOrders() as Promise<OrderListItem[]>,
    enabled: !!tenantId,
  });

  // Asegurar que orders sea siempre un array
  const ordersArray = Array.isArray(orders) ? orders : [];

  return {
    orders: ordersArray,
    isLoading,
    error: error?.message ?? null,
    refetch,
    queryKey,
  };
}
