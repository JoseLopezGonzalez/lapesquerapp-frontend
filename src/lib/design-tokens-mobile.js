/**
 * Design Tokens Mobile
 * 
 * Valores estándar para mantener coherencia visual en toda la app mobile.
 * Estos tokens deben usarse consistentemente en todos los componentes mobile.
 * 
 * Referencia: docs/mobile-adaptation/00-PLAN-GENERAL.md
 */

// ============================================================================
// ALTURAS DE COMPONENTES
// ============================================================================

/**
 * Alturas estándar de componentes móviles
 */
export const MOBILE_HEIGHTS = {
  /** Inputs estándar - 48px */
  INPUT: 'h-12',
  /** Inputs grandes - 56px */
  INPUT_LARGE: 'h-14',
  /** Botones - mínimo 44px (Apple HIG) */
  BUTTON: 'h-11', // 44px mínimo
  /** Bottom nav items - 56px */
  BOTTOM_NAV: 'h-14',
  /** Touch targets - mínimo 44x44px */
  TOUCH_TARGET: 'min-h-[44px] min-w-[44px]',
};

// ============================================================================
// PADDING Y SPACING
// ============================================================================

/**
 * Padding y espaciado estándar para mobile
 */
export const MOBILE_SPACING = {
  /** Padding horizontal de pantalla - 16px */
  SCREEN_HORIZONTAL: 'px-4',
  /** Padding vertical de pantalla - 12px */
  SCREEN_VERTICAL: 'py-3',
  /** Espaciado entre cards - 12px */
  CARD_GAP: 'gap-3',
  /** Espaciado vertical entre secciones - 24px */
  SECTION_VERTICAL: 'space-y-6',
  /** Padding interno de cards - 16px */
  CARD_PADDING: 'p-4',
  /** Espaciado entre elementos interactivos - mínimo 8px */
  INTERACTIVE_GAP: 'gap-2', // mínimo 8px
};

// ============================================================================
// BORDER RADIUS
// ============================================================================

/**
 * Border radius estándar para mobile (más "app-like")
 */
export const MOBILE_RADIUS = {
  /** Cards - 16px (más app-like) */
  CARD: 'rounded-2xl',
  /** Botones - 8px */
  BUTTON: 'rounded-lg',
  /** Inputs - 8px */
  INPUT: 'rounded-lg',
  /** Bottom sheets - 24px (top) */
  BOTTOM_SHEET: 'rounded-t-3xl',
};

// ============================================================================
// TAMAÑOS DE ICONOS
// ============================================================================

/**
 * Tamaños de iconos estándar para mobile
 */
export const MOBILE_ICON_SIZES = {
  /** Iconos en bottom nav - 24px */
  BOTTOM_NAV: 'w-6 h-6',
  /** Iconos en botones - 20px */
  BUTTON: 'w-5 h-5',
  /** Iconos en cards - 20px */
  CARD: 'w-5 h-5',
};

// ============================================================================
// SAFE AREAS (iOS)
// ============================================================================

/**
 * Utilidades para safe areas de iOS
 */
export const MOBILE_SAFE_AREAS = {
  /** Bottom padding con safe area */
  BOTTOM: 'pb-[env(safe-area-inset-bottom)]',
  /** Top padding con safe area (notch) */
  TOP: 'pt-[env(safe-area-inset-top)]',
  /** Bottom padding cuando hay bottom nav */
  BOTTOM_WITH_NAV: 'pb-[calc(3.5rem+env(safe-area-inset-bottom))]', // 56px (h-14) + safe area
};

// ============================================================================
// TIPOGRAFÍA
// ============================================================================

/**
 * Tamaños de texto estándar para mobile
 * Mínimo 16px para evitar zoom automático en iOS
 */
export const MOBILE_TYPOGRAPHY = {
  /** Texto base - 16px (evita zoom iOS) */
  BASE: 'text-base',
  /** Inputs - 16px mínimo */
  INPUT: 'text-base',
};

// ============================================================================
// CLASES COMPUESTAS (UTILIDADES)
// ============================================================================

/**
 * Clases compuestas útiles para componentes comunes
 */
export const MOBILE_UTILITIES = {
  /** Input mobile-friendly completo */
  INPUT: `${MOBILE_HEIGHTS.INPUT} ${MOBILE_RADIUS.INPUT} ${MOBILE_TYPOGRAPHY.INPUT} ${MOBILE_SPACING.SCREEN_HORIZONTAL}`,
  /** Card mobile estándar */
  CARD: `${MOBILE_RADIUS.CARD} ${MOBILE_SPACING.CARD_PADDING}`,
  /** Bottom nav completo con safe area */
  BOTTOM_NAV: `${MOBILE_HEIGHTS.BOTTOM_NAV} ${MOBILE_SAFE_AREAS.BOTTOM} fixed bottom-0 left-0 right-0`,
  /** Contenedor de pantalla mobile */
  SCREEN_CONTAINER: `${MOBILE_SPACING.SCREEN_HORIZONTAL} ${MOBILE_SPACING.SCREEN_VERTICAL}`,
};

// ============================================================================
// BREAKPOINTS
// ============================================================================

/**
 * Breakpoints estándar (consistente con Tailwind)
 */
export const MOBILE_BREAKPOINTS = {
  /** Punto de corte mobile/desktop - 768px */
  MOBILE_DESKTOP: 768,
  /** Clase Tailwind para mobile */
  MOBILE_MAX: 'max-md',
  /** Clase Tailwind para desktop */
  DESKTOP_MIN: 'md',
};

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Exportar todo como objeto único para acceso fácil
 */
export const MOBILE_TOKENS = {
  heights: MOBILE_HEIGHTS,
  spacing: MOBILE_SPACING,
  radius: MOBILE_RADIUS,
  icons: MOBILE_ICON_SIZES,
  safeAreas: MOBILE_SAFE_AREAS,
  typography: MOBILE_TYPOGRAPHY,
  utilities: MOBILE_UTILITIES,
  breakpoints: MOBILE_BREAKPOINTS,
};

/**
 * Función helper para combinar clases mobile
 * @param {...string} classes - Clases a combinar
 * @returns {string} Clases combinadas
 */
export function combineMobileClasses(...classes) {
  return classes.filter(Boolean).join(' ');
}

