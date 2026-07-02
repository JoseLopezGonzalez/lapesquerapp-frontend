'use client';

import { useCallback, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createOrderIncident,
  destroyOrderIncident,
  updateOrderIncident,
} from '@/services/orderService';
import type { Order } from '@/services/orderService';
import { orderKeys } from '@/lib/routes/queryKeys';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';

interface UseOrderIncidentsParams {
  order: Order | null;
  onError?: (err: unknown) => void;
}

export interface UseOrderIncidentsResult {
  openOrderIncident: (description: string) => Promise<void>;
  resolveOrderIncident: (resolutionType: string, resolutionNotes: string) => Promise<unknown>;
  deleteOrderIncident: () => Promise<void>;
}

export function useOrderIncidents({
  order,
  onError,
}: UseOrderIncidentsParams): UseOrderIncidentsResult {
  const queryClient = useQueryClient();
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const orderId = order?.id;
  const orderDetailKey = useMemo(() => orderKeys.detail(tenantId, orderId), [tenantId, orderId]);

  const invalidateOrderDetail = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey: orderDetailKey });
  }, [queryClient, orderDetailKey]);

  const { mutateAsync: openIncident } = useMutation({
    mutationFn: (description: string) => createOrderIncident(String(orderId), description),
    onSuccess: invalidateOrderDetail,
    onError: (err: unknown) => {
      onError?.(err);
    },
  });

  const { mutateAsync: resolveIncident } = useMutation({
    mutationFn: ({
      resolutionType,
      resolutionNotes,
    }: {
      resolutionType: string;
      resolutionNotes: string;
    }) => updateOrderIncident(String(orderId), resolutionType, resolutionNotes),
    onSuccess: invalidateOrderDetail,
    onError: (err: unknown) => {
      onError?.(err);
    },
  });

  const { mutateAsync: deleteIncident } = useMutation({
    mutationFn: () => destroyOrderIncident(String(orderId)),
    onSuccess: invalidateOrderDetail,
    onError: (err: unknown) => {
      onError?.(err);
    },
  });

  const openOrderIncident = useCallback(
    async (description: string) => {
      if (!orderId) return;
      await openIncident(description);
    },
    [orderId, openIncident]
  );

  const resolveOrderIncident = useCallback(
    async (resolutionType: string, resolutionNotes: string) => {
      if (!orderId) return;
      return resolveIncident({ resolutionType, resolutionNotes });
    },
    [orderId, resolveIncident]
  );

  const deleteOrderIncident = useCallback(async () => {
    if (!orderId) return;
    await deleteIncident();
  }, [orderId, deleteIncident]);

  return { openOrderIncident, resolveOrderIncident, deleteOrderIncident };
}
