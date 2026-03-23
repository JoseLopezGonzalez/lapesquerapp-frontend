'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { createRouteTemplate, getRouteTemplates, updateRouteTemplate } from '@/services/fieldOperatorService';

type TemplateParams = Record<string, string | number | boolean | null | undefined>;
type TemplatePayload = Record<string, unknown>;

function useTemplatesBase() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  return { token, tenantId };
}

export function useRouteTemplates(params: TemplateParams = {}) {
  const { token, tenantId } = useTemplatesBase();
  return useQuery({
    queryKey: ['route-templates', tenantId ?? 'unknown', params],
    queryFn: () => getRouteTemplates(token as string, params),
    enabled: Boolean(token) && Boolean(tenantId),
    select: (data) => ({
      items: Array.isArray(data?.data) ? data.data : [],
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['route-templates', tenantId ?? 'unknown'] }),
  });

  const updateMutation = useMutation<unknown, Error, { templateId: number | string; payload: TemplatePayload }>({
    mutationFn: ({ templateId, payload }) => updateRouteTemplate(token as string, templateId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['route-templates', tenantId ?? 'unknown'] }),
  });

  return {
    createTemplate: createMutation.mutateAsync,
    updateTemplate: updateMutation.mutateAsync,
    isSavingTemplate: createMutation.isPending || updateMutation.isPending,
  };
}
