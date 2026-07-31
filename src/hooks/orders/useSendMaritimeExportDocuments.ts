'use client';

import { useMutation } from '@tanstack/react-query';
import { orderDocumentService } from '@/services/domain/orders/orderDocumentService';
import type { SendMaritimeExportDocumentsPayload } from '@/types/orders';

/**
 * No invalida ninguna query: el envío no cambia datos cacheados del pedido.
 * El componente decide cómo mostrar éxito/error (notify.promise + setErrorsFrom422
 * para 422 por campo), igual que el resto de formularios del proyecto.
 */
export function useSendMaritimeExportDocuments(orderId: number | string | null | undefined) {
  return useMutation({
    mutationFn: (payload: SendMaritimeExportDocumentsPayload) =>
      orderDocumentService.sendMaritimeExportDocuments(orderId!, payload),
  });
}
