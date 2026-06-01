'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { notify } from '@/lib/notifications';
import { clearAuthTokenCache } from '@/lib/auth/getAuthToken';
import {
  isAuthError,
  isUnauthorizedStatusCode,
  buildLoginUrl,
  AUTH_ERROR_CONFIG,
  type AuthErrorLike,
} from '@/configs/authConfig';

const { AUTH_SESSION_EXPIRED_EVENT } = AUTH_ERROR_CONFIG;

export default function AuthErrorInterceptor() {
  useEffect(() => {
    let isRedirecting = false;
    const originalFetch = window.fetch;
    const disabledExternalUserPattern = /acceso externo.*desactivad/i;

    const handleAuthError = (customMessage?: string) => {
      if (isRedirecting) return;
      const pathname = window.location.pathname;
      const alreadyOnLogin = pathname === '/' || pathname === '/auth/verify';
      isRedirecting = true;
      const clearSession = async () => {
        // Limpiar caché del token antes de signOut para evitar que peticiones
        // en vuelo durante los 1500ms de delay usen el token stale y generen
        // más eventos auth:session-expired.
        clearAuthTokenCache();
        try {
          await signOut({ redirect: false });
        } catch (err) {
          console.error('Error en signOut desde interceptor:', err);
        }
      };
      if (alreadyOnLogin) {
        clearSession();
        return;
      }
      notify.error({
        title: customMessage ? 'Acceso bloqueado' : 'Sesión expirada',
        description: customMessage || 'Tu sesión ha expirado. Redirigiendo al login...',
      });
      setTimeout(async () => {
        await clearSession();
        window.location.href = buildLoginUrl(window.location.pathname);
      }, AUTH_ERROR_CONFIG.REDIRECT_DELAY);
    };

    window.fetch = async (...args: Parameters<typeof fetch>) => {
      try {
        let url = '';
        const first = args[0];
        if (typeof first === 'string') url = first;
        else if (first && typeof first === 'object' && 'url' in first) url = (first as Request).url;
        else if (first instanceof URL) url = first.href;
        if (url.includes('/logout')) return await originalFetch(...args);
        const response = await originalFetch(...args);
        if (response.status === 403) {
          const responseClone = response.clone();
          const contentType = response.headers.get('content-type');
          const isJson = contentType?.includes('application/json');
          if (isJson) {
            const errorData = (await responseClone.json().catch(() => ({}))) as {
              message?: string;
              userMessage?: string;
            };
            const userMessage = errorData.userMessage || errorData.message || '';
            if (disabledExternalUserPattern.test(userMessage)) {
              handleAuthError(userMessage);
            }
          }
          return response;
        }
        // Solo 401 → signOut + redirect. 403 = sin permiso para la acción; no redirigir (evitar bucle login → misma ruta → 403 → login).
        if (isUnauthorizedStatusCode(response.status)) {
          const responseClone = response.clone();
          try {
            const contentType = response.headers.get('content-type');
            const isJson = contentType?.includes('application/json');
            if (isJson) {
              const errorData = (await responseClone.json().catch(() => ({}))) as {
                message?: string;
                userMessage?: string;
              };
              const errorMessage = (errorData.message || errorData.userMessage || '').toLowerCase();
              const isValidationError =
                /validation|validación|invalid|inválido|required|requerido|error al crear|error al registrar|requieren autenticación|require authentication|fichajes manuales/.test(
                  errorMessage
                );
              if (!isValidationError) {
                const isSessionExpired =
                  /token|sesión expirada|session expired|unauthorized|no autenticado|invalid token|token expired/.test(
                    errorMessage
                  ) || errorMessage === '';
                if (isSessionExpired) handleAuthError();
              }
            } else handleAuthError();
          } catch {
            handleAuthError();
          }
          return response;
        }
        return response;
      } catch (error: unknown) {
        if (isAuthError(error as AuthErrorLike | null)) handleAuthError();
        throw error;
      }
    };

    const handleGlobalError = (event: ErrorEvent) => {
      const err = event.error ?? (event as unknown as { reason?: unknown }).reason;
      if (isAuthError(err as AuthErrorLike | null)) handleAuthError();
    };
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isAuthError(event.reason as AuthErrorLike | null)) {
        event.preventDefault();
        handleAuthError();
      }
    };

    // Usar referencia estable para poder eliminar el listener correctamente.
    // Sin esto, removeEventListener recibe una función anónima distinta a la
    // registrada y el listener nunca se elimina, acumulándose en cada montaje.
    const handleSessionExpiredEvent = () => handleAuthError();

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpiredEvent);
    return () => {
      window.fetch = originalFetch;
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpiredEvent);
    };
  }, []);
  return null;
}
