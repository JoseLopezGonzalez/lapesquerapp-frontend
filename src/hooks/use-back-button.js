import { useEffect, useRef } from 'react';

/**
 * Hook useBackButton - Intercepta el botón back del navegador/dispositivo
 * 
 * Este hook captura la acción del botón back físico del smartphone o del navegador
 * y ejecuta una función callback personalizada en lugar de navegar a la URL anterior.
 * 
 * Útil para pantallas móviles donde queremos que el botón back del dispositivo
 * ejecute la misma acción que el botón back de la interfaz.
 * 
 * @param {Function} onBack - Función a ejecutar cuando se presiona el botón back
 * @param {boolean} enabled - Si está habilitado (por defecto true)
 * 
 * @example
 * ```jsx
 * const handleBack = () => {
 *   setActiveSection(null);
 * };
 * 
 * useBackButton(handleBack);
 * ```
 */
export function useBackButton(onBack, enabled = true) {
  const onBackRef = useRef(onBack);
  const isEnabledRef = useRef(enabled);
  const hasPushedStateRef = useRef(false);

  // Mantener referencias actualizadas
  useEffect(() => {
    onBackRef.current = onBack;
    isEnabledRef.current = enabled;
  }, [onBack, enabled]);

  useEffect(() => {
    // Solo ejecutar en cliente
    if (typeof window === 'undefined' || !enabled) return;

    // Agregar una entrada al historial para poder interceptar el back
    // Esto crea una "página virtual" en el historial
    // Solo hacerlo una vez cuando el componente se monta
    if (!hasPushedStateRef.current) {
      window.history.pushState({ preventBack: true }, '', window.location.href);
      hasPushedStateRef.current = true;
    }

    const handlePopState = (event) => {
      // Prevenir la navegación inmediatamente volviendo a agregar la entrada
      // Esto debe hacerse de forma síncrona para evitar cualquier navegación visible
      window.history.pushState({ preventBack: true }, '', window.location.href);
      
      // Ejecutar el callback personalizado después de prevenir la navegación
      if (isEnabledRef.current && onBackRef.current) {
        // Usar setTimeout para asegurar que se ejecute después de que el navegador procese el pushState
        setTimeout(() => {
          onBackRef.current();
        }, 0);
      }
    };

    // Escuchar el evento popstate (se dispara cuando se presiona back)
    window.addEventListener('popstate', handlePopState);

    // Cleanup: remover el listener
    return () => {
      window.removeEventListener('popstate', handlePopState);
      hasPushedStateRef.current = false;
    };
  }, [enabled]); // Solo re-ejecutar si enabled cambia
}
