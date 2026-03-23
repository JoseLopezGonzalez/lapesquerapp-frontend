'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
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
  return useQuery({
    queryKey: ['field', 'routes', tenantId ?? 'unknown', params],
    queryFn: () => getFieldRoutes(token as string, params),
    enabled: Boolean(token) && Boolean(tenantId) && Boolean(fieldOperatorId),
    select: (data) => ({
      items: Array.isArray(data?.data) ? data.data : [],
      meta: data?.meta ?? null,
      links: data?.links ?? null,
    }),
  });
}

export function useFieldRoute(routeId: number | string | null | undefined) {
  const { token, tenantId, fieldOperatorId } = useFieldRouteBase();
  return useQuery({
    queryKey: ['field', 'routes', 'detail', tenantId ?? 'unknown', routeId],
    queryFn: () => getFieldRoute(token as string, routeId as number | string),
    enabled: Boolean(token) && Boolean(tenantId) && Boolean(fieldOperatorId) && Boolean(routeId),
    select: (data) => data?.data ?? data,
  });
}

export function useFieldRouteStopMutation(routeId: number | string | null | undefined) {
  const { token, tenantId, fieldOperatorId } = useFieldRouteBase();
  const queryClient = useQueryClient();
  const mutation = useMutation<unknown, Error, { stopId: number | string; payload: StopPayload }>({
    mutationFn: ({ stopId, payload }) => updateFieldRouteStop(token as string, routeId as number | string, stopId, payload),
    onSuccess: (response) => {
      const updatedRoute = (response as { data?: unknown } | undefined)?.data ?? response;
      queryClient.setQueryData(['field', 'routes', 'detail', tenantId ?? 'unknown', routeId], updatedRoute);
      queryClient.invalidateQueries({ queryKey: ['field', 'routes', tenantId ?? 'unknown'] });
    },
  });

  return {
    updateStop: mutation.mutateAsync,
    isUpdatingStop: mutation.isPending || !fieldOperatorId,
  };
}
