'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { crmService } from '@/services/crmService';
import type { ProspectContactPayload, ProspectPayload } from '@/types/crm';

type UseProspectsListParams = Record<string, unknown> & {
  enabled?: boolean;
};

type QueryKey = readonly unknown[];

function useTenantQueryKey(prefix: unknown[], ...parts: unknown[]): [QueryKey, string | null] {
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  return [[...prefix, tenantId ?? 'unknown', ...parts], tenantId];
}

export function useProspectsList(params: UseProspectsListParams = {}) {
  const { enabled = true, ...queryParams } = params;
  const [queryKey, tenantId] = useTenantQueryKey(['crm', 'prospects', 'list'], queryParams);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: () => crmService.listProspects(queryParams),
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

export function useProspect(id: number | string | null | undefined) {
  const [queryKey, tenantId] = useTenantQueryKey(['crm', 'prospect', 'detail'], id);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: () => {
      if (id == null) throw new Error('Missing prospect id');
      return crmService.getProspect(id);
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

export function useProspectContacts(id: number | string | null | undefined) {
  const [queryKey, tenantId] = useTenantQueryKey(['crm', 'prospect', 'contacts'], id);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: () => {
      if (id == null) throw new Error('Missing prospect id');
      return crmService.listProspectContacts(id);
    },
    enabled: !!tenantId && id != null,
  });

  return {
    data: data?.data ?? [],
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
}

export function useProspectMutations() {
  const queryClient = useQueryClient();
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : 'unknown';

  const invalidate = async (id?: number | string) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['crm', 'prospects', 'list', tenantId] }),
      queryClient.invalidateQueries({ queryKey: ['crm', 'dashboard', tenantId] }),
      queryClient.invalidateQueries({ queryKey: ['crm', 'agenda', tenantId] }),
      queryClient.invalidateQueries({ queryKey: ['crm', 'agenda', 'summary', tenantId] }),
      queryClient.invalidateQueries({ queryKey: ['crm', 'offers', 'list', tenantId] }),
      id ? queryClient.invalidateQueries({ queryKey: ['crm', 'prospect', 'detail', tenantId, id] }) : Promise.resolve(),
      id ? queryClient.invalidateQueries({ queryKey: ['crm', 'prospect', 'contacts', tenantId, id] }) : Promise.resolve(),
    ]);
  };

  return {
    createProspect: useMutation({
      mutationFn: (payload: ProspectPayload) => crmService.createProspect(payload),
      onSuccess: () => invalidate(),
    }),
    updateProspect: useMutation({
      mutationFn: ({ id, payload }: { id: number | string; payload: ProspectPayload }) =>
        crmService.updateProspect(id, payload),
      onSuccess: (_, variables) => invalidate(variables.id),
    }),
    deleteProspect: useMutation({
      mutationFn: (id: number | string) => crmService.deleteProspect(id),
      onSuccess: () => invalidate(),
    }),
    convertProspect: useMutation({
      mutationFn: (id: number | string) => crmService.convertProspectToCustomer(id),
      onSuccess: (_, id) => invalidate(id),
    }),
    scheduleAction: useMutation({
      mutationFn: ({
        id,
        nextActionAt,
        nextActionNote,
      }: {
        id: number | string;
        nextActionAt: string;
        nextActionNote?: string | null;
      }) => crmService.scheduleProspectAction(id, nextActionAt, nextActionNote),
      onSuccess: (_, variables) => invalidate(variables.id),
    }),
    clearAction: useMutation({
      mutationFn: (id: number | string) => crmService.clearProspectAction(id),
      onSuccess: (_, id) => invalidate(id),
    }),
    createContact: useMutation({
      mutationFn: ({
        prospectId,
        payload,
      }: {
        prospectId: number | string;
        payload: ProspectContactPayload;
      }) => crmService.createProspectContact(prospectId, payload),
      onSuccess: (_, variables) => invalidate(variables.prospectId),
    }),
    updateContact: useMutation({
      mutationFn: ({
        prospectId,
        contactId,
        payload,
      }: {
        prospectId: number | string;
        contactId: number | string;
        payload: ProspectContactPayload;
      }) => crmService.updateProspectContact(prospectId, contactId, payload),
      onSuccess: (_, variables) => invalidate(variables.prospectId),
    }),
    deleteContact: useMutation({
      mutationFn: ({
        prospectId,
        contactId,
      }: {
        prospectId: number | string;
        contactId: number | string;
      }) => crmService.deleteProspectContact(prospectId, contactId),
      onSuccess: (_, variables) => invalidate(variables.prospectId),
    }),
  };
}
