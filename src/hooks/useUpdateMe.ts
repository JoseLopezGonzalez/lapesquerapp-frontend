'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateCurrentUser, type UpdateMePayload } from '@/services/authService';
import { notify } from '@/lib/notifications';
import { getErrorMessage } from '@/lib/api/apiHelpers';
import { ApiError } from '@/lib/api/apiHelpers';
import type { UseFormSetError, FieldValues } from 'react-hook-form';
import { setErrorsFrom422 } from '@/lib/validation/setErrorsFrom422';

export function useUpdateMe(setError?: UseFormSetError<FieldValues>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateMePayload) => updateCurrentUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      notify.success('Perfil actualizado correctamente.');
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.status === 422 && setError) {
        const errorData = error.data as { errors?: Record<string, string[]> };
        if (errorData.errors) {
          setErrorsFrom422(setError, errorData.errors);
          return;
        }
      }
      notify.error(getErrorMessage(error as Record<string, unknown>));
    },
  });
}
