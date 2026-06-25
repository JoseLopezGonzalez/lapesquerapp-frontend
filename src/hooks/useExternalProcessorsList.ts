'use client';

import { useQuery } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { externalProcessorListKeys } from '@/lib/routes/queryKeys';
import { externalProcessorService } from '@/services/domain/external-processors/externalProcessorService';
import type { CatalogListFilters, PaginationMeta } from '@/types/catalog';
import type { ExternalProcessor } from '@/services/domain/external-processors/externalProcessorService';

export function useExternalProcessorsList(
  params: { filters?: CatalogListFilters; page?: number; perPage?: number; enabled?: boolean } = {}
) {
  const { filters = {}, page = 1, perPage = 12, enabled = true } = params;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: externalProcessorListKeys.list(
      tenantId,
      filters as Record<string, unknown>,
      page,
      perPage
    ),
    queryFn: () => externalProcessorService.list(filters, { page, perPage }),
    enabled: !!tenantId && enabled,
  });

  const data = response?.data ?? [];
  const meta = response?.meta ?? { current_page: 1, last_page: 1, per_page: perPage, total: 0 };

  return {
    data: Array.isArray(data) ? (data as ExternalProcessor[]) : [],
    meta: meta as PaginationMeta,
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
}
