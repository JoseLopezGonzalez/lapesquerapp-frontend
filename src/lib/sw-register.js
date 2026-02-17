/**
 * Service Worker Registration
 * 
 * Utilidades para registrar y manejar el Service Worker.
 * Registra el SW en el navegador y maneja actualizaciones.
 */

import { notify } from '@/lib/notifications';

/**
 * Registrar Service Worker
 */
export function registerServiceWorker() {
  if (typeof window === 'undefined') {
    return;
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = '/sw.js';

      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          console.log('[SW] Service Worker registered:', registration);

          // Manejar actualizaciones
          registration.addEventListener('updatefound', () => {
            const installingWorker = registration.installing;
            
            if (installingWorker) {
              installingWorker.addEventListener('statechange', () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    // Hay una nueva versión disponible
                    console.log('[SW] New content available, please refresh.');
                    // Opcional: Mostrar notificación al usuario
                    handleServiceWorkerUpdate();
                  } else {
                    // Service Worker instalado por primera vez
                    console.log('[SW] Content cached for offline use.');
                  }
                }
              });
            }
          });

          // Verificar actualizaciones cada hora
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000); // 1 hora
        })
        .catch((error) => {
          console.error('[SW] Registration failed:', error);
        });
    });

    // Manejar cuando el Service Worker toma control
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      
      // Recargar la página cuando el nuevo Service Worker toma control
      window.location.reload();
    });
  } else {
    console.log('[SW] Service Worker not supported');
  }
}

/**
 * Manejar actualización del Service Worker
 * Muestra notificación al usuario para que recargue la página
 */
function handleServiceWorkerUpdate() {
  if (typeof window !== 'undefined') {
    notify.info(
  { title: 'Nueva versión disponible', description: 'Recarga la página para actualizar.' },
  { duration: 5000 }
);
  }
}

/**
 * Desregistrar Service Worker (útil para desarrollo/debugging)
 */
export function unregisterServiceWorker() {
  if (typeof window === 'undefined') {
    return;
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
        console.log('[SW] Service Worker unregistered');
      })
      .catch((error) => {
        console.error('[SW] Unregistration failed:', error);
      });
  }
}

/**
 * Hook para usar el Service Worker en componentes React
 * Solo funciona en client components
 */
export function useServiceWorker() {
  if (typeof window === 'undefined') {
    return { isSupported: false };
  }

  return {
    isSupported: 'serviceWorker' in navigator,
    register: registerServiceWorker,
    unregister: unregisterServiceWorker,
  };
}

