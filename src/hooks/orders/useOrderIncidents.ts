'use client';

import { useCallback } from 'react';
import {
  createOrderIncident,
  destroyOrderIncident,
  updateOrderIncident,
} from '@/services/orderService';
import type { Order } from '@/services/orderService';

interface UseOrderIncidentsParams {
  order: Order | null;
  onOrderUpdate: (updatedOrder: Order) => void;
  onError?: (err: unknown) => void;
}

export interface UseOrderIncidentsResult {
  openOrderIncident: (description: string) => Promise<void>;
  resolveOrderIncident: (resolutionType: string, resolutionNotes: string) => Promise<unknown>;
  deleteOrderIncident: () => Promise<void>;
}

export function useOrderIncidents({
  order,
  onOrderUpdate,
  onError,
}: UseOrderIncidentsParams): UseOrderIncidentsResult {
  const openOrderIncident = useCallback(
    async (description: string) => {
      if (!order) return;
      return createOrderIncident(String(order.id), description)
        .then((updated) => {
          if (!order) return;
          onOrderUpdate({ ...order, status: 'incident', incident: updated });
        })
        .catch((err: unknown) => {
          onError?.(err);
          throw err;
        });
    },
    [order, onOrderUpdate, onError]
  );

  const resolveOrderIncident = useCallback(
    async (resolutionType: string, resolutionNotes: string) => {
      if (!order) return;
      return updateOrderIncident(String(order.id), resolutionType, resolutionNotes)
        .then((updatedIncident) => {
          if (!order) return updatedIncident;
          onOrderUpdate({ ...order, incident: updatedIncident });
          return updatedIncident;
        })
        .catch((err: unknown) => {
          onError?.(err);
          throw err;
        });
    },
    [order, onOrderUpdate, onError]
  );

  const deleteOrderIncident = useCallback(async () => {
    if (!order) return;
    return destroyOrderIncident(String(order.id))
      .then(() => {
        if (!order) return;
        onOrderUpdate({ ...order, status: 'finished', incident: null });
      })
      .catch((err: unknown) => {
        onError?.(err);
        throw err;
      });
  }, [order, onOrderUpdate, onError]);

  return { openOrderIncident, resolveOrderIncident, deleteOrderIncident };
}
