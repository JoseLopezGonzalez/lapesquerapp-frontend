/**
 * Motion System - Presets Globales
 * 
 * Presets de animación para mantener consistencia en toda la app mobile.
 * Usa Framer Motion con duraciones cortas y respeto a prefers-reduced-motion.
 * 
 * Reglas:
 * - Duración: 0.18–0.24s (máximo)
 * - Solo transform + opacity (nunca width/height/top/left)
 * - Respetar prefers-reduced-motion
 * 
 * Referencia: docs/mobile-adaptation/00-PLAN-GENERAL.md
 */

import { useReducedMotion } from 'framer-motion';

// ============================================================================
// PRESETS DE ANIMACIÓN
// ============================================================================

/**
 * 1. pageTransition - Transiciones de Pantalla
 * 
 * Usar para: Navegación entre páginas, drill-down (lista → detalle)
 * Duración: 200ms
 */
export const pageTransition = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.2, ease: "easeOut" }
};

/**
 * 2. sheetTransition - Bottom Sheets y Modales
 * 
 * Usar para: Bottom sheets, modales que aparecen desde abajo
 * Duración: 240ms con spring
 */
export const sheetTransition = {
  initial: { y: "100%", opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: "100%", opacity: 0 },
  transition: { 
    type: "spring", 
    damping: 25, 
    stiffness: 200,
    duration: 0.24
  }
};

/**
 * 3. feedbackPop - Feedback de Acciones
 * 
 * Usar para: Confirmaciones (check, success), errores, cambios de estado
 * Duración: 180ms con spring
 */
export const feedbackPop = {
  initial: { scale: 0, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.8, opacity: 0 },
  transition: { 
    type: "spring", 
    damping: 15, 
    stiffness: 300,
    duration: 0.18
  }
};

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Obtener transición respetando prefers-reduced-motion
 * 
 * @param {object} preset - Preset de animación (pageTransition, sheetTransition, etc.)
 * @param {boolean} prefersReducedMotion - Si el usuario prefiere movimiento reducido
 * @returns {object} Configuración de transición
 */
export function getTransition(preset, prefersReducedMotion = false) {
  if (prefersReducedMotion) {
    return { duration: 0 };
  }
  return preset.transition;
}

/**
 * Hook para obtener transición con prefers-reduced-motion automático
 * 
 * @param {object} preset - Preset de animación
 * @returns {object} Configuración de transición respetando preferencias
 */
export function useTransition(preset) {
  const prefersReducedMotion = useReducedMotion();
  return getTransition(preset, prefersReducedMotion);
}

/**
 * Variante de pageTransition para drill-down (lista → detalle)
 * Entra desde la derecha
 */
export const drillDownTransition = {
  initial: { opacity: 0, x: 300 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 300 },
  transition: { duration: 0.2, ease: "easeOut" }
};

/**
 * Variante de pageTransition para volver (detalle → lista)
 * Sale a la derecha
 */
export const drillBackTransition = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.2, ease: "easeOut" }
};

// ============================================================================
// PRESETS PARA LISTAS (Stagger)
// ============================================================================

/**
 * Preset para entrada de listas con stagger
 * 
 * @param {number} delay - Delay entre items (por defecto 0.05)
 * @returns {object} Configuración de animación
 */
export function listStaggerTransition(delay = 0.05) {
  return {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.2, ease: "easeOut", delay }
  };
}

/**
 * Configuración de stagger para AnimatePresence en listas
 * 
 * @param {number} staggerDelay - Delay entre items
 * @returns {object} Configuración de stagger
 */
export function getStaggerConfig(staggerDelay = 0.05) {
  return {
    staggerChildren: staggerDelay,
    delayChildren: 0
  };
}

// ============================================================================
// PRESETS ESPECÍFICOS DE COMPONENTES
// ============================================================================

/**
 * Transición para cards al aparecer
 */
export const cardAppearTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.18, ease: "easeOut" }
};

/**
 * Transición para modales centrados (usar con precaución en mobile)
 */
export const modalTransition = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.2, ease: "easeOut" }
};

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Todos los presets exportados
 */
export const MOTION_PRESETS = {
  page: pageTransition,
  sheet: sheetTransition,
  feedback: feedbackPop,
  drillDown: drillDownTransition,
  drillBack: drillBackTransition,
  card: cardAppearTransition,
  modal: modalTransition,
};

