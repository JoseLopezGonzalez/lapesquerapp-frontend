'use client';

import { useQuery } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { rawMaterialReceptionService } from '@/services/domain/raw-material-receptions/rawMaterialReceptionService';

const PER_PAGE = 9;

/**
 * Hook para listar recepciones del día con React Query.
 * @param {number} page - Página actual
 */
export function useReceptionsList(page = 1) {
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const today = new Date().toISOString().split('T')[0];
  const filters = { dates: { start: today, end: today } };

  const { data, isLoading, error } = useQuery({
    queryKey: ['receptions', 'list', tenantId ?? 'unknown', page, today],
    queryFn: () => rawMaterialReceptionService.list(filters, { page, perPage: PER_PAGE }),
    enabled: !!tenantId,
  });

  return {
    data: data?.data ?? [],
    total: data?.meta?.total ?? data?.total ?? 0,
    isLoading,
    error: error?.message ?? null,
  };
}
