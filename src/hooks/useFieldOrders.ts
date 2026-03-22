'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { createFieldAutoventa, getFieldOrder, getFieldOrders, updateFieldOrder } from '@/services/fieldOperatorService';
import { useFieldOperator } from '@/context/FieldOperatorContext';

function useFieldBase() {
  const { data: session } = useSession();
  const { fieldOperatorId } = useFieldOperator();
  const token = session?.user?.accessToken;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  return { token, tenantId, fieldOperatorId };
}

export function useFieldOrders(params = {}) {
  const { token, tenantId, fieldOperatorId } = useFieldBase();
  return useQuery({
    queryKey: ['field', 'orders', tenantId ?? 'unknown', params],
    queryFn: () => getFieldOrders(token, params),
    enabled: Boolean(token) && Boolean(tenantId) && Boolean(fieldOperatorId),
    select: (data) => ({
      items: Array.isArray(data?.data) ? data.data : [],
      meta: data?.meta ?? null,
      links: data?.links ?? null,
    }),
  });
}

export function useFieldOrder(orderId) {
  const { token, tenantId, fieldOperatorId } = useFieldBase();
  return useQuery({
    queryKey: ['field', 'orders', 'detail', tenantId ?? 'unknown', orderId],
    queryFn: () => getFieldOrder(token, orderId),
    enabled: Boolean(token) && Boolean(tenantId) && Boolean(fieldOperatorId) && Boolean(orderId),
    select: (data) => data?.data ?? data,
  });
}

export function useFieldOrderMutations() {
  const { token, tenantId, fieldOperatorId } = useFieldBase();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: ({ orderId, payload }) => updateFieldOrder(token, orderId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['field', 'orders', tenantId ?? 'unknown'] });
      queryClient.invalidateQueries({ queryKey: ['field', 'orders', 'detail', tenantId ?? 'unknown', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['field', 'routes', tenantId ?? 'unknown'] });
    },
  });

  const autoventaMutation = useMutation({
    mutationFn: (payload) => createFieldAutoventa(token, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field', 'orders', tenantId ?? 'unknown'] });
      queryClient.invalidateQueries({ queryKey: ['field', 'routes', tenantId ?? 'unknown'] });
      queryClient.invalidateQueries({ queryKey: ['field', 'customers', 'options', tenantId ?? 'unknown'] });
    },
  });

  return {
    updateOrder: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending || !fieldOperatorId,
    createAutoventa: autoventaMutation.mutateAsync,
    isCreatingAutoventa: autoventaMutation.isPending || !fieldOperatorId,
  };
}
