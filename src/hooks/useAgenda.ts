'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { normalizeQueryParams } from '@/lib/routes/queryKeys';
import { crmService } from '@/services/crmService';

type AgendaQueryParams = {
  enabled?: boolean;
  startDate?: string;
  endDate?: string;
  targetType?: 'prospect' | 'customer';
  status?: string[];
  limitNext?: number;
};

type AgendaReschedulePayload = {
  id: number | string;
  payload: {
    nextActionAt: string;
    nextActionNote?: string | null;
    sourceInteractionId?: number | string | null;
  };
};

function getTenantId() {
  return typeof window !== 'undefined' ? getCurrentTenant() : null;
}

async function invalidateAgendaQueries(queryClient: ReturnType<typeof useQueryClient>, tenantId: string) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['crm', 'agenda', tenantId] }),
    queryClient.invalidateQueries({ queryKey: ['crm', 'agenda', 'summary', tenantId] }),
  ]);
}

export function useAgenda(params: AgendaQueryParams = {}) {
  const { enabled = true, ...queryParams } = params;
  const tenantId = getTenantId();
  const queryKey = ['crm', 'agenda', tenantId ?? 'unknown', normalizeQueryParams(queryParams)];

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: () => crmService.listAgenda(queryParams),
    enabled: !!tenantId && enabled,
  });

  return {
    data: data?.data?.events ?? [],
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
}

export function useAgendaSummary(params: AgendaQueryParams = {}) {
  const { enabled = true, ...queryParams } = params;
  const tenantId = getTenantId();
  const queryKey = ['crm', 'agenda', 'summary', tenantId ?? 'unknown', normalizeQueryParams(queryParams)];

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: () => crmService.getAgendaSummary(queryParams),
    enabled: !!tenantId && enabled,
  });

  return {
    data: data?.data ?? { overdue: [], today: [], next: [] },
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
}

export function useAgendaMutations() {
  const queryClient = useQueryClient();
  const tenantId = getTenantId() ?? 'unknown';

  return {
    rescheduleAgendaAction: useMutation({
      mutationFn: ({ id, payload }: AgendaReschedulePayload) => crmService.rescheduleAgendaAction(id, payload),
      onSuccess: async () => {
        await invalidateAgendaQueries(queryClient, tenantId);
      },
    }),
    cancelAgendaAction: useMutation({
      mutationFn: (id: number | string) => crmService.cancelAgendaAction(id),
      onSuccess: async () => {
        await invalidateAgendaQueries(queryClient, tenantId);
      },
    }),
  };
}
