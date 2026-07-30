'use client';

import { useQuery } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { customsBrokerOptionKeys } from '@/lib/routes/queryKeys';
import { customsBrokerService } from '@/services/domain/customs-brokers/customsBrokerService';
import type { CustomsBrokerOption } from '@/types/catalog';

export function useCustomsBrokerOptions(params: { enabled?: boolean } = {}) {
  const { enabled = true } = params;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  const { data, isLoading, error } = useQuery({
    queryKey: customsBrokerOptionKeys.list(tenantId),
    queryFn: () => customsBrokerService.getOptions(),
    enabled: !!tenantId && enabled,
    staleTime: 5 * 60 * 1000,
  });

  return {
    options: (data ?? []) as CustomsBrokerOption[],
    isLoading,
    error: error?.message ?? null,
  };
}
