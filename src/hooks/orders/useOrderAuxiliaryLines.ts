'use client';

import { useMemo, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createOrderAuxiliaryLine,
  deleteOrderAuxiliaryLine,
  updateOrderAuxiliaryLine,
} from '@/services/orderService';
import type { Order, AuxiliaryOrderLine, AuxiliaryOrderLinePayload } from '@/services/orderService';
import { orderKeys } from '@/lib/routes/queryKeys';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';

export interface OrderSelectOption {
  value: number | string;
  label: string | number;
}

interface UseOrderAuxiliaryLinesParams {
  order: Order | null;
  onError?: (err: unknown) => void;
}

export interface UseOrderAuxiliaryLinesResult {
  auxiliaryLines: AuxiliaryOrderLine[];
  auxiliaryLineActions: {
    update: (id: number | string, updateData: AuxiliaryOrderLinePayload) => Promise<void>;
    delete: (id: number | string) => Promise<void>;
    create: (lineData: AuxiliaryOrderLinePayload) => Promise<void>;
  };
}

export function useOrderAuxiliaryLines({
  order,
  onError,
}: UseOrderAuxiliaryLinesParams): UseOrderAuxiliaryLinesResult {
  const queryClient = useQueryClient();
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const orderId = order?.id;
  const orderDetailKey = useMemo(() => orderKeys.detail(tenantId, orderId), [tenantId, orderId]);

  const auxiliaryLines = useMemo(
    () => (order?.auxiliaryLines ? [...order.auxiliaryLines] : []),
    [order?.auxiliaryLines]
  );

  const invalidateOrderDetail = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey: orderDetailKey });
  }, [queryClient, orderDetailKey]);

  const { mutateAsync: updateLine } = useMutation({
    mutationFn: ({
      id,
      updateData,
    }: {
      id: number | string;
      updateData: AuxiliaryOrderLinePayload;
    }) => updateOrderAuxiliaryLine(String(orderId), String(id), updateData),
    onSuccess: invalidateOrderDetail,
    onError: (err: unknown) => {
      onError?.(err);
    },
  });

  const { mutateAsync: deleteLine } = useMutation({
    mutationFn: (id: number | string) => deleteOrderAuxiliaryLine(String(orderId), String(id)),
    onSuccess: invalidateOrderDetail,
    onError: (err: unknown) => {
      onError?.(err);
    },
  });

  const { mutateAsync: createLine } = useMutation({
    mutationFn: (lineData: AuxiliaryOrderLinePayload) =>
      createOrderAuxiliaryLine(String(orderId), lineData),
    onSuccess: invalidateOrderDetail,
    onError: (err: unknown) => {
      onError?.(err);
    },
  });

  const updateAuxiliaryLine = useCallback(
    async (id: number | string, updateData: AuxiliaryOrderLinePayload) => {
      if (!orderId) return;
      await updateLine({ id, updateData });
    },
    [orderId, updateLine]
  );

  const deleteAuxiliaryLine = useCallback(
    async (id: number | string) => {
      if (!orderId) return;
      await deleteLine(id);
    },
    [orderId, deleteLine]
  );

  const createAuxiliaryLine = useCallback(
    async (lineData: AuxiliaryOrderLinePayload) => {
      if (!orderId) return;
      await createLine(lineData);
    },
    [orderId, createLine]
  );

  return {
    auxiliaryLines,
    auxiliaryLineActions: {
      update: updateAuxiliaryLine,
      delete: deleteAuxiliaryLine,
      create: createAuxiliaryLine,
    },
  };
}
