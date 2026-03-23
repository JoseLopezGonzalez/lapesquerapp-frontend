'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { routeTemplateKeys } from '@/lib/routes/queryKeys';
import { normalizeRouteCollection } from '@/lib/routes/routeStops';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { createRouteTemplate, getRouteTemplates, updateRouteTemplate } from '@/services/fieldOperatorService';

type TemplateParams = Record<string, string | number | boolean | null | undefined>;
type TemplatePayload = Record<string, unknown>;
type TemplateQueryOptions = {
  enabled?: boolean;
};

function useTemplatesBase() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  return { token, tenantId };
}

export function useRouteTemplates(params: TemplateParams = {}, options: TemplateQueryOptions = {}) {
  const { token, tenantId } = useTemplatesBase();
  const { enabled = true } = options;
  return useQuery({
    queryKey: routeTemplateKeys.list(tenantId, params),
    queryFn: () => getRouteTemplates(token as string, params),
    enabled: Boolean(token) && Boolean(tenantId) && enabled,
    select: (data) => ({
      items: normalizeRouteCollection(Array.isArray(data?.data) ? data.data : []),
      meta: data?.meta ?? null,
      links: data?.links ?? null,
    }),
  });
}

export function useRouteTemplateMutations() {
  const { token, tenantId } = useTemplatesBase();
  const queryClient = useQueryClient();

  const createMutation = useMutation<unknown, Error, TemplatePayload>({
    mutationFn: (payload) => createRouteTemplate(token as string, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: routeTemplateKeys.list(tenantId) }),
  });

  const updateMutation = useMutation<unknown, Error, { templateId: number | string; payload: TemplatePayload }>({
    mutationFn: ({ templateId, payload }) => updateRouteTemplate(token as string, templateId, payload),
    onSuccess: (response, variables) => {
      const updatedTemplate = normalizeRouteCollection([
        ((response as { data?: unknown } | undefined)?.data ?? response) as Partial<import('@/types/field').DeliveryRoute>,
      ])[0];
      const listEntries = queryClient.getQueriesData<{
        items?: ReturnType<typeof normalizeRouteCollection>;
        meta?: unknown;
        links?: unknown;
      }>({
        queryKey: routeTemplateKeys.list(tenantId),
      });
      listEntries.forEach(([queryKey, cache]) => {
        if (!cache?.items) return;
        queryClient.setQueryData(queryKey, {
          ...cache,
          items: cache.items.map((item) =>
            String(item.id) === String(variables.templateId) ? updatedTemplate : item
          ),
        });
      });
    },
  });

  return {
    createTemplate: createMutation.mutateAsync,
    updateTemplate: updateMutation.mutateAsync,
    isSavingTemplate: createMutation.isPending || updateMutation.isPending,
  };
}
