'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { getFieldRoute, getFieldRoutes, updateFieldRouteStop } from '@/services/fieldOperatorService';
import { useFieldOperator } from '@/context/FieldOperatorContext';

function useFieldRouteBase() {
  const { data: session } = useSession();
  const { fieldOperatorId } = useFieldOperator();
  const token = session?.user?.accessToken;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  return { token, tenantId, fieldOperatorId };
}

export function useFieldRoutes(params = {}) {
  const { token, tenantId, fieldOperatorId } = useFieldRouteBase();
  return useQuery({
    queryKey: ['field', 'routes', tenantId ?? 'unknown', params],
    queryFn: () => getFieldRoutes(token, params),
    enabled: Boolean(token) && Boolean(tenantId) && Boolean(fieldOperatorId),
    select: (data) => ({
      items: Array.isArray(data?.data) ? data.data : [],
      meta: data?.meta ?? null,
      links: data?.links ?? null,
    }),
  });
}

export function useFieldRoute(routeId) {
  const { token, tenantId, fieldOperatorId } = useFieldRouteBase();
  return useQuery({
    queryKey: ['field', 'routes', 'detail', tenantId ?? 'unknown', routeId],
    queryFn: () => getFieldRoute(token, routeId),
    enabled: Boolean(token) && Boolean(tenantId) && Boolean(fieldOperatorId) && Boolean(routeId),
    select: (data) => data?.data ?? data,
  });
}

export function useFieldRouteStopMutation(routeId) {
  const { token, tenantId, fieldOperatorId } = useFieldRouteBase();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ stopId, payload }) => updateFieldRouteStop(token, routeId, stopId, payload),
    onSuccess: (response) => {
      const updatedRoute = response?.data ?? response;
      queryClient.setQueryData(['field', 'routes', 'detail', tenantId ?? 'unknown', routeId], updatedRoute);
      queryClient.invalidateQueries({ queryKey: ['field', 'routes', tenantId ?? 'unknown'] });
    },
  });

  return {
    updateStop: mutation.mutateAsync,
    isUpdatingStop: mutation.isPending || !fieldOperatorId,
  };
}
