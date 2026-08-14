'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { maquilaOrderKeys } from '@/lib/routes/queryKeys';
import { maquilaOrderService } from '@/services/domain/orders/maquilaOrderService';
import { notify } from '@/lib/notifications';
import { ApiError, getErrorMessage } from '@/lib/api/apiHelpers';
import type { MaquilaOrderPayload } from '@/types/maquilaOrder';

/** El formulario maneja el 422 inline (setErrorsFrom422 vía try/catch en mutateAsync) —
 * aquí solo se notifica lo que no sea un error de validación de campo. */
function notifyUnlessValidation(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 422) return;
    notify.error(getErrorMessage(error.data));
    return;
  }
  notify.error(error instanceof Error ? error.message : 'Error inesperado');
}

export function useMaquilaOrderCreate() {
  const queryClient = useQueryClient();
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  return useMutation({
    mutationFn: (payload: MaquilaOrderPayload) => maquilaOrderService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: maquilaOrderKeys.listPrefix(tenantId) });
      notify.success('Pedido creado correctamente');
    },
    onError: notifyUnlessValidation,
  });
}

export function useMaquilaOrderUpdate(orderId: number | string) {
  const queryClient = useQueryClient();
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  return useMutation({
    mutationFn: (payload: MaquilaOrderPayload) => maquilaOrderService.update(orderId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: maquilaOrderKeys.listPrefix(tenantId) });
      queryClient.invalidateQueries({ queryKey: maquilaOrderKeys.detail(tenantId, orderId) });
      notify.success('Pedido actualizado correctamente');
    },
    onError: notifyUnlessValidation,
  });
}
