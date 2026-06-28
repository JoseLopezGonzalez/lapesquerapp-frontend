'use client';

import { useQuery } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { dispatchQueryKeys } from '@/lib/routes/queryKeys';
import { ceboDispatchService } from '@/services/domain/cebo-dispatches/ceboDispatchService';

const PER_PAGE = 9;

export function useDispatchesList(page = 1) {
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const today = new Date().toISOString().split('T')[0];
  const filters = { dates: { start: today, end: today } };

  const { data, isLoading, error } = useQuery({
    queryKey: dispatchQueryKeys.list(tenantId, page, today as string),
    queryFn: () => ceboDispatchService.list(filters, { page, perPage: PER_PAGE }),
    enabled: !!tenantId,
  });

  return {
    data: data?.data ?? [],
    total: data?.meta?.total ?? (data as Record<string, unknown> | undefined)?.total ?? 0,
    isLoading,
    error: error instanceof Error ? error.message : null,
  };
}
