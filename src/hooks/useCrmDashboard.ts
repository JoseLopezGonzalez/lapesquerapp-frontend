'use client';

import { useQuery } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { crmService } from '@/services/crmService';

export function useCrmDashboard() {
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['crm', 'dashboard', tenantId ?? 'unknown'],
    queryFn: () => crmService.getDashboard(),
    enabled: !!tenantId,
  });

  return {
    data: data?.data ?? null,
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
}
