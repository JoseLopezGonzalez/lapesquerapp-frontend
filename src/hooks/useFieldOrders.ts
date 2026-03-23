'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { fieldCustomerOptionKeys, fieldOrderKeys, fieldRouteKeys } from '@/lib/routes/queryKeys';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { createFieldAutoventa, getFieldOrder, getFieldOrders, updateFieldOrder } from '@/services/fieldOperatorService';
import { useFieldOperator } from '@/context/FieldOperatorContext';

type FieldParams = Record<string, string | number | boolean | null | undefined>;
type FieldMutationPayload = Record<string, unknown>;
type FieldQueryOptions = { enabled?: boolean };

function useFieldBase() {
  const { data: session } = useSession();
  const { fieldOperatorId } = useFieldOperator();
  const token = session?.user?.accessToken;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  return { token, tenantId, fieldOperatorId };
}

export function useFieldOrders(params: FieldParams = {}, options: FieldQueryOptions = {}) {
  const { token, tenantId, fieldOperatorId } = useFieldBase();
  const { enabled = true } = options;
  const query = useQuery({
    queryKey: fieldOrderKeys.list(tenantId, fieldOperatorId, params),
    queryFn: () => getFieldOrders(token as string, params),
    enabled: Boolean(token) && Boolean(tenantId) && Boolean(fieldOperatorId) && enabled,
    select: (data) => ({
      items: Array.isArray(data?.data) ? data.data : [],
      meta: data?.meta ?? null,
      links: data?.links ?? null,
    }),
  });

  return {
    ...query,
    errorMessage: query.error instanceof Error ? query.error.message : null,
  };
}

export function useFieldOrder(orderId: number | string | null | undefined) {
  const { token, tenantId, fieldOperatorId } = useFieldBase();
  const query = useQuery({
    queryKey: fieldOrderKeys.detail(tenantId, fieldOperatorId, orderId),
    queryFn: () => getFieldOrder(token as string, orderId as number | string),
    enabled: Boolean(token) && Boolean(tenantId) && Boolean(fieldOperatorId) && Boolean(orderId),
    select: (data) => data?.data ?? data,
  });

  return {
    ...query,
    errorMessage: query.error instanceof Error ? query.error.message : null,
  };
}

export function useFieldOrderMutations() {
  const { token, tenantId, fieldOperatorId } = useFieldBase();
  const queryClient = useQueryClient();

  const updateMutation = useMutation<unknown, Error, { orderId: number | string; payload: FieldMutationPayload }>({
    mutationFn: ({ orderId, payload }) => updateFieldOrder(token as string, orderId, payload),
    onSuccess: (response, variables) => {
      const updatedOrder = (response as { data?: unknown } | undefined)?.data ?? response;
      queryClient.setQueryData(fieldOrderKeys.detail(tenantId, fieldOperatorId, variables.orderId), updatedOrder);
      queryClient.invalidateQueries({ queryKey: fieldOrderKeys.list(tenantId, fieldOperatorId) });
      queryClient.invalidateQueries({ queryKey: fieldRouteKeys.list(tenantId, fieldOperatorId) });
    },
  });

  const autoventaMutation = useMutation<unknown, Error, FieldMutationPayload>({
    mutationFn: (payload) => createFieldAutoventa(token as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fieldOrderKeys.list(tenantId, fieldOperatorId) });
      queryClient.invalidateQueries({ queryKey: fieldRouteKeys.list(tenantId, fieldOperatorId) });
      queryClient.invalidateQueries({ queryKey: fieldCustomerOptionKeys.list(tenantId) });
    },
  });

  return {
    updateOrder: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending || !fieldOperatorId,
    createAutoventa: autoventaMutation.mutateAsync,
    isCreatingAutoventa: autoventaMutation.isPending || !fieldOperatorId,
  };
}
