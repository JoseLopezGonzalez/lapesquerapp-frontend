'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { orderMaritimeContainerKeys, orderKeys } from '@/lib/routes/queryKeys';
import {
  orderMaritimeContainerService,
  ApiError,
  getErrorMessage,
} from '@/services/domain/orders/orderMaritimeContainerService';
import type {
  MaritimeContainer,
  MaritimeContainerCreatePayload,
  MaritimeContainerUpdatePayload,
} from '@/types/orders';
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

  // Invalida solo el detalle del pedido (embebe maritimeContainers para otras vistas). La propia
  // lista se actualiza con setQueryData a partir de la respuesta del backend, sin esperar a un
  // refetch en segundo plano — así el elemento afectado aparece/desaparece/cambia al instante,
  // no tras el hueco del round-trip de invalidateQueries.
  const invalidateOrderDetail = () => {
    queryClient.invalidateQueries({ queryKey: orderKeys.detail(tenantId, orderId) });
  };

  const getErrMsg = (err: unknown, fallback: string) =>
    err instanceof ApiError ? getErrorMessage(err.data ?? { message: err.message }) : fallback;

  const createMutation = useMutation({
    mutationFn: (payload: MaritimeContainerCreatePayload) =>
      orderMaritimeContainerService.create(orderId!, payload),
    onSuccess: (newContainer) => {
      queryClient.setQueryData<MaritimeContainer[]>(listKey, (old) => [...(old ?? []), newContainer]);
      invalidateOrderDetail();
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
    onSuccess: (updatedContainer) => {
      queryClient.setQueryData<MaritimeContainer[]>(listKey, (old) =>
        (old ?? []).map((container) =>
          container.id === updatedContainer.id ? updatedContainer : container
        )
      );
      invalidateOrderDetail();
      notify.success('Contenedor actualizado correctamente');
    },
    onError: (err: unknown) => notify.error(getErrMsg(err, 'Error al actualizar el contenedor')),
  });

  const deleteMutation = useMutation({
    mutationFn: (containerId: number | string) =>
      orderMaritimeContainerService.delete(orderId!, containerId),
    onSuccess: (_data, containerId) => {
      queryClient.setQueryData<MaritimeContainer[]>(listKey, (old) =>
        (old ?? []).filter((container) => container.id !== containerId)
      );
      invalidateOrderDetail();
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
