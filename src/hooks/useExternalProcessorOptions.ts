'use client';

import { useQuery } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { externalProcessorOptionKeys } from '@/lib/routes/queryKeys';
import { externalProcessorService } from '@/services/domain/external-processors/externalProcessorService';
import type { ExternalProcessorOption } from '@/services/domain/external-processors/externalProcessorService';

export function useExternalProcessorOptions(params: { enabled?: boolean } = {}) {
  const { enabled = true } = params;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  const { data, isLoading, error } = useQuery({
    queryKey: externalProcessorOptionKeys.list(tenantId),
    queryFn: () => externalProcessorService.getOptions(),
    enabled: !!tenantId && enabled,
    staleTime: 5 * 60 * 1000,
  });

  return {
    options: (data ?? []) as ExternalProcessorOption[],
    isLoading,
    error: error?.message ?? null,
  };
}
