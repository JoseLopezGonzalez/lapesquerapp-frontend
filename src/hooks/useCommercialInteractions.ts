'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { crmService } from '@/services/crmService';
import type { CommercialInteractionPayload } from '@/types/crm';

export function useCommercialInteractions(params = {}) {
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const queryKey = ['crm', 'interactions', 'list', tenantId ?? 'unknown', params];

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: () => crmService.listCommercialInteractions(params),
    enabled: !!tenantId,
  });

  return {
    data: data?.data ?? [],
    meta: data?.meta ?? { current_page: 1, last_page: 1, per_page: 20, total: 0 },
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
}

export function useCommercialInteractionMutations() {
  const queryClient = useQueryClient();
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : 'unknown';

  const invalidate = async (payload: Partial<CommercialInteractionPayload> = {}) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['crm', 'dashboard', tenantId] }),
      queryClient.invalidateQueries({ queryKey: ['crm', 'agenda', tenantId] }),
      queryClient.invalidateQueries({ queryKey: ['crm', 'agenda', 'summary', tenantId] }),
      queryClient.invalidateQueries({ queryKey: ['crm', 'interactions', 'list', tenantId] }),
      payload.prospectId
        ? queryClient.invalidateQueries({ queryKey: ['crm', 'prospect', 'detail', tenantId, payload.prospectId] })
        : Promise.resolve(),
      payload.customerId
        ? queryClient.invalidateQueries({ queryKey: ['crm', 'customers', 'detail'] })
        : Promise.resolve(),
    ]);
  };

  return {
    createInteraction: useMutation({
      mutationFn: (payload: CommercialInteractionPayload) => crmService.createCommercialInteraction(payload),
      onSuccess: (_, payload) => invalidate(payload),
    }),
  };
}
