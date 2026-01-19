"use client";

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import toast from 'react-hot-toast';
import { getToastTheme } from '@/customs/reactHotToast';
import { isAuthError, isAuthStatusCode, buildLoginUrl, AUTH_ERROR_CONFIG } from '@/configs/authConfig';

// Constante para marcar que se está ejecutando un logout intencional
const LOGOUT_FLAG_KEY = '__is_logging_out__';

export default function AuthErrorInterceptor() {
  useEffect(() => {
    // Interceptar errores de fetch para detectar errores de autenticación
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      try {
        // Extraer URL de diferentes formatos posibles
        let url = '';
        if (typeof args[0] === 'string') {
          url = args[0];
        } else if (args[0]?.url) {
          url = args[0].url;
        } else if (args[0] instanceof URL) {
          url = args[0].href;
        }
        
        const isLogoutRequest = url.includes('/logout');
        const isLoggingOut = typeof sessionStorage !== 'undefined' && sessionStorage.getItem(LOGOUT_FLAG_KEY) === 'true';
        
        // Si es una llamada a logout o ya se está ejecutando un logout, no interceptar
        if (isLogoutRequest || isLoggingOut) {
          return await originalFetch(...args);
        }
        
        const response = await originalFetch(...args);
        
        // Si ya se está ejecutando un logout (puede haberse marcado durante la llamada), no interceptar errores
        if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(LOGOUT_FLAG_KEY) === 'true') {
          return response;
        }
        
        // Si es un error de autenticación, manejar la redirección
        if (isAuthStatusCode(response.status)) {
          // console.log('🔐 [AuthErrorInterceptor] Error de autenticación detectado, redirigiendo al login');
          
          // Mostrar notificación al usuario
          toast.error('Sesión expirada. Redirigiendo al login...', getToastTheme());
          
          // Marcar que se está ejecutando un logout
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem(LOGOUT_FLAG_KEY, 'true');
          }
          
          // Cerrar sesión y redirigir después de un breve delay
          setTimeout(async () => {
            try {
              await signOut({ redirect: false });
            } catch (err) {
              console.error('Error en signOut desde interceptor:', err);
            }
            // ❌ NO limpiar el flag aquí - se limpia en HomePage cuando status === "unauthenticated"
            // El flag debe mantenerse durante la redirección para que LogoutDialog se muestre
            const currentPath = window.location.pathname;
            const loginUrl = buildLoginUrl(currentPath);
            window.location.href = loginUrl;
          }, AUTH_ERROR_CONFIG.REDIRECT_DELAY);
          
          return response;
        }
        
        return response;
      } catch (error) {
        // Si ya se está ejecutando un logout, no interceptar errores
        if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(LOGOUT_FLAG_KEY) === 'true') {
          throw error;
        }
        
        // Si el error contiene información de autenticación
        if (isAuthError(error)) {
          // console.log('🔐 [AuthErrorInterceptor] Error de autenticación detectado en fetch, redirigiendo al login');
          
          // Mostrar notificación al usuario
          toast.error('Sesión expirada. Redirigiendo al login...', getToastTheme());
          
          // Marcar que se está ejecutando un logout
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem(LOGOUT_FLAG_KEY, 'true');
          }
          
          // Cerrar sesión y redirigir después de un breve delay
          setTimeout(async () => {
            try {
              await signOut({ redirect: false });
            } catch (err) {
              console.error('Error en signOut desde interceptor:', err);
            }
            // ❌ NO limpiar el flag aquí - se limpia en HomePage cuando status === "unauthenticated"
            // El flag debe mantenerse durante la redirección para que LogoutDialog se muestre
            const currentPath = window.location.pathname;
            const loginUrl = buildLoginUrl(currentPath);
            window.location.href = loginUrl;
          }, AUTH_ERROR_CONFIG.REDIRECT_DELAY);
        }
        
        throw error;
      }
    };

    // Interceptar errores globales de JavaScript
    const handleGlobalError = (event) => {
      // Si ya se está ejecutando un logout, no interceptar errores
      if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(LOGOUT_FLAG_KEY) === 'true') {
        return;
      }
      
      const error = event.error || event.reason;
      
      if (isAuthError(error)) {
        // console.log('🔐 [AuthErrorInterceptor] Error de autenticación detectado globalmente');
        
        // Mostrar notificación al usuario
        toast.error('Sesión expirada. Redirigiendo al login...', getToastTheme());
        
        // Marcar que se está ejecutando un logout
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem(LOGOUT_FLAG_KEY, 'true');
        }
        
        // Cerrar sesión y redirigir después de un breve delay
        setTimeout(async () => {
          try {
            await signOut({ redirect: false });
          } catch (err) {
            console.error('Error en signOut desde interceptor:', err);
          }
          // ❌ NO limpiar el flag aquí - se limpia en HomePage cuando status === "unauthenticated"
          // El flag debe mantenerse durante la redirección para que LogoutDialog se muestre
          const currentPath = window.location.pathname;
          const loginUrl = buildLoginUrl(currentPath);
          window.location.href = loginUrl;
        }, AUTH_ERROR_CONFIG.REDIRECT_DELAY);
      }
    };

    // Agregar listeners para errores globales
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleGlobalError);

    // Cleanup: restaurar fetch original y remover listeners cuando el componente se desmonte
    return () => {
      window.fetch = originalFetch;
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleGlobalError);
    };
  }, []);

  return null; // Este componente no renderiza nada
}
