'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { fieldRouteKeys } from '@/lib/routes/queryKeys';
import { normalizeRouteCollection, normalizeRouteEntity } from '@/lib/routes/routeStops';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { getFieldRoute, getFieldRoutes, updateFieldRouteStop } from '@/services/fieldOperatorService';
import { useFieldOperator } from '@/context/FieldOperatorContext';

type FieldParams = Record<string, string | number | boolean | null | undefined>;
type StopPayload = Record<string, unknown>;

function useFieldRouteBase() {
  const { data: session } = useSession();
  const { fieldOperatorId } = useFieldOperator();
  const token = session?.user?.accessToken;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  return { token, tenantId, fieldOperatorId };
}

export function useFieldRoutes(params: FieldParams = {}) {
  const { token, tenantId, fieldOperatorId } = useFieldRouteBase();
  const query = useQuery({
    queryKey: fieldRouteKeys.list(tenantId, params),
    queryFn: () => getFieldRoutes(token as string, params),
    enabled: Boolean(token) && Boolean(tenantId) && Boolean(fieldOperatorId),
    select: (data) => ({
      items: normalizeRouteCollection(Array.isArray(data?.data) ? data.data : []),
      meta: data?.meta ?? null,
      links: data?.links ?? null,
    }),
  });

  return {
    ...query,
    errorMessage: query.error instanceof Error ? query.error.message : null,
  };
}

export function useFieldRoute(routeId: number | string | null | undefined) {
  const { token, tenantId, fieldOperatorId } = useFieldRouteBase();
  const query = useQuery({
    queryKey: fieldRouteKeys.detail(tenantId, routeId),
    queryFn: () => getFieldRoute(token as string, routeId as number | string),
    enabled: Boolean(token) && Boolean(tenantId) && Boolean(fieldOperatorId) && Boolean(routeId),
    select: (data) => normalizeRouteEntity(data?.data ?? data),
  });

  return {
    ...query,
    errorMessage: query.error instanceof Error ? query.error.message : null,
  };
}

export function useFieldRouteStopMutation(routeId: number | string | null | undefined) {
  const { token, tenantId, fieldOperatorId } = useFieldRouteBase();
  const queryClient = useQueryClient();
  const mutation = useMutation<unknown, Error, { stopId: number | string; payload: StopPayload }>({
    mutationFn: ({ stopId, payload }) => updateFieldRouteStop(token as string, routeId as number | string, stopId, payload),
    onSuccess: (response) => {
      const updatedRoute = normalizeRouteEntity(
        ((response as { data?: unknown } | undefined)?.data ?? response) as Partial<import('@/types/field').DeliveryRoute>
      );
      queryClient.setQueryData(fieldRouteKeys.detail(tenantId, routeId), updatedRoute);
      queryClient.invalidateQueries({ queryKey: fieldRouteKeys.all(tenantId) });
    },
  });

  return {
    updateStop: mutation.mutateAsync,
    isUpdatingStop: mutation.isPending || !fieldOperatorId,
  };
}
