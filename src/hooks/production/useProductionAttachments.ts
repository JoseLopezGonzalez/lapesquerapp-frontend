'use client';

import { useQuery } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { productionAttachmentKeys } from '@/lib/routes/queryKeys';
import { productionAttachmentService } from '@/services/domain/productions/productionAttachmentService';

/** Adjuntos de solo lectura de una producción — ver productionAttachmentService. */
export function useProductionAttachments(
  productionId: number | string | null | undefined,
  options: { perPage?: number; enabled?: boolean } = {}
) {
  const { perPage = 20, enabled = true } = options;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: productionAttachmentKeys.list(tenantId, productionId, { perPage }),
    queryFn: () => productionAttachmentService.list(productionId as number | string, { perPage }),
    enabled: !!tenantId && productionId != null && enabled,
    staleTime: 2 * 60 * 1000,
  });

  return {
    attachments: response?.data ?? [],
    total: response?.meta?.total ?? 0,
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
}
