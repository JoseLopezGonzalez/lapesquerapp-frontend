'use client';

import { useQuery } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { productionViewKeys } from '@/lib/routes/queryKeys';
import { getProductionViewData } from '@/services/orderService';

export function useProductionViewData(enabled = true) {
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  return useQuery({
    queryKey: productionViewKeys.data(tenantId),
    queryFn: getProductionViewData,
    enabled: !!tenantId && enabled,
    refetchInterval: 3 * 60 * 1000,
    staleTime: 60 * 1000,
  });
}
