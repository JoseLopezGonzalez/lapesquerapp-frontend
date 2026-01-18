/**
 * Hook usePWAInstall - Manejo de instalación PWA
 * 
 * Captura el evento beforeinstallprompt para Android/Chrome
 * y proporciona funcionalidad para instalar la PWA.
 * 
 * Referencia: docs/mobile-adaptation/00-PLAN-GENERAL.md
 */

import { useState, useEffect } from 'react';

/**
 * Hook para manejar la instalación de PWA
 * 
 * Captura el evento beforeinstallprompt para Android/Chrome
 * y proporciona funcionalidad para instalar la PWA.
 * 
 * @returns {object} Objeto con estado y funciones de instalación
 * @returns {boolean} returns.canInstall - Si se puede instalar (Android/Chrome)
 * @returns {boolean} returns.isInstalled - Si ya está instalada
 * @returns {boolean} returns.isIOS - Si es dispositivo iOS
 * @returns {function} returns.install - Función para mostrar prompt de instalación
 * @returns {Event | null} returns.deferredPrompt - Evento capturado
 */
export function usePWAInstall() {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detectar iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(iOS);

    // Detectar si ya está instalada
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                         (window.navigator?.standalone === true);
    setIsInstalled(isStandalone);

    // Capturar evento beforeinstallprompt (Android/Chrome)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Limpiar al desmontar
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  /**
   * Función para mostrar el prompt de instalación
   * Solo funciona en Android/Chrome
   */
  const install = async () => {
    if (!deferredPrompt || !deferredPrompt.prompt) {
      console.warn('[PWA] No hay prompt de instalación disponible');
      return false;
    }

    try {
      // Mostrar el prompt
      await deferredPrompt.prompt();

      // Esperar la respuesta del usuario
      const userChoice = await deferredPrompt.userChoice;
      const outcome = userChoice?.outcome;

      if (outcome === 'accepted') {
        console.log('[PWA] Usuario aceptó la instalación');
        setCanInstall(false);
        setDeferredPrompt(null);
        return true;
      } else {
        console.log('[PWA] Usuario rechazó la instalación');
        return false;
      }
    } catch (error) {
      console.error('[PWA] Error al mostrar prompt:', error);
      return false;
    }
  };

  return {
    canInstall,
    isInstalled,
    isIOS,
    install,
    deferredPrompt,
  };
}

/**
 * Función para detectar si es iOS
 * Útil para usar fuera de componentes React
 */
export function isIOSDevice() {
  if (typeof window === 'undefined') return false;
  
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/**
 * Función para detectar si la PWA está instalada
 * Útil para usar fuera de componentes React
 */
export function isPWAInstalled() {
  if (typeof window === 'undefined') return false;
  
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator?.standalone === true);
}

