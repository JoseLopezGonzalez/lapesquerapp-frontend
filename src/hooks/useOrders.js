'use client';

import { useQuery } from '@tanstack/react-query';
import { getActiveOrders } from '@/services/orderService';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';

/**
 * Hook para obtener los pedidos activos usando React Query.
 * Usa queryKey ['orders', tenantId] para caché tenant-aware.
 *
 * @returns {Object} { orders, isLoading, error, refetch, queryKey }
 */
export function useOrders() {
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const queryKey = ['orders', tenantId ?? 'unknown'];

  const {
    data: orders = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => getActiveOrders(),
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
