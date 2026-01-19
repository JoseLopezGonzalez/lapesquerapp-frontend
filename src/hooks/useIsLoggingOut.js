"use client";

import { useState, useEffect } from 'react';

/**
 * Hook que verifica si hay un logout en curso
 * Verifica sessionStorage de forma síncrona para evitar renders intermedios
 * 
 * @returns {boolean} true si hay un logout en curso, false en caso contrario
 */
export function useIsLoggingOut() {
  const [isLoggingOut, setIsLoggingOut] = useState(() => {
    // ✅ Verificación síncrona en el estado inicial (solo en cliente)
    if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
      return false;
    }
    return sessionStorage.getItem('__is_logging_out__') === 'true';
  });

  useEffect(() => {
    // Verificar periódicamente para mantener sincronizado durante redirecciones
    const checkLogout = () => {
      if (typeof sessionStorage !== 'undefined') {
        const flag = sessionStorage.getItem('__is_logging_out__') === 'true';
        setIsLoggingOut(prev => {
          // Solo actualizar si cambió para evitar renders innecesarios
          if (prev !== flag) {
            return flag;
          }
          return prev;
        });
      }
    };

    // Verificar inmediatamente
    checkLogout();
    
    // Verificar periódicamente (cada 100ms) para detectar cambios
    const interval = setInterval(checkLogout, 100);
    
    return () => clearInterval(interval);
  }, []);

  return isLoggingOut;
}

