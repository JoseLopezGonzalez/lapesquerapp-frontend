'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { palletAttachmentKeys } from '@/lib/routes/queryKeys';
import {
  buildPalletImageUploadFilename,
  palletAttachmentService,
  type PalletAttachment,
} from '@/services/domain/pallets/palletAttachmentService';
import { notify } from '@/lib/notifications';
import { ApiError, getErrorMessage } from '@/lib/api/apiHelpers';

/** Temporal: más detalle en toast para depurar subida de imágenes en móvil sin consola. */
function formatAttachmentErrorToast(
  err: unknown,
  action: string,
  file?: File,
  palletId?: number | string | null
): { title: string; description: string } {
  const lines: string[] = [];

  if (file) {
    lines.push(`Nombre dispositivo: ${file.name || '(sin nombre)'}`);
    if (palletId != null) {
      lines.push(`Nombre enviado: ${buildPalletImageUploadFilename(file, palletId)}`);
    }
    lines.push(`Tipo: ${file.type || '(vacío)'}`);
    lines.push(`Tamaño: ${file.size} bytes (${(file.size / (1024 * 1024)).toFixed(2)} MB)`);
  }

  if (err instanceof ApiError) {
    lines.push(getErrorMessage(err.data ?? { message: err.message }));
    lines.push(`HTTP ${err.status}`);
    const data = err.data as Record<string, unknown> | null;
    if (data?.errors && typeof data.errors === 'object') {
      Object.entries(data.errors as Record<string, string[]>).forEach(([field, messages]) => {
        (messages ?? []).forEach((msg) => lines.push(`${field}: ${msg}`));
      });
    }
    if (data) {
      try {
        const raw = JSON.stringify(data);
        lines.push(raw.length <= 500 ? raw : `${raw.slice(0, 500)}…`);
      } catch {
        lines.push('(respuesta no serializable)');
      }
    }
  } else if (err instanceof Error) {
    lines.push(err.message);
    if (err.name && err.name !== 'Error') lines.push(`Tipo error: ${err.name}`);
  } else if (err != null) {
    lines.push(String(err));
  }

  return {
    title: `Error al ${action}`,
    description: lines.filter(Boolean).join('\n'),
  };
}

function notifyAttachmentError(
  err: unknown,
  action: string,
  file?: File,
  palletId?: number | string | null
): void {
  const { title, description } = formatAttachmentErrorToast(err, action, file, palletId);
  notify.error(
    { title, description },
    { duration: 14_000, important: true }
  );
}

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Temporal: avisa si el archivo se rechaza antes de subir (p. ej. HEIC desde cámara). */
export function notifyIfInvalidPalletImageFile(file: File): boolean {
  if (ACCEPTED_IMAGE_TYPES.includes(file.type)) return true;

  notify.error(
    {
      title: 'Imagen no aceptada',
      description: [
        `Tipo: ${file.type || '(vacío)'}`,
        `Nombre: ${file.name || '(sin nombre)'}`,
        `Tamaño: ${file.size} bytes`,
        `Aceptados: ${ACCEPTED_IMAGE_TYPES.join(', ')}`,
      ].join('\n'),
    },
    { duration: 14_000, important: true }
  );
  return false;
}

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
    onError: (err: unknown, variables) => {
      notifyAttachmentError(err, 'subir la imagen', variables?.file, palletId);
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
      notifyAttachmentError(err, 'actualizar la nota', undefined, palletId);
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
      notifyAttachmentError(err, 'eliminar la imagen', undefined, palletId);
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
