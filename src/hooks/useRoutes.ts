'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { commercialRouteKeys } from '@/lib/routes/queryKeys';
import { normalizeRouteCollection, normalizeRouteEntity } from '@/lib/routes/routeStops';
import { createRoute, getRoute, getRoutes, updateRoute } from '@/services/fieldOperatorService';

type RouteParams = Record<string, string | number | boolean | null | undefined>;
type RoutePayload = Record<string, unknown>;

function useRoutesBase() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  return { token, tenantId };
}

export function useRoutes(params: RouteParams = {}) {
  const { token, tenantId } = useRoutesBase();
  return useQuery({
    queryKey: commercialRouteKeys.list(tenantId, params),
    queryFn: () => getRoutes(token as string, params),
    enabled: Boolean(token) && Boolean(tenantId),
    select: (data) => ({
      items: normalizeRouteCollection(Array.isArray(data?.data) ? data.data : []),
      meta: data?.meta ?? null,
      links: data?.links ?? null,
    }),
  });
}

export function useRoute(routeId: number | string | null | undefined) {
  const { token, tenantId } = useRoutesBase();
  return useQuery({
    queryKey: commercialRouteKeys.detail(tenantId, routeId),
    queryFn: () => getRoute(token as string, routeId as number | string),
    enabled: Boolean(token) && Boolean(tenantId) && Boolean(routeId),
    select: (data) => normalizeRouteEntity(data?.data ?? data),
  });
}

export function useRouteMutations() {
  const { token, tenantId } = useRoutesBase();
  const queryClient = useQueryClient();

  const createMutation = useMutation<unknown, Error, RoutePayload>({
    mutationFn: (payload) => createRoute(token as string, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: commercialRouteKeys.all(tenantId) }),
  });

  const updateMutation = useMutation<unknown, Error, { routeId: number | string; payload: RoutePayload }>({
    mutationFn: ({ routeId, payload }) => updateRoute(token as string, routeId, payload),
    onSuccess: (response, variables) => {
      const updatedRoute = normalizeRouteEntity((response as { data?: unknown } | undefined)?.data ?? response);
      queryClient.setQueryData(commercialRouteKeys.detail(tenantId, variables.routeId), updatedRoute);
      queryClient.invalidateQueries({ queryKey: commercialRouteKeys.all(tenantId) });
    },
  });

  return {
    createRoute: createMutation.mutateAsync,
    updateRoute: updateMutation.mutateAsync,
    isSavingRoute: createMutation.isPending || updateMutation.isPending,
  };
}
