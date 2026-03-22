'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { fieldOperatorAdminService } from '@/services/domain/field-operators/fieldOperatorService';

export function useFieldOperators(params = {}) {
  const { filters = {}, page = 1, perPage = 12, enabled = true } = params;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const query = useQuery({
    queryKey: ['field-operators', 'list', tenantId ?? 'unknown', filters, page, perPage],
    queryFn: () => fieldOperatorAdminService.list(filters, { page, perPage }),
    enabled: Boolean(tenantId) && enabled,
  });

  return {
    data: Array.isArray(query.data?.data) ? query.data.data : [],
    meta: query.data?.meta ?? { current_page: 1, last_page: 1, per_page: perPage, total: 0 },
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
}

export function useFieldOperatorDetail(id, enabled = true) {
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  return useQuery({
    queryKey: ['field-operators', 'detail', tenantId ?? 'unknown', id],
    queryFn: () => fieldOperatorAdminService.getById(id),
    enabled: Boolean(tenantId) && Boolean(id) && enabled,
  });
}

export function useFieldOperatorMutations() {
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : 'unknown';
  const queryClient = useQueryClient();

  const invalidate = async (id) => {
    await queryClient.invalidateQueries({ queryKey: ['field-operators', 'list', tenantId] });
    if (id != null) {
      await queryClient.invalidateQueries({ queryKey: ['field-operators', 'detail', tenantId, id] });
    }
    await queryClient.invalidateQueries({ queryKey: ['field-operators', 'options', tenantId] });
  };

  const createMutation = useMutation({
    mutationFn: (payload) => fieldOperatorAdminService.create(payload),
    onSuccess: () => invalidate(),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => fieldOperatorAdminService.update(id, payload),
    onSuccess: (_, variables) => invalidate(variables.id),
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => fieldOperatorAdminService.delete(id),
    onSuccess: (_, id) => invalidate(id),
  });

  return {
    createFieldOperator: createMutation.mutateAsync,
    updateFieldOperator: updateMutation.mutateAsync,
    deleteFieldOperator: deleteMutation.mutateAsync,
    isSaving: createMutation.isPending || updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
