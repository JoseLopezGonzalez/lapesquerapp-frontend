'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { productionQueryKeys } from '@/lib/routes/queryKeys';
import { getProduction } from '@/services/productionService';
import type { Production } from '@/types/production';

/**
 * Hook para obtener solo la producción por ID (sin processTree ni totals).
 * React Query, tenant-aware. Usado en useProductionRecord / editor de records.
 */
export function useProduction(productionId: string | number | null) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: productionQueryKeys.detail(tenantId, productionId),
    queryFn: () => {
      if (!token || productionId == null) throw new Error('Missing token or productionId');
      return getProduction(productionId, token);
    },
    enabled: !!token && !!tenantId && productionId != null && productionId !== '',
    staleTime: 60 * 1000,
  });

  return {
    production: (data ?? null) as Production | null,
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
}
