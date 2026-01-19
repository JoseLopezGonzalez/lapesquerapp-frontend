/**
 * Hook usePWAInstallStrategy - Estrategia de cuándo mostrar Install Prompt
 * 
 * Nueva estrategia implementada:
 * - Mostrar siempre en la pantalla principal después de loguearse
 * - Si se cierra, volver a mostrar después de 24 horas
 * - Funciona para cualquier dispositivo
 * - Si instala, desaparecer para siempre
 * 
 * Referencia: docs/mobile-adaptation/00-PLAN-GENERAL.md
 */

import { useState, useEffect } from 'react';
import { usePWAInstall } from './use-pwa-install';
import { usePathname } from 'next/navigation';

const STORAGE_KEY_LAST_DISMISSED = 'pwa-install-last-dismissed';

// Configuración
const SHOW_AFTER_HOURS = 24; // Volver a mostrar después de 24 horas

// Rutas principales después del login donde se debe mostrar
const MAIN_ROUTES = [
  '/admin/home',
  '/admin/dashboard',
  '/admin'
];

/**
 * Hook para determinar si mostrar el Install Prompt
 * 
 * @returns {object} Estado y funciones de control
 * @returns {boolean} returns.shouldShow - Si debe mostrarse el prompt
 * @returns {boolean} returns.canShow - Si puede mostrarse (no instalado, etc.)
 * @returns {function} returns.markAsShown - Marcar como mostrado (no necesario ahora)
 * @returns {function} returns.markAsDismissed - Marcar como cerrado (guarda timestamp)
 */
export function usePWAInstallStrategy() {
  const { canInstall, isInstalled, isIOS } = usePWAInstall();
  const pathname = usePathname();
  const [shouldShow, setShouldShow] = useState(false);

  // Evaluar si debe mostrarse
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // No mostrar si ya está instalado
    if (isInstalled) {
      setShouldShow(false);
      return;
    }

    // Verificar si estamos en una ruta principal
    const isMainRoute = MAIN_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'));
    if (!isMainRoute) {
      setShouldShow(false);
      return;
    }

    // Verificar última vez que se cerró
    const lastDismissed = localStorage.getItem(STORAGE_KEY_LAST_DISMISSED);
    if (lastDismissed) {
      const lastDismissedTime = parseInt(lastDismissed, 10);
      const now = Date.now();
      const hoursSinceDismissed = (now - lastDismissedTime) / (1000 * 60 * 60);
      
      // Si pasaron menos de 24 horas, no mostrar
      if (hoursSinceDismissed < SHOW_AFTER_HOURS) {
        setShouldShow(false);
        return;
      }
    }

    // Mostrar si puede (Android/Chrome o iOS)
    const canShowByPlatform = canInstall || isIOS;
    setShouldShow(canShowByPlatform);
  }, [canInstall, isInstalled, isIOS, pathname]);

  /**
   * Marcar como mostrado (no hace nada, solo para compatibilidad)
   */
  const markAsShown = () => {
    // No necesitamos guardar nada ahora
  };

  /**
   * Marcar como cerrado - guarda timestamp para mostrar después de 24h
   */
  const markAsDismissed = () => {
    if (typeof window === 'undefined') return;
    const now = Date.now();
    localStorage.setItem(STORAGE_KEY_LAST_DISMISSED, now.toString());
    setShouldShow(false);
  };

  /**
   * Resetear para testing (opcional, solo en desarrollo)
   */
  const resetStrategy = () => {
    if (typeof window === 'undefined') return;
    if (process.env.NODE_ENV !== 'development') return;

    localStorage.removeItem(STORAGE_KEY_LAST_DISMISSED);
    setShouldShow(true);
  };

  return {
    shouldShow,
    canShow: (canInstall || isIOS) && !isInstalled,
    markAsShown,
    markAsDismissed,
    isIOS,
    canInstall,
    isInstalled,
    resetStrategy: process.env.NODE_ENV === 'development' ? resetStrategy : undefined,
  };
}

