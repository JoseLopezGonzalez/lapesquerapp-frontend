'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { tollClientAdminKeys } from '@/lib/routes/queryKeys';
import { tollClientService } from '@/services/domain/toll-clients/tollClientService';
import { notify } from '@/lib/notifications';
import { ApiError, getErrorMessage } from '@/lib/api/apiHelpers';

function notifyMutationError(err: unknown) {
  if (err instanceof ApiError) {
    notify.error(getErrorMessage(err.data));
    return;
  }
  notify.error(err instanceof Error ? err.message : 'Error inesperado');
}

/** Detalle + subida/borrado de branding de un TollClient — solo staff (Admin → Clientes de maquila). */
export function useTollClientBrandingAdmin(id: number | string) {
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const queryClient = useQueryClient();
  const queryKey = tollClientAdminKeys.detail(tenantId, id);

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => tollClientService.getById(id),
    enabled: !!tenantId,
    staleTime: 60 * 1000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const uploadLoginBanner = useMutation({
    mutationFn: (file: File) => tollClientService.uploadLoginBanner(id, file),
    onSuccess: () => {
      invalidate();
      notify.success('Banner de login actualizado');
    },
    onError: notifyMutationError,
  });

  const deleteLoginBanner = useMutation({
    mutationFn: () => tollClientService.deleteLoginBanner(id),
    onSuccess: () => {
      invalidate();
      notify.success('Banner de login eliminado');
    },
    onError: notifyMutationError,
  });

  const uploadLogo = useMutation({
    mutationFn: (file: File) => tollClientService.uploadLogo(id, file),
    onSuccess: () => {
      invalidate();
      notify.success('Logo actualizado');
    },
    onError: notifyMutationError,
  });

  const deleteLogo = useMutation({
    mutationFn: () => tollClientService.deleteLogo(id),
    onSuccess: () => {
      invalidate();
      notify.success('Logo eliminado');
    },
    onError: notifyMutationError,
  });

  return {
    tollClient: data ?? null,
    isLoading,
    error: error?.message ?? null,
    uploadLoginBanner,
    deleteLoginBanner,
    uploadLogo,
    deleteLogo,
  };
}
