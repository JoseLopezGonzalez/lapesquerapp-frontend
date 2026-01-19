/**
 * Presets de animación específicos para AuthTransitionScreen
 * Extiende motion-presets.js con animaciones más elaboradas para la experiencia de autenticación
 */

import { useReducedMotion } from 'framer-motion';

/**
 * Logo entrance - Entrada del logo principal
 * Usar para: Logo que aparece al iniciar transición
 */
export const logoEntrance = {
  initial: { 
    opacity: 0, 
    scale: 0.8, 
    y: 30 
  },
  animate: { 
    opacity: 1, 
    scale: 1, 
    y: 0 
  },
  exit: { 
    opacity: 0, 
    scale: 0.9, 
    y: -20 
  },
  transition: { 
    type: "spring",
    damping: 20,
    stiffness: 300,
    duration: 0.4
  }
};

/**
 * Text stagger - Animación de texto con stagger
 * Usar para: Textos que cambian durante la transición
 */
export const textStagger = {
  initial: { 
    opacity: 0, 
    y: 10 
  },
  animate: { 
    opacity: 1, 
    y: 0 
  },
  exit: { 
    opacity: 0, 
    y: -10 
  },
  transition: { 
    duration: 0.3, 
    ease: "easeOut" 
  }
};

/**
 * Progress bar - Barra de progreso animada
 * Usar para: Indicador de progreso durante login/logout
 */
export const progressBar = {
  initial: { 
    scaleX: 0 
  },
  animate: { 
    scaleX: 1 
  },
  transition: { 
    duration: 0.6, 
    ease: "easeInOut" 
  }
};

/**
 * Success checkmark - Checkmark de éxito
 * Usar para: Confirmación visual de login exitoso
 */
export const successCheckmark = {
  initial: { 
    scale: 0, 
    opacity: 0 
  },
  animate: { 
    scale: [0, 1.2, 1], 
    opacity: 1 
  },
  transition: { 
    type: "spring",
    damping: 15,
    stiffness: 400,
    duration: 0.5
  }
};

/**
 * Error shake - Shake para errores
 * Usar para: Feedback visual de error de autenticación
 */
export const errorShake = {
  animate: {
    x: [0, -10, 10, -10, 10, 0],
  },
  transition: {
    duration: 0.5,
    ease: "easeInOut"
  }
};

/**
 * Overlay fade - Fade del overlay de fondo
 * Usar para: Entrada/salida de la pantalla completa
 */
export const overlayFade = {
  initial: { 
    opacity: 0 
  },
  animate: { 
    opacity: 1 
  },
  exit: { 
    opacity: 0 
  },
  transition: { 
    duration: 0.3, 
    ease: "easeInOut" 
  }
};

/**
 * Icon rotation - Rotación continua para iconos
 * Usar para: Iconos de carga (logout, login)
 */
export const iconRotation = {
  animate: { 
    rotate: 360 
  },
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "linear"
  }
};

/**
 * Hook para obtener transición respetando prefers-reduced-motion
 * 
 * @param {object} preset - Preset de animación
 * @returns {object} Configuración de animación respetando preferencias
 */
export function useAuthTransition(preset) {
  const prefersReducedMotion = useReducedMotion();
  
  if (prefersReducedMotion) {
    // Si el usuario prefiere movimiento reducido, desactivar animaciones
    if (preset.transition) {
      return {
        ...preset,
        transition: { duration: 0 }
      };
    }
    return {
      ...preset,
      animate: preset.initial || {},
      transition: { duration: 0 }
    };
  }
  
  return preset;
}

/**
 * Exportar todos los presets
 */
export const AUTH_TRANSITION_PRESETS = {
  logoEntrance,
  textStagger,
  progressBar,
  successCheckmark,
  errorShake,
  overlayFade,
  iconRotation,
};

