'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import {
  agendaKeys,
  crmDashboardKeys,
  crmCustomerKeys,
  interactionKeys,
  prospectKeys,
} from '@/lib/routes/queryKeys';
import { crmService } from '@/services/crmService';
import type {
  CommercialInteraction,
  CommercialInteractionPayload,
  CrmPaginatedResponse,
} from '@/types/crm';

const EMPTY_INTERACTIONS: CommercialInteraction[] = [];

function normalizeQueryParams(params: Record<string, unknown> = {}): Record<string, unknown> {
  return Object.entries(params)
    .filter(
      ([, value]) =>
        value != null &&
        value !== '' &&
        (!Array.isArray(value) || value.filter((v) => v != null && v !== '').length > 0)
    )
    .sort(([left], [right]) => left.localeCompare(right))
    .reduce<Record<string, unknown>>((acc, [key, value]) => {
      acc[key] = Array.isArray(value)
        ? value
            .filter((v) => v != null && v !== '')
            .map(String)
            .sort()
        : value;
      return acc;
    }, {});
}

export function useCommercialInteractions(params = {}) {
  const typedParams = params as Record<string, unknown> & { enabled?: boolean };
  const { enabled = true, ...queryParams } = typedParams;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const normalizedParams = normalizeQueryParams(queryParams);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: interactionKeys.list(tenantId, normalizedParams),
    queryFn: () => crmService.listCommercialInteractions(normalizedParams),
    enabled: !!tenantId && enabled,
  });

  return {
    data: data?.data ?? EMPTY_INTERACTIONS,
    meta: data?.meta ?? { current_page: 1, last_page: 1, per_page: 20, total: 0 },
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
}

export function useCommercialInteractionMutations() {
  const queryClient = useQueryClient();
  const tenantId = typeof window !== 'undefined' ? (getCurrentTenant() ?? 'unknown') : 'unknown';

  type InteractionsCache = CrmPaginatedResponse<CommercialInteraction> | undefined;
  type QueryKey = readonly unknown[];

  const getQueryParams = (queryKey: QueryKey) => {
    const maybeParams = queryKey[4];
    return maybeParams && typeof maybeParams === 'object'
      ? (maybeParams as Record<string, unknown>)
      : ({} as Record<string, unknown>);
  };

  const matchInteractionQueryByTarget = (
    payload: Partial<CommercialInteractionPayload>,
    queryParams: Record<string, unknown>
  ) => {
    const normalizedResult = String(payload.result ?? '');
    if (queryParams.result != null && normalizedResult) {
      if (String(queryParams.result) !== normalizedResult) return false;
    }

    const normalizedType = String(payload.type ?? '');
    if (queryParams.type != null && normalizedType) {
      if (String(queryParams.type) !== normalizedType) return false;
    }

    if (queryParams.search != null && String(queryParams.search).trim() !== '') {
      // No se puede inferir de forma segura si el nuevo item coincide con un filtro de búsqueda.
      return false;
    }

    if (payload.prospectId != null) {
      if (queryParams.customerId != null) return false;
      if (queryParams.prospectId != null)
        return String(queryParams.prospectId) === String(payload.prospectId);
      return true;
    }
    if (payload.customerId != null) {
      if (queryParams.prospectId != null) return false;
      if (queryParams.customerId != null)
        return String(queryParams.customerId) === String(payload.customerId);
      return true;
    }
    return true;
  };

  const buildTempInteraction = (payload: CommercialInteractionPayload): CommercialInteraction => ({
    id: `tmp-${Date.now()}`,
    prospectId: payload.prospectId ?? null,
    customerId: payload.customerId ?? null,
    isFromProspect: payload.prospectId != null,
    type: payload.type,
    occurredAt: payload.occurredAt,
    summary: payload.summary,
    result: payload.result,
    nextActionNote: payload.nextActionNote ?? null,
    nextActionAt: payload.nextActionAt ?? null,
  });

  const patchInteractionLists = (
    payload: Partial<CommercialInteractionPayload>,
    updater: (current: CommercialInteraction[]) => CommercialInteraction[]
  ) => {
    const listEntries = queryClient.getQueriesData<InteractionsCache>({
      queryKey: interactionKeys.listPrefix(tenantId),
    });

    const matchedEntries = listEntries.filter(([queryKey]) =>
      matchInteractionQueryByTarget(payload, getQueryParams(queryKey as QueryKey))
    );

    matchedEntries.forEach(([queryKey, cache]) => {
      if (!cache?.data) return;
      const nextData = updater(cache.data);
      queryClient.setQueryData<InteractionsCache>(queryKey, {
        ...cache,
        data: nextData,
        meta: cache.meta
          ? {
              ...cache.meta,
              total: Array.isArray(nextData)
                ? Math.max(Number(cache.meta.total ?? 0), nextData.length)
                : cache.meta.total,
            }
          : cache.meta,
      });
    });

    return matchedEntries;
  };

  const invalidate = async (payload: Partial<CommercialInteractionPayload> = {}) => {
    const impactsAgenda = Boolean(payload.agendaActionId);
    await Promise.all([
      impactsAgenda
        ? queryClient.invalidateQueries({ queryKey: crmDashboardKeys.all(tenantId) })
        : Promise.resolve(),
      impactsAgenda
        ? queryClient.invalidateQueries({ queryKey: agendaKeys.all(tenantId) })
        : Promise.resolve(),
      impactsAgenda
        ? queryClient.invalidateQueries({ queryKey: agendaKeys.summaryPrefix(tenantId) })
        : Promise.resolve(),
      payload.prospectId
        ? queryClient.invalidateQueries({ queryKey: prospectKeys.listPrefix(tenantId) })
        : Promise.resolve(),
      payload.prospectId
        ? queryClient.invalidateQueries({
            queryKey: prospectKeys.detail(tenantId, payload.prospectId),
          })
        : Promise.resolve(),
      payload.customerId
        ? queryClient.invalidateQueries({
            queryKey: crmCustomerKeys.detail(tenantId, payload.customerId),
          })
        : Promise.resolve(),
    ]);
  };

  return {
    createInteraction: useMutation({
      mutationFn: (payload: CommercialInteractionPayload) =>
        crmService.createCommercialInteraction(payload),
      onMutate: async (payload) => {
        const tempInteraction = buildTempInteraction(payload);
        await queryClient.cancelQueries({ queryKey: interactionKeys.listPrefix(tenantId) });

        const previousLists = patchInteractionLists(payload, (current) => [
          tempInteraction,
          ...current,
        ]);
        return { previousLists, tempInteractionId: tempInteraction.id, payload };
      },
      onError: (_error, _payload, context) => {
        if (!context?.previousLists) return;
        context.previousLists.forEach(([queryKey, cache]) => {
          queryClient.setQueryData(queryKey, cache);
        });
      },
      onSuccess: (response, payload, context) => {
        const createdInteraction = response?.data;
        if (!createdInteraction) return;

        patchInteractionLists(payload, (current) => {
          const withoutTemp = current.filter(
            (item) => String(item.id) !== String(context?.tempInteractionId)
          );
          const exists = withoutTemp.some(
            (item) => String(item.id) === String(createdInteraction.id)
          );
          return exists ? withoutTemp : [createdInteraction, ...withoutTemp];
        });
        invalidate(payload);
      },
    }),
  };
}
