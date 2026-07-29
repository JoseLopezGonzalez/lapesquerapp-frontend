'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { orderMaritimeShippingDetailKeys, orderKeys } from '@/lib/routes/queryKeys';
import {
  orderMaritimeShippingDetailService,
  ApiError,
  getErrorMessage,
} from '@/services/domain/orders/orderMaritimeShippingDetailService';
import type { MaritimeShippingDetailPayload } from '@/types/orders';
import { notify } from '@/lib/notifications';

export function useOrderMaritimeShippingDetail(
  orderId: number | string | null | undefined,
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const queryClient = useQueryClient();

  const isValid = !!orderId;
  const detailKey = orderMaritimeShippingDetailKeys.detail(tenantId, orderId);

  const {
    data: shippingDetail,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: detailKey,
    queryFn: () => orderMaritimeShippingDetailService.get(orderId!),
    enabled: !!tenantId && isValid && enabled,
    staleTime: 60 * 1000,
  });

  const upsertMutation = useMutation({
    mutationFn: (payload: MaritimeShippingDetailPayload) =>
      orderMaritimeShippingDetailService.upsert(orderId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: detailKey });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(tenantId, orderId) });
      notify.success('Datos de envío marítimo guardados correctamente');
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof ApiError
          ? getErrorMessage(err.data ?? { message: err.message })
          : 'Error al guardar los datos de envío marítimo';
      notify.error(msg);
    },
  });

  return {
    shippingDetail: shippingDetail ?? null,
    isLoading,
    error: error?.message ?? null,
    refetch,
    upsertMutation,
  };
}
