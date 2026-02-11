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
      
      const pathname = window.location.pathname;
      const alreadyOnLogin = pathname === '/' || pathname === '/auth/verify';
      
      isRedirecting = true;
      
      // Siempre cerrar sesión en cliente para que useSession() pase a "unauthenticated".
      // Si no hacemos signOut cuando estamos en /, la home sigue viendo "authenticated" y muestra Loader infinito.
      const clearSession = async () => {
        try {
          await signOut({ redirect: false });
        } catch (err) {
          console.error('Error en signOut desde interceptor:', err);
        }
      };
      
      if (alreadyOnLogin) {
        // Ya estamos en login: solo limpiar sesión (evita loader infinito en página de login)
        clearSession();
        return;
      }
      
      // En otras rutas: notificar y redirigir al login
      toast.error('Sesión expirada. Redirigiendo al login...', getToastTheme());
      setTimeout(async () => {
        await clearSession();
        const loginUrl = buildLoginUrl(window.location.pathname);
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
        
        // Si es un error de autenticación, verificar si realmente es un error de sesión expirada
        if (isAuthStatusCode(response.status)) {
          // Clonar la respuesta para poder leer el cuerpo sin consumir el original
          const responseClone = response.clone();
          
          try {
            // Intentar leer el cuerpo de la respuesta para verificar el mensaje de error
            const contentType = response.headers.get('content-type');
            const isJson = contentType && contentType.includes('application/json');
            
            if (isJson) {
              const errorData = await responseClone.json().catch(() => ({}));
              const errorMessage = (errorData.message || errorData.userMessage || '').toLowerCase();
              
              // Verificar si el mensaje indica que es un error de validación del backend
              // (no un error de sesión expirada)
              const isValidationError = errorMessage.includes('validation') ||
                                       errorMessage.includes('validación') ||
                                       errorMessage.includes('invalid') ||
                                       errorMessage.includes('inválido') ||
                                       errorMessage.includes('required') ||
                                       errorMessage.includes('requerido') ||
                                       errorMessage.includes('error al crear') ||
                                       errorMessage.includes('error al registrar') ||
                                       errorMessage.includes('requieren autenticación') ||
                                       errorMessage.includes('require authentication') ||
                                       errorMessage.includes('fichajes manuales');
              
              // Solo cerrar sesión si NO es un error de validación
              // Si es un error de validación, permitir que el componente lo maneje
              if (!isValidationError) {
                // Si no es un error de validación, verificar si indica sesión expirada
                const isSessionExpired = errorMessage.includes('token') ||
                                        errorMessage.includes('sesión expirada') ||
                                        errorMessage.includes('session expired') ||
                                        errorMessage.includes('unauthorized') ||
                                        errorMessage.includes('no autenticado') ||
                                        errorMessage.includes('invalid token') ||
                                        errorMessage.includes('token expired') ||
                                        errorMessage === ''; // Si no hay mensaje, asumir sesión expirada
                
                if (isSessionExpired) {
                  handleAuthError();
                }
                // Si hay un mensaje pero no es de validación ni de sesión expirada,
                // permitir que el componente maneje el error
              }
              // Si es un error de validación, permitir que el componente maneje el error
            } else {
              // Si no es JSON, asumir que es un error de sesión expirada
              handleAuthError();
            }
          } catch (parseError) {
            // Si no se puede parsear, asumir que es un error de sesión expirada
            console.warn('No se pudo parsear la respuesta de error:', parseError);
            handleAuthError();
          }
          
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
