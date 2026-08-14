'use client';

import { useQuery } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { receptionAttachmentKeys } from '@/lib/routes/queryKeys';
import { receptionAttachmentService } from '@/services/domain/receptions/receptionAttachmentService';

/** Adjuntos de solo lectura de una recepción — ver receptionAttachmentService. */
export function useReceptionAttachments(
  receptionId: number | string | null | undefined,
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
    queryKey: receptionAttachmentKeys.list(tenantId, receptionId, { perPage }),
    queryFn: () => receptionAttachmentService.list(receptionId as number | string, { perPage }),
    enabled: !!tenantId && receptionId != null && enabled,
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
