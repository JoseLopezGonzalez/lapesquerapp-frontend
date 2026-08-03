'use client';

import { useQuery } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { countryOptionKeys } from '@/lib/routes/queryKeys';
import { countryService } from '@/services/domain/countries/countryService';
import type { CatalogOption } from '@/types/catalog';

export function useCountryOptions(params: { enabled?: boolean } = {}) {
  const { enabled = true } = params;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  const { data, isLoading, error } = useQuery({
    queryKey: countryOptionKeys.list(tenantId),
    queryFn: () => countryService.getOptions(),
    enabled: !!tenantId && enabled,
    staleTime: 10 * 60 * 1000,
  });

  return {
    options: (data ?? []) as CatalogOption[],
    isLoading,
    error: error?.message ?? null,
  };
}
