/**
 * Hook usePWAInstallStrategy - Estrategia de cuándo mostrar Install Prompt
 * 
 * Estrategia implementada:
 * - Mostrar después de 3 páginas visitadas Y 30 segundos en la sesión
 * - Mostrar máximo 1 vez al mes
 * - Limitar a 3 veces en total
 * - Si el usuario lo cierra, no se guarda desestimación permanente
 * - Si instala, desaparecer para siempre
 * 
 * Referencia: docs/mobile-adaptation/00-PLAN-GENERAL.md
 */

import { useState, useEffect } from 'react';
import { usePWAInstall } from './use-pwa-install';
import { usePathname } from 'next/navigation';

const STORAGE_KEY_LAST_SHOWN = 'pwa-install-last-shown';
const STORAGE_KEY_SHOWN_COUNT = 'pwa-install-shown-count';
const STORAGE_KEY_PAGES_VISITED = 'pwa-install-pages-visited';
const STORAGE_KEY_SESSION_START = 'pwa-install-session-start';

// Configuración
const MIN_PAGES_VISITED = 3; // Mínimo de páginas visitadas antes de mostrar
const MIN_TIME_SECONDS = 30; // Mínimo tiempo en sesión (segundos)
const SHOW_INTERVAL_DAYS = 30; // Mostrar máximo una vez cada 30 días
const MAX_SHOWN_COUNT = 3; // Máximo 3 veces en total

/**
 * Hook para determinar si mostrar el Install Prompt
 * 
 * @returns {object} Estado y funciones de control
 * @returns {boolean} returns.shouldShow - Si debe mostrarse el prompt
 * @returns {boolean} returns.canShow - Si puede mostrarse (no instalado, etc.)
 * @returns {function} returns.markAsShown - Marcar como mostrado
 * @returns {function} returns.markAsDismissed - Marcar como cerrado (solo esta sesión)
 * @returns {number} returns.shownCount - Cuántas veces se ha mostrado en total
 */
export function usePWAInstallStrategy() {
  const { canInstall, isInstalled, isIOS } = usePWAInstall();
  const pathname = usePathname();
  const [shouldShow, setShouldShow] = useState(false);
  const [dismissedThisSession, setDismissedThisSession] = useState(false);
  const [pagesVisited, setPagesVisited] = useState(0);
  const [shownCount, setShownCount] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState(null);

  // Inicializar contadores desde localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Obtener contador de veces mostrado
    const count = parseInt(localStorage.getItem(STORAGE_KEY_SHOWN_COUNT) || '0', 10);
    setShownCount(count);

    // Obtener páginas visitadas
    const pages = parseInt(localStorage.getItem(STORAGE_KEY_PAGES_VISITED) || '0', 10);
    setPagesVisited(pages);

    // Inicializar o obtener tiempo de inicio de sesión
    const sessionStart = localStorage.getItem(STORAGE_KEY_SESSION_START);
    if (!sessionStart) {
      const now = Date.now();
      localStorage.setItem(STORAGE_KEY_SESSION_START, now.toString());
      setSessionStartTime(now);
    } else {
      setSessionStartTime(parseInt(sessionStart, 10));
    }
  }, []);

  // Incrementar páginas visitadas cuando cambia la ruta
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Ignorar cambios muy rápidos (navegación interna rápida)
    // Solo contar si la ruta realmente cambió (no solo el hash o query params)
    const timeoutId = setTimeout(() => {
      const currentPages = parseInt(localStorage.getItem(STORAGE_KEY_PAGES_VISITED) || '0', 10);
      // Evitar contar la misma página múltiples veces
      const lastPath = sessionStorage.getItem('pwa-install-last-path');
      if (lastPath !== pathname) {
        const newPages = currentPages + 1;
        localStorage.setItem(STORAGE_KEY_PAGES_VISITED, newPages.toString());
        sessionStorage.setItem('pwa-install-last-path', pathname);
        setPagesVisited(newPages);
      }
    }, 1000); // Esperar 1 segundo antes de contar

    return () => clearTimeout(timeoutId);
  }, [pathname]);

  // Evaluar si debe mostrarse
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // No mostrar si ya está instalado
    if (isInstalled) {
      setShouldShow(false);
      return;
    }

    // No mostrar si fue cerrado en esta sesión
    if (dismissedThisSession) {
      setShouldShow(false);
      return;
    }

    // No mostrar si ya se mostró el máximo de veces
    const count = parseInt(localStorage.getItem(STORAGE_KEY_SHOWN_COUNT) || '0', 10);
    if (count >= MAX_SHOWN_COUNT) {
      setShouldShow(false);
      return;
    }

    // Verificar última vez que se mostró (una vez al mes)
    const lastShown = localStorage.getItem(STORAGE_KEY_LAST_SHOWN);
    if (lastShown) {
      const lastShownDate = new Date(parseInt(lastShown, 10));
      const now = new Date();
      const daysSinceLastShown = Math.floor((now - lastShownDate) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLastShown < SHOW_INTERVAL_DAYS) {
        setShouldShow(false);
        return;
      }
    }

    // Verificar condiciones: páginas visitadas Y tiempo mínimo
    const sessionStart = localStorage.getItem(STORAGE_KEY_SESSION_START);
    if (!sessionStart) {
      setShouldShow(false);
      return;
    }

    const currentPages = parseInt(localStorage.getItem(STORAGE_KEY_PAGES_VISITED) || '0', 10);
    const startTime = parseInt(sessionStart, 10);
    const currentTime = Date.now();
    const secondsInSession = Math.floor((currentTime - startTime) / 1000);

    // Solo mostrar en Android/Chrome (que tienen prompt nativo) O iOS (que necesita guía)
    const canShowByPlatform = canInstall || isIOS;

    if (
      canShowByPlatform &&
      currentPages >= MIN_PAGES_VISITED &&
      secondsInSession >= MIN_TIME_SECONDS
    ) {
      setShouldShow(true);
    } else {
      setShouldShow(false);
    }
  }, [canInstall, isInstalled, isIOS, dismissedThisSession, pagesVisited, sessionStartTime]);

  /**
   * Marcar como mostrado (cuando se renderiza el componente)
   */
  const markAsShown = () => {
    if (typeof window === 'undefined') return;

    const now = Date.now();
    localStorage.setItem(STORAGE_KEY_LAST_SHOWN, now.toString());

    const count = parseInt(localStorage.getItem(STORAGE_KEY_SHOWN_COUNT) || '0', 10);
    const newCount = count + 1;
    localStorage.setItem(STORAGE_KEY_SHOWN_COUNT, newCount.toString());
    setShownCount(newCount);
  };

  /**
   * Marcar como cerrado (solo esta sesión, no permanente)
   */
  const markAsDismissed = () => {
    setDismissedThisSession(true);
  };

  /**
   * Resetear para testing (opcional, solo en desarrollo)
   */
  const resetStrategy = () => {
    if (typeof window === 'undefined') return;
    if (process.env.NODE_ENV !== 'development') return;

    localStorage.removeItem(STORAGE_KEY_LAST_SHOWN);
    localStorage.removeItem(STORAGE_KEY_SHOWN_COUNT);
    localStorage.removeItem(STORAGE_KEY_PAGES_VISITED);
    localStorage.removeItem(STORAGE_KEY_SESSION_START);
    setDismissedThisSession(false);
    setPagesVisited(0);
    setShownCount(0);
    setSessionStartTime(Date.now());
  };

  return {
    shouldShow,
    canShow: (canInstall || isIOS) && !isInstalled,
    markAsShown,
    markAsDismissed,
    shownCount,
    pagesVisited,
    isIOS,
    canInstall,
    isInstalled,
    resetStrategy: process.env.NODE_ENV === 'development' ? resetStrategy : undefined,
  };
}

