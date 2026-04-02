'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { normalizeQueryParams } from '@/lib/routes/queryKeys';
import { crmService } from '@/services/crmService';
import type { OfferPayload } from '@/types/crm';

type UseOffersListParams = Record<string, unknown> & {
  enabled?: boolean;
};

export function useOffersList(params: UseOffersListParams = {}) {
  const { enabled = true, ...queryParams } = params;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const queryKey = ['crm', 'offers', 'list', tenantId ?? 'unknown', normalizeQueryParams(queryParams)];

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

export function useOffer(id: number | string | null | undefined) {
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const queryKey = ['crm', 'offer', 'detail', tenantId ?? 'unknown', id];

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: () => {
      if (id == null) throw new Error('Missing offer id');
      return crmService.getOffer(id);
    },
    enabled: !!tenantId && id != null,
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
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() ?? 'unknown' : 'unknown';

  const invalidate = async ({
    id,
    includeDashboard = false,
    includeProspectsList = false,
  }: {
    id?: number | string;
    includeDashboard?: boolean;
    includeProspectsList?: boolean;
  } = {}) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['crm', 'offers', 'list', tenantId] }),
      includeDashboard
        ? queryClient.invalidateQueries({ queryKey: ['crm', 'dashboard', tenantId] })
        : Promise.resolve(),
      includeProspectsList
        ? queryClient.invalidateQueries({ queryKey: ['crm', 'prospects', 'list', tenantId] })
        : Promise.resolve(),
      id ? queryClient.invalidateQueries({ queryKey: ['crm', 'offer', 'detail', tenantId, id] }) : Promise.resolve(),
    ]);
  };

  return {
    createOffer: useMutation({
      mutationFn: (payload: OfferPayload) => crmService.createOffer(payload),
      onSuccess: () => invalidate({ includeDashboard: true }),
    }),
    updateOffer: useMutation({
      mutationFn: ({ id, payload }: { id: number | string; payload: OfferPayload }) =>
        crmService.updateOffer(id, payload),
      onSuccess: (_, variables) => invalidate({ id: variables.id }),
    }),
    deleteOffer: useMutation({
      mutationFn: (id: number | string) => crmService.deleteOffer(id),
      onSuccess: () => invalidate({ includeDashboard: true }),
    }),
    sendOffer: useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id: number | string;
        payload: { channel: string; email?: string; subject?: string };
      }) => crmService.sendOffer(id, payload),
      onSuccess: (_, variables) =>
        invalidate({ id: variables.id, includeProspectsList: true }),
    }),
    sendOfferEmail: useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id: number | string;
        payload: { email: string; subject?: string };
      }) => crmService.sendOfferEmail(id, payload),
      onSuccess: (_, variables) =>
        invalidate({ id: variables.id, includeProspectsList: true }),
    }),
    acceptOffer: useMutation({
      mutationFn: (id: number | string) => crmService.acceptOffer(id),
      onSuccess: (_, id) =>
        invalidate({ id, includeDashboard: true, includeProspectsList: true }),
    }),
    rejectOffer: useMutation({
      mutationFn: ({ id, reason }: { id: number | string; reason: string }) =>
        crmService.rejectOffer(id, reason),
      onSuccess: (_, variables) =>
        invalidate({ id: variables.id, includeDashboard: true, includeProspectsList: true }),
    }),
    expireOffer: useMutation({
      mutationFn: (id: number | string) => crmService.expireOffer(id),
      onSuccess: (_, id) =>
        invalidate({ id, includeDashboard: true, includeProspectsList: true }),
    }),
    createOrderFromOffer: useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id: number | string;
        payload: Record<string, unknown>;
      }) => crmService.createOrderFromOffer(id, payload),
      onSuccess: (_, variables) =>
        invalidate({ id: variables.id, includeDashboard: true }),
    }),
  };
}
