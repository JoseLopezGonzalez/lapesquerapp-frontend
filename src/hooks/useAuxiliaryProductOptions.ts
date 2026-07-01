'use client';

import { useQuery } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { auxiliaryProductKeys } from '@/lib/routes/queryKeys';
import { auxiliaryProductService } from '@/services/domain/auxiliary-products/auxiliaryProductService';
import type { AuxiliaryProductOption } from '@/types/catalog';

export function useAuxiliaryProductOptions(params: { enabled?: boolean } = {}) {
  const { enabled = true } = params;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  const { data, isLoading, error } = useQuery({
    queryKey: auxiliaryProductKeys.options(tenantId),
    queryFn: () => auxiliaryProductService.getOptions(),
    enabled: !!tenantId && enabled,
    staleTime: 5 * 60 * 1000,
  });

  return {
    options: (data ?? []) as AuxiliaryProductOption[],
    isLoading,
    error: error?.message ?? null,
  };
}
