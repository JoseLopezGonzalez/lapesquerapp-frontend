'use client';

import { useQuery } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { maquilaReceptionKeys } from '@/lib/routes/queryKeys';
import { maquilaReceptionService } from '@/services/domain/receptions/maquilaReceptionService';

/** Detalle de una recepción propia — GET /maquila/receptions/{id}. */
export function useMaquilaReceptionDetail(receptionId: number | string | null | undefined) {
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: maquilaReceptionKeys.detail(tenantId, receptionId),
    queryFn: () => maquilaReceptionService.getById(receptionId as number | string),
    enabled: !!tenantId && receptionId != null,
    staleTime: 60 * 1000,
  });

  return {
    data: data ?? null,
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
}
