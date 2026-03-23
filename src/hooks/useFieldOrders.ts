'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { createFieldAutoventa, getFieldOrder, getFieldOrders, updateFieldOrder } from '@/services/fieldOperatorService';
import { useFieldOperator } from '@/context/FieldOperatorContext';

type FieldParams = Record<string, string | number | boolean | null | undefined>;
type FieldMutationPayload = Record<string, unknown>;

function useFieldBase() {
  const { data: session } = useSession();
  const { fieldOperatorId } = useFieldOperator();
  const token = session?.user?.accessToken;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  return { token, tenantId, fieldOperatorId };
}

export function useFieldOrders(params: FieldParams = {}) {
  const { token, tenantId, fieldOperatorId } = useFieldBase();
  return useQuery({
    queryKey: ['field', 'orders', tenantId ?? 'unknown', params],
    queryFn: () => getFieldOrders(token as string, params),
    enabled: Boolean(token) && Boolean(tenantId) && Boolean(fieldOperatorId),
    select: (data) => ({
      items: Array.isArray(data?.data) ? data.data : [],
      meta: data?.meta ?? null,
      links: data?.links ?? null,
    }),
  });
}

export function useFieldOrder(orderId: number | string | null | undefined) {
  const { token, tenantId, fieldOperatorId } = useFieldBase();
  return useQuery({
    queryKey: ['field', 'orders', 'detail', tenantId ?? 'unknown', orderId],
    queryFn: () => getFieldOrder(token as string, orderId as number | string),
    enabled: Boolean(token) && Boolean(tenantId) && Boolean(fieldOperatorId) && Boolean(orderId),
    select: (data) => data?.data ?? data,
  });
}

export function useFieldOrderMutations() {
  const { token, tenantId, fieldOperatorId } = useFieldBase();
  const queryClient = useQueryClient();

  const updateMutation = useMutation<unknown, Error, { orderId: number | string; payload: FieldMutationPayload }>({
    mutationFn: ({ orderId, payload }) => updateFieldOrder(token as string, orderId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['field', 'orders', tenantId ?? 'unknown'] });
      queryClient.invalidateQueries({ queryKey: ['field', 'orders', 'detail', tenantId ?? 'unknown', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['field', 'routes', tenantId ?? 'unknown'] });
    },
  });

  const autoventaMutation = useMutation<unknown, Error, FieldMutationPayload>({
    mutationFn: (payload) => createFieldAutoventa(token as string, payload),
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
