'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { createRoute, getRoute, getRoutes, updateRoute } from '@/services/fieldOperatorService';

function useRoutesBase() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  return { token, tenantId };
}

export function useRoutes(params = {}) {
  const { token, tenantId } = useRoutesBase();
  return useQuery({
    queryKey: ['routes', tenantId ?? 'unknown', params],
    queryFn: () => getRoutes(token, params),
    enabled: Boolean(token) && Boolean(tenantId),
    select: (data) => ({
      items: Array.isArray(data?.data) ? data.data : [],
      meta: data?.meta ?? null,
      links: data?.links ?? null,
    }),
  });
}

export function useRoute(routeId) {
  const { token, tenantId } = useRoutesBase();
  return useQuery({
    queryKey: ['routes', 'detail', tenantId ?? 'unknown', routeId],
    queryFn: () => getRoute(token, routeId),
    enabled: Boolean(token) && Boolean(tenantId) && Boolean(routeId),
    select: (data) => data?.data ?? data,
  });
}

export function useRouteMutations() {
  const { token, tenantId } = useRoutesBase();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (payload) => createRoute(token, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['routes', tenantId ?? 'unknown'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ routeId, payload }) => updateRoute(token, routeId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['routes', tenantId ?? 'unknown'] });
      queryClient.invalidateQueries({ queryKey: ['routes', 'detail', tenantId ?? 'unknown', variables.routeId] });
    },
  });

  return {
    createRoute: createMutation.mutateAsync,
    updateRoute: updateMutation.mutateAsync,
    isSavingRoute: createMutation.isPending || updateMutation.isPending,
  };
}
