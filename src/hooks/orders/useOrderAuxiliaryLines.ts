'use client';

import { useMemo, useCallback } from 'react';
import {
  createOrderAuxiliaryLine,
  deleteOrderAuxiliaryLine,
  updateOrderAuxiliaryLine,
} from '@/services/orderService';
import type { Order, AuxiliaryOrderLine, AuxiliaryOrderLinePayload } from '@/services/orderService';

export interface OrderSelectOption {
  value: number | string;
  label: string | number;
}

interface UseOrderAuxiliaryLinesParams {
  order: Order | null;
  onOrderUpdate: (updatedOrder: Order) => void;
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
  onOrderUpdate,
  onError,
}: UseOrderAuxiliaryLinesParams): UseOrderAuxiliaryLinesResult {
  const auxiliaryLines = useMemo(
    () => (order?.auxiliaryLines ? [...order.auxiliaryLines] : []),
    [order?.auxiliaryLines]
  );

  const updateAuxiliaryLine = useCallback(
    async (id: number | string, updateData: AuxiliaryOrderLinePayload) => {
      if (!order) return;
      return updateOrderAuxiliaryLine(String(order.id), String(id), updateData)
        .then((updated) => {
          const updatedLines = (order.auxiliaryLines ?? []).map((line) =>
            line.id === updated.id ? updated : line
          );
          onOrderUpdate({ ...order, auxiliaryLines: updatedLines });
        })
        .catch((err: unknown) => {
          onError?.(err);
          throw err;
        });
    },
    [order, onOrderUpdate, onError]
  );

  const deleteAuxiliaryLine = useCallback(
    async (id: number | string) => {
      if (!order) return;
      return deleteOrderAuxiliaryLine(String(order.id), String(id))
        .then(() => {
          const filteredLines = (order.auxiliaryLines ?? []).filter((line) => line.id !== id);
          onOrderUpdate({ ...order, auxiliaryLines: filteredLines });
        })
        .catch((err: unknown) => {
          onError?.(err);
          throw err;
        });
    },
    [order, onOrderUpdate, onError]
  );

  const createAuxiliaryLine = useCallback(
    async (lineData: AuxiliaryOrderLinePayload) => {
      if (!order) return;
      return createOrderAuxiliaryLine(String(order.id), lineData)
        .then((created) => {
          const newLines = [...(order.auxiliaryLines ?? []), created];
          onOrderUpdate({ ...order, auxiliaryLines: newLines });
        })
        .catch((err: unknown) => {
          onError?.(err);
          throw err;
        });
    },
    [order, onOrderUpdate, onError]
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
