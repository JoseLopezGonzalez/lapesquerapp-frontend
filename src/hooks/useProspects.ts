'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { crmService } from '@/services/crmService';

function useTenantQueryKey(prefix, ...parts) {
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  return [[...prefix, tenantId ?? 'unknown', ...parts], tenantId];
}

export function useProspectsList(params = {}) {
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

export function useProspect(id) {
  const [queryKey, tenantId] = useTenantQueryKey(['crm', 'prospect', 'detail'], id);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: () => crmService.getProspect(id),
    enabled: !!tenantId && !!id,
  });

  return {
    data: data?.data ?? null,
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
}

export function useProspectContacts(id) {
  const [queryKey, tenantId] = useTenantQueryKey(['crm', 'prospect', 'contacts'], id);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: () => crmService.listProspectContacts(id),
    enabled: !!tenantId && !!id,
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

  const invalidate = async (id) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['crm', 'prospects', 'list', tenantId] }),
      queryClient.invalidateQueries({ queryKey: ['crm', 'dashboard', tenantId] }),
      queryClient.invalidateQueries({ queryKey: ['crm', 'offers', 'list', tenantId] }),
      id ? queryClient.invalidateQueries({ queryKey: ['crm', 'prospect', 'detail', tenantId, id] }) : Promise.resolve(),
    ]);
  };

  return {
    createProspect: useMutation({
      mutationFn: (payload) => crmService.createProspect(payload),
      onSuccess: () => invalidate(),
    }),
    updateProspect: useMutation({
      mutationFn: ({ id, payload }) => crmService.updateProspect(id, payload),
      onSuccess: (_, variables) => invalidate(variables.id),
    }),
    deleteProspect: useMutation({
      mutationFn: (id) => crmService.deleteProspect(id),
      onSuccess: () => invalidate(),
    }),
    convertProspect: useMutation({
      mutationFn: (id) => crmService.convertProspectToCustomer(id),
      onSuccess: (_, id) => invalidate(id),
    }),
    scheduleAction: useMutation({
      mutationFn: ({ id, nextActionAt }) => crmService.scheduleProspectAction(id, nextActionAt),
      onSuccess: (_, variables) => invalidate(variables.id),
    }),
    clearAction: useMutation({
      mutationFn: (id) => crmService.clearProspectAction(id),
      onSuccess: (_, id) => invalidate(id),
    }),
    createContact: useMutation({
      mutationFn: ({ prospectId, payload }) => crmService.createProspectContact(prospectId, payload),
      onSuccess: (_, variables) => invalidate(variables.prospectId),
    }),
    updateContact: useMutation({
      mutationFn: ({ prospectId, contactId, payload }) =>
        crmService.updateProspectContact(prospectId, contactId, payload),
      onSuccess: (_, variables) => invalidate(variables.prospectId),
    }),
    deleteContact: useMutation({
      mutationFn: ({ prospectId, contactId }) => crmService.deleteProspectContact(prospectId, contactId),
      onSuccess: (_, variables) => invalidate(variables.prospectId),
    }),
  };
}
