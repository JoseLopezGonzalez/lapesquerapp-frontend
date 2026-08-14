'use client';

import { useQuery } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { maquilaReturnKeys } from '@/lib/routes/queryKeys';
import { tollClientReturnService } from '@/services/domain/tollClientReturns/tollClientReturnService';

/** Detalle de una devolución propia — GET /toll-client-returns/{id}. */
export function useMaquilaReturnDetail(returnId: number | string | null | undefined) {
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: maquilaReturnKeys.detail(tenantId, returnId),
    queryFn: () => tollClientReturnService.getById(returnId as number | string),
    enabled: !!tenantId && returnId != null,
    staleTime: 60 * 1000,
  });

  return {
    data: data ?? null,
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
}
