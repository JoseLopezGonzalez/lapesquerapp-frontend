'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { orderMaritimeContainerKeys, orderKeys } from '@/lib/routes/queryKeys';
import {
  orderMaritimeContainerService,
  ApiError,
  getErrorMessage,
} from '@/services/domain/orders/orderMaritimeContainerService';
import type { MaritimeContainerCreatePayload, MaritimeContainerUpdatePayload } from '@/types/orders';
import { notify } from '@/lib/notifications';

export function useOrderMaritimeContainers(
  orderId: number | string | null | undefined,
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const queryClient = useQueryClient();

  const isValid = !!orderId;
  const listKey = orderMaritimeContainerKeys.list(tenantId, orderId);
  const prefixKey = orderMaritimeContainerKeys.listPrefix(tenantId, orderId);

  const {
    data: containers,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: listKey,
    queryFn: () => orderMaritimeContainerService.list(orderId!),
    enabled: !!tenantId && isValid && enabled,
    staleTime: 60 * 1000,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: prefixKey });
    queryClient.invalidateQueries({ queryKey: orderKeys.detail(tenantId, orderId) });
  };

  const getErrMsg = (err: unknown, fallback: string) =>
    err instanceof ApiError ? getErrorMessage(err.data ?? { message: err.message }) : fallback;

  const createMutation = useMutation({
    mutationFn: (payload: MaritimeContainerCreatePayload) =>
      orderMaritimeContainerService.create(orderId!, payload),
    onSuccess: () => {
      invalidateAll();
      notify.success('Contenedor añadido correctamente');
    },
    onError: (err: unknown) => notify.error(getErrMsg(err, 'Error al añadir el contenedor')),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      containerId,
      payload,
    }: {
      containerId: number | string;
      payload: MaritimeContainerUpdatePayload;
    }) => orderMaritimeContainerService.update(orderId!, containerId, payload),
    onSuccess: () => {
      invalidateAll();
      notify.success('Contenedor actualizado correctamente');
    },
    onError: (err: unknown) => notify.error(getErrMsg(err, 'Error al actualizar el contenedor')),
  });

  const deleteMutation = useMutation({
    mutationFn: (containerId: number | string) =>
      orderMaritimeContainerService.delete(orderId!, containerId),
    onSuccess: () => {
      invalidateAll();
      notify.success('Contenedor eliminado correctamente');
    },
    onError: (err: unknown) => notify.error(getErrMsg(err, 'Error al eliminar el contenedor')),
  });

  return {
    containers: containers ?? [],
    isLoading,
    error: error?.message ?? null,
    refetch,
    createMutation,
    updateMutation,
    deleteMutation,
  };
}
