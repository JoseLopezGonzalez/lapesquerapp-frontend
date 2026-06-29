'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import {
  agendaKeys,
  crmDashboardKeys,
  crmCustomerKeys,
  prospectKeys,
} from '@/lib/routes/queryKeys';
import { crmService } from '@/services/crmService';
import type { AgendaAction, ResolveNextActionPayload } from '@/types/crm';

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

async function invalidateAgendaQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  tenantId: string
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: agendaKeys.all(tenantId) }),
    queryClient.invalidateQueries({ queryKey: agendaKeys.summaryPrefix(tenantId) }),
  ]);
}

export function useAgenda(params: AgendaQueryParams = {}) {
  const { enabled = true, ...queryParams } = params;
  const tenantId = getTenantId();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: agendaKeys.list(tenantId, queryParams as Record<string, unknown>),
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

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: agendaKeys.summary(tenantId, queryParams as Record<string, unknown>),
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

export function usePendingAgendaAction(
  targetType?: 'prospect' | 'customer',
  targetId?: number | string,
  enabled = true
) {
  const tenantId = getTenantId();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: agendaKeys.pending(tenantId, targetType, targetId),
    queryFn: () =>
      crmService.getPendingAgendaAction({
        targetType: targetType as 'prospect' | 'customer',
        targetId: targetId as number | string,
      }),
    enabled: !!tenantId && !!targetType && !!targetId && enabled,
  });

  const rawPending = data?.data as
    | {
        hasPending?: boolean;
        pendingAction?: AgendaAction | null;
        agendaActionId?: number | string;
      }
    | null
    | undefined;
  const pendingAction =
    rawPending?.pendingAction ??
    (rawPending?.agendaActionId != null ? (rawPending as unknown as AgendaAction) : null);
  const hasPending =
    typeof rawPending?.hasPending === 'boolean' ? rawPending.hasPending : Boolean(pendingAction);

  return {
    data: { hasPending, pendingAction },
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
      mutationFn: ({ id, payload }: AgendaReschedulePayload) =>
        crmService.rescheduleAgendaAction(id, payload),
      onSuccess: async () => {
        await invalidateAgendaQueries(queryClient, tenantId);
      },
    }),
    cancelAgendaAction: useMutation({
      mutationFn: ({ id, reason }: { id: number | string; reason: string }) =>
        crmService.cancelAgendaAction(id, reason),
      onSuccess: async () => {
        await Promise.all([
          invalidateAgendaQueries(queryClient, tenantId),
          queryClient.invalidateQueries({ queryKey: agendaKeys.pendingPrefix(tenantId) }),
        ]);
      },
    }),
    resolveNextAction: useMutation({
      mutationFn: (payload: ResolveNextActionPayload) => crmService.resolveNextAction(payload),
      onSuccess: async (_data, payload) => {
        await Promise.all([
          invalidateAgendaQueries(queryClient, tenantId),
          queryClient.invalidateQueries({ queryKey: agendaKeys.pendingPrefix(tenantId) }),
          queryClient.invalidateQueries({ queryKey: crmDashboardKeys.all(tenantId) }),
          queryClient.invalidateQueries({ queryKey: prospectKeys.listPrefix(tenantId) }),
          payload.targetType === 'prospect'
            ? queryClient.invalidateQueries({ queryKey: prospectKeys.detailPrefix(tenantId) })
            : queryClient.invalidateQueries({ queryKey: crmCustomerKeys.detailPrefix(tenantId) }),
        ]);
      },
    }),
  };
}
