'use client';

import { useQuery } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { maquilaReceptionKeys } from '@/lib/routes/queryKeys';
import { maquilaReceptionService } from '@/services/domain/receptions/maquilaReceptionService';

/** Listado de recepciones propias — GET /maquila/receptions (solo perPage hoy). */
export function useMaquilaReceptionList(params: { page?: number; perPage?: number } = {}) {
  const { page = 1, perPage = 12 } = params;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: maquilaReceptionKeys.list(tenantId, page, perPage),
    queryFn: () => maquilaReceptionService.list({ page, perPage }),
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
