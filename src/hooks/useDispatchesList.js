'use client';

import { useQuery } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { ceboDispatchService } from '@/services/domain/cebo-dispatches/ceboDispatchService';

const PER_PAGE = 9;

/**
 * Hook para listar salidas de cebo del día con React Query.
 * @param {number} page - Página actual
 */
export function useDispatchesList(page = 1) {
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const today = new Date().toISOString().split('T')[0];
  const filters = { dates: { start: today, end: today } };

  const { data, isLoading, error } = useQuery({
    queryKey: ['dispatches', 'list', tenantId ?? 'unknown', page, today],
    queryFn: () => ceboDispatchService.list(filters, { page, perPage: PER_PAGE }),
    enabled: !!tenantId,
  });

  return {
    data: data?.data ?? [],
    total: data?.meta?.total ?? data?.total ?? 0,
    isLoading,
    error: error?.message ?? null,
  };
}
