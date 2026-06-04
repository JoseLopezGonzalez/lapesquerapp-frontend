'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { palletAttachmentKeys } from '@/lib/routes/queryKeys';
import {
  palletAttachmentService,
  type PalletAttachment,
} from '@/services/domain/pallets/palletAttachmentService';
import { notify } from '@/lib/notifications';
import { getErrorMessage } from '@/lib/api/apiHelpers';

function isRealPalletId(id: number | string | null | undefined): boolean {
  if (!id) return false;
  const str = String(id);
  return str !== 'new' && !str.startsWith('temp-');
}

export function usePalletAttachments(
  palletId: number | string | null | undefined,
  options: { perPage?: number; enabled?: boolean } = {}
) {
  const { perPage = 20, enabled = true } = options;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const isValid = isRealPalletId(palletId);
  const queryClient = useQueryClient();

  const listKey = palletAttachmentKeys.list(tenantId, palletId, { per_page: perPage });
  const prefixKey = palletAttachmentKeys.listPrefix(tenantId, palletId);

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: listKey,
    queryFn: () => palletAttachmentService.list(palletId!, { perPage }),
    enabled: !!tenantId && isValid && enabled,
    staleTime: 2 * 60 * 1000,
  });

  const attachments: PalletAttachment[] = response?.data ?? [];
  const total: number = response?.meta?.total ?? 0;

  const uploadMutation = useMutation({
    mutationFn: ({ file, notes }: { file: File; notes?: string }) =>
      palletAttachmentService.upload(palletId!, file, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: prefixKey });
      notify.success('Imagen subida correctamente');
    },
    onError: (err: unknown) => {
      notify.error(getErrorMessage(err as object) || 'Error al subir la imagen');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      attachmentId,
      notes,
    }: {
      attachmentId: number;
      notes: string | null;
    }) => palletAttachmentService.update(palletId!, attachmentId, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: prefixKey });
      notify.success('Nota actualizada');
    },
    onError: (err: unknown) => {
      notify.error(getErrorMessage(err as object) || 'Error al actualizar la nota');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (attachmentId: number) =>
      palletAttachmentService.delete(palletId!, attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: prefixKey });
      notify.success('Imagen eliminada');
    },
    onError: (err: unknown) => {
      notify.error(getErrorMessage(err as object) || 'Error al eliminar la imagen');
    },
  });

  return {
    attachments,
    total,
    isLoading,
    error: error?.message ?? null,
    refetch,
    uploadMutation,
    updateMutation,
    deleteMutation,
  };
}
