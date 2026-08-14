'use client';

import { useQuery } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { maquilaProductionKeys } from '@/lib/routes/queryKeys';
import { maquilaProductionService } from '@/services/domain/productions/maquilaProductionService';
import type { Production } from '@/types/production';

/** Listado de producciones propias — GET /maquila/productions (🔶 solo perPage hoy, sin filtros). */
export function useMaquilaProductionList(params: { page?: number; perPage?: number } = {}) {
  const { page = 1, perPage = 12 } = params;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: maquilaProductionKeys.list(tenantId, page, perPage),
    queryFn: () => maquilaProductionService.list({ page, perPage }),
    enabled: !!tenantId,
    staleTime: 60 * 1000,
  });

  const data: Production[] = response?.data ?? [];
  const meta = response?.meta ?? { current_page: 1, last_page: 1, per_page: perPage, total: 0 };

  return {
    data,
    meta,
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
}
