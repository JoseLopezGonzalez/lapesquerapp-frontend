"use client";

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import toast from 'react-hot-toast';
import { getToastTheme } from '@/customs/reactHotToast';
import { isAuthError, isAuthStatusCode, buildLoginUrl, AUTH_ERROR_CONFIG } from '@/configs/authConfig';


export default function AuthErrorInterceptor() {
  useEffect(() => {
    // ✅ Flag para prevenir múltiples ejecuciones simultáneas
    let isRedirecting = false;
    
    // Interceptar errores de fetch para detectar errores de autenticación
    const originalFetch = window.fetch;
    
    const handleAuthError = () => {
      // Prevenir múltiples ejecuciones
      if (isRedirecting) {
        return;
      }
      
      // Si ya estamos en la página de login, no hacer nada
      if (window.location.pathname === '/') {
        return;
      }
      
      isRedirecting = true;
      
      // Mostrar notificación al usuario (solo una vez)
      toast.error('Sesión expirada. Redirigiendo al login...', getToastTheme());
      
      // Cerrar sesión y redirigir después de un breve delay
      setTimeout(async () => {
        try {
          await signOut({ redirect: false });
        } catch (err) {
          console.error('Error en signOut desde interceptor:', err);
        }
        const currentPath = window.location.pathname;
        const loginUrl = buildLoginUrl(currentPath);
        window.location.href = loginUrl;
      }, AUTH_ERROR_CONFIG.REDIRECT_DELAY);
    };
    
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
        
        // Si es una llamada a logout, no interceptar
        if (isLogoutRequest) {
          return await originalFetch(...args);
        }
        
        const response = await originalFetch(...args);
        
        // Si es un error de autenticación, manejar la redirección
        if (isAuthStatusCode(response.status)) {
          handleAuthError();
          return response;
        }
        
        return response;
      } catch (error) {
        // Si el error contiene información de autenticación
        if (isAuthError(error)) {
          handleAuthError();
        }
        
        throw error;
      }
    };

    // Interceptar errores globales de JavaScript
    const handleGlobalError = (event) => {
      const error = event.error || event.reason;
      
      if (isAuthError(error)) {
        handleAuthError();
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
