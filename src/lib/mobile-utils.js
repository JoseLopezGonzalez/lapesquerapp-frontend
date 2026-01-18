/**
 * Mobile Utils - Utilidades para accesibilidad mobile
 * 
 * Utilidades para manejar safe areas, scroll on focus y otras funcionalidades
 * críticas para la experiencia mobile.
 * 
 * Referencia: docs/mobile-adaptation/00-PLAN-GENERAL.md
 */

// ============================================================================
// SAFE AREAS (iOS)
// ============================================================================

/**
 * Obtener clases de safe area para iOS
 * 
 * @param {object} options - Opciones de safe area
 * @param {boolean} options.bottom - Añadir padding bottom con safe area
 * @param {boolean} options.top - Añadir padding top con safe area
 * @param {boolean} options.withBottomNav - Añadir padding extra para bottom nav (56px + safe area)
 * @returns {string} Clases Tailwind combinadas
 */
export function getSafeAreaClasses({ bottom = false, top = false, withBottomNav = false } = {}) {
  const classes = [];
  
  if (bottom) {
    classes.push('pb-[env(safe-area-inset-bottom)]');
  }
  
  if (top) {
    classes.push('pt-[env(safe-area-inset-top)]');
  }
  
  if (withBottomNav) {
    // 56px (h-14) + safe area
    classes.push('pb-[calc(3.5rem+env(safe-area-inset-bottom))]');
  }
  
  return classes.join(' ');
}

/**
 * Hook para obtener valores de safe area (solo en cliente)
 * 
 * @returns {{ bottom: number, top: number, left: number, right: number } | null}
 */
export function useSafeAreaInsets() {
  if (typeof window === 'undefined') {
    return null;
  }

  // CSS env() no es accesible desde JS directamente
  // Esto es un helper para cuando necesites valores numéricos
  // En la mayoría de casos, usa las clases CSS directamente
  return {
    bottom: 0, // Usar CSS env(safe-area-inset-bottom) en su lugar
    top: 0,    // Usar CSS env(safe-area-inset-top) en su lugar
    left: 0,
    right: 0,
  };
}

// ============================================================================
// SCROLL ON FOCUS
// ============================================================================

/**
 * Manejar scroll automático cuando un input recibe focus
 * Útil para evitar que el teclado virtual tape inputs en mobile
 * 
 * @param {HTMLElement} element - Elemento que recibió focus
 * @param {object} options - Opciones de scroll
 * @param {number} options.delay - Delay antes de hacer scroll (ms) - default 300
 * @param {'smooth' | 'auto'} options.behavior - Comportamiento del scroll - default 'smooth'
 * @param {'center' | 'start' | 'end' | 'nearest'} options.block - Posición vertical - default 'center'
 * @param {'center' | 'start' | 'end' | 'nearest'} options.inline - Posición horizontal - default 'nearest'
 */
export function scrollIntoViewOnFocus(element, options = {}) {
  if (!element || typeof window === 'undefined') return;

  const {
    delay = 300,
    behavior = 'smooth',
    block = 'center',
    inline = 'nearest',
  } = options;

  setTimeout(() => {
    element.scrollIntoView({
      behavior,
      block,
      inline,
    });
  }, delay);
}

// Necesitamos importar React para los hooks
import * as React from 'react';

/**
 * Hook para añadir scroll on focus a un input
 * 
 * @param {object} options - Opciones de scroll
 * @returns {function} Handler para onFocus
 * 
 * @example
 * const handleFocus = useScrollOnFocus({ delay: 300 });
 * 
 * <input onFocus={(e) => handleFocus(e.target)} />
 */
export function useScrollOnFocus(options = {}) {
  return React.useCallback(
    (element) => {
      scrollIntoViewOnFocus(element, options);
    },
    [options.delay, options.behavior, options.block, options.inline]
  );
}

// ============================================================================
// TOUCH TARGETS
// ============================================================================

/**
 * Verificar si un elemento cumple con el tamaño mínimo de touch target (44x44px)
 * 
 * @param {HTMLElement} element - Elemento a verificar
 * @returns {boolean} true si cumple con el tamaño mínimo
 */
export function isValidTouchTarget(element) {
  if (!element || typeof window === 'undefined') return false;

  const rect = element.getBoundingClientRect();
  const minSize = 44; // Apple HIG minimum
  
  return rect.width >= minSize && rect.height >= minSize;
}

/**
 * Obtener clases para asegurar tamaño mínimo de touch target
 * 
 * @returns {string} Clases Tailwind
 */
export function getMinTouchTargetClasses() {
  return 'min-h-[44px] min-w-[44px]';
}

// ============================================================================
// KEYBOARD HANDLING
// ============================================================================

/**
 * Detectar si el teclado virtual está visible (aproximación)
 * No es 100% preciso, pero útil para algunos casos
 * 
 * @returns {boolean} true si probablemente el teclado está visible
 */
export function isKeyboardVisible() {
  if (typeof window === 'undefined') return false;

  // Aproximación: si la altura de la ventana es mucho menor que la altura esperada
  const heightDifference = window.visualViewport
    ? window.screen.height - window.visualViewport.height
    : 0;
  
  // Si la diferencia es significativa (>150px), probablemente hay teclado
  return heightDifference > 150;
}

/**
 * Hook para detectar visibilidad del teclado
 * 
 * @returns {boolean} true si el teclado probablemente está visible
 */
export function useKeyboardVisible() {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) {
      return;
    }

    const handleResize = () => {
      const heightDifference = window.screen.height - window.visualViewport.height;
      setIsVisible(heightDifference > 150);
    };

    window.visualViewport.addEventListener('resize', handleResize);
    handleResize(); // Verificar estado inicial

    return () => {
      window.visualViewport.removeEventListener('resize', handleResize);
    };
  }, []);

  return isVisible;
}

