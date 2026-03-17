'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { crmService } from '@/services/crmService';

export function useOffersList(params = {}) {
  const { enabled = true, ...queryParams } = params;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const queryKey = ['crm', 'offers', 'list', tenantId ?? 'unknown', queryParams];

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: () => crmService.listOffers(queryParams),
    enabled: !!tenantId && enabled,
  });

  return {
    data: data?.data ?? [],
    meta: data?.meta ?? { current_page: 1, last_page: 1, per_page: 12, total: 0 },
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
}

export function useOffer(id) {
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const queryKey = ['crm', 'offer', 'detail', tenantId ?? 'unknown', id];

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: () => crmService.getOffer(id),
    enabled: !!tenantId && !!id,
  });

  return {
    data: data?.data ?? null,
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
}

export function useOfferMutations() {
  const queryClient = useQueryClient();
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : 'unknown';

  const invalidate = async (id) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['crm', 'offers', 'list', tenantId] }),
      queryClient.invalidateQueries({ queryKey: ['crm', 'dashboard', tenantId] }),
      queryClient.invalidateQueries({ queryKey: ['crm', 'prospects', 'list', tenantId] }),
      id ? queryClient.invalidateQueries({ queryKey: ['crm', 'offer', 'detail', tenantId, id] }) : Promise.resolve(),
    ]);
  };

  return {
    createOffer: useMutation({
      mutationFn: (payload) => crmService.createOffer(payload),
      onSuccess: () => invalidate(),
    }),
    updateOffer: useMutation({
      mutationFn: ({ id, payload }) => crmService.updateOffer(id, payload),
      onSuccess: (_, variables) => invalidate(variables.id),
    }),
    deleteOffer: useMutation({
      mutationFn: (id) => crmService.deleteOffer(id),
      onSuccess: () => invalidate(),
    }),
    sendOffer: useMutation({
      mutationFn: ({ id, payload }) => crmService.sendOffer(id, payload),
      onSuccess: (_, variables) => invalidate(variables.id),
    }),
    sendOfferEmail: useMutation({
      mutationFn: ({ id, payload }) => crmService.sendOfferEmail(id, payload),
      onSuccess: (_, variables) => invalidate(variables.id),
    }),
    acceptOffer: useMutation({
      mutationFn: (id) => crmService.acceptOffer(id),
      onSuccess: (_, id) => invalidate(id),
    }),
    rejectOffer: useMutation({
      mutationFn: ({ id, reason }) => crmService.rejectOffer(id, reason),
      onSuccess: (_, variables) => invalidate(variables.id),
    }),
    expireOffer: useMutation({
      mutationFn: (id) => crmService.expireOffer(id),
      onSuccess: (_, id) => invalidate(id),
    }),
    createOrderFromOffer: useMutation({
      mutationFn: ({ id, payload }) => crmService.createOrderFromOffer(id, payload),
      onSuccess: (_, variables) => invalidate(variables.id),
    }),
  };
}
