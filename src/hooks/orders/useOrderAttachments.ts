'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { orderAttachmentKeys } from '@/lib/routes/queryKeys';
import {
  orderAttachmentService,
  invalidateBlobUrlCache,
  invalidateThumbnailCache,
  type OrderAttachment,
  type OrderAttachmentCollection,
  ApiError,
  getErrorMessage,
} from '@/services/domain/orders/orderAttachmentService';
import { notify } from '@/lib/notifications';

export function useOrderAttachments(
  orderId: number | string | null | undefined,
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const queryClient = useQueryClient();

  const isValid = !!orderId;
  const listKey = orderAttachmentKeys.list(tenantId, orderId);
  const prefixKey = orderAttachmentKeys.listPrefix(tenantId, orderId);

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: listKey,
    queryFn: () => orderAttachmentService.list(orderId!),
    enabled: !!tenantId && isValid && enabled,
    staleTime: 2 * 60 * 1000,
  });

  const attachments: OrderAttachment[] = response?.data ?? [];
  const total: number = response?.meta?.total ?? 0;

  const uploadMutation = useMutation({
    mutationFn: ({
      file,
      collection,
      notes,
    }: {
      file: File;
      collection: OrderAttachmentCollection;
      notes?: string;
    }) => orderAttachmentService.upload(orderId!, file, collection, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: prefixKey });
      notify.success('Adjunto subido correctamente');
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof ApiError
          ? getErrorMessage(err.data ?? { message: err.message })
          : err instanceof Error
            ? err.message
            : 'Error desconocido';
      notify.error({ title: 'Error al subir el adjunto', description: msg });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      attachmentId,
      notes,
    }: {
      attachmentId: number;
      notes: string | null;
    }) => orderAttachmentService.update(orderId!, attachmentId, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: prefixKey });
      notify.success('Notas actualizadas');
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof ApiError
          ? getErrorMessage(err.data ?? { message: err.message })
          : 'Error al actualizar las notas';
      notify.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (attachmentId: number) =>
      orderAttachmentService.delete(orderId!, attachmentId),
    onSuccess: (_data, attachmentId) => {
      invalidateBlobUrlCache(orderId!, attachmentId);
      invalidateThumbnailCache(orderId!, attachmentId);
      queryClient.invalidateQueries({ queryKey: prefixKey });
      notify.success('Adjunto eliminado');
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof ApiError
          ? getErrorMessage(err.data ?? { message: err.message })
          : 'Error al eliminar el adjunto';
      notify.error(msg);
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: async (attachmentsToDelete: OrderAttachment[]) => {
      for (const att of attachmentsToDelete) {
        await orderAttachmentService.delete(orderId!, att.id);
        invalidateBlobUrlCache(orderId!, att.id);
        invalidateThumbnailCache(orderId!, att.id);
      }
    },
    onSuccess: (_data, attachmentsToDelete) => {
      queryClient.invalidateQueries({ queryKey: prefixKey });
      notify.success(
        attachmentsToDelete.length === 1
          ? 'Adjunto eliminado'
          : `${attachmentsToDelete.length} adjuntos eliminados`
      );
    },
    onError: (err: unknown) => {
      queryClient.invalidateQueries({ queryKey: prefixKey });
      const msg =
        err instanceof ApiError
          ? getErrorMessage(err.data ?? { message: (err as Error).message })
          : 'Error al eliminar los adjuntos';
      notify.error(msg);
    },
  });

  const downloadAttachment = async (attachment: OrderAttachment) => {
    try {
      await orderAttachmentService.download(orderId!, attachment);
    } catch (err: unknown) {
      const msg =
        err instanceof ApiError
          ? getErrorMessage(err.data ?? { message: (err as Error).message })
          : 'Error al descargar el archivo';
      notify.error(msg);
    }
  };

  return {
    attachments,
    total,
    isLoading,
    error: error?.message ?? null,
    refetch,
    uploadMutation,
    updateMutation,
    deleteMutation,
    deleteAllMutation,
    downloadAttachment,
  };
}
