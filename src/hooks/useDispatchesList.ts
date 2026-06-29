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

  const { data: rawData, isLoading, error } = useQuery({
    queryKey: dispatchQueryKeys.list(tenantId, page, today as string),
    queryFn: () => ceboDispatchService.list(filters, { page, perPage: PER_PAGE }),
    enabled: !!tenantId,
  });

  const data = rawData as { data?: unknown[]; meta?: { total?: number } } | undefined;

  return {
    data: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    isLoading,
    error: error instanceof Error ? error.message : null,
  };
}
