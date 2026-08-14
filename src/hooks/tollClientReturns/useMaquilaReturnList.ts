'use client';

import { useQuery } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { maquilaReturnKeys } from '@/lib/routes/queryKeys';
import { tollClientReturnService } from '@/services/domain/tollClientReturns/tollClientReturnService';

/** Listado de devoluciones propias — GET /toll-client-returns (auto-scopeado por toll_client_id). */
export function useMaquilaReturnList(params: { page?: number; perPage?: number } = {}) {
  const { page = 1, perPage = 12 } = params;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: maquilaReturnKeys.list(tenantId, page, perPage),
    queryFn: () => tollClientReturnService.list({ page, perPage }),
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
