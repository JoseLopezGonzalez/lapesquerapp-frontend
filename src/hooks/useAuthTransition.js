"use client";

import { useState, useEffect, useCallback } from 'react';

/**
 * Estados posibles de la transición de autenticación
 */
export const AUTH_TRANSITION_STATES = {
  IDLE: 'idle',
  LOGIN: 'login',
  LOGOUT: 'logout',
  SUCCESS: 'success',
  ERROR: 'error',
};

/**
 * Hook para controlar la pantalla de transición de autenticación
 * 
 * Gestiona el estado global de la transición y sincroniza con sessionStorage
 * para mantener el estado durante redirecciones.
 * 
 * @returns {object} { 
 *   state,           // Estado actual de la transición
 *   setState,        // Función para establecer estado directamente
 *   errorMessage,    // Mensaje de error (si aplica)
 *   isActive,        // Boolean: true si hay transición activa
 *   showLogin,       // Función: Activar transición de login
 *   showLogout,      // Función: Activar transición de logout
 *   showSuccess,     // Función: Mostrar estado de éxito
 *   showError,       // Función: Mostrar estado de error
 *   hide,            // Función: Ocultar transición
 * }
 */
export function useAuthTransition() {
  const [state, setState] = useState(AUTH_TRANSITION_STATES.IDLE);
  const [errorMessage, setErrorMessage] = useState(null);

  // Verificar sessionStorage al montar (solo en cliente)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') return;

    const storedState = sessionStorage.getItem('__auth_transition_state__');
    const storedError = sessionStorage.getItem('__auth_transition_error__');
    
    if (storedState && Object.values(AUTH_TRANSITION_STATES).includes(storedState)) {
      setState(storedState);
    }
    
    if (storedError) {
      setErrorMessage(storedError);
    }
  }, []);

  // Sincronizar con sessionStorage cuando cambia el estado
  useEffect(() => {
    if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') return;

    if (state === AUTH_TRANSITION_STATES.IDLE) {
      sessionStorage.removeItem('__auth_transition_state__');
      sessionStorage.removeItem('__auth_transition_error__');
    } else {
      sessionStorage.setItem('__auth_transition_state__', state);
      if (errorMessage) {
        sessionStorage.setItem('__auth_transition_error__', errorMessage);
      } else {
        sessionStorage.removeItem('__auth_transition_error__');
      }
    }
  }, [state, errorMessage]);

  /**
   * Activar transición de login
   */
  const showLogin = useCallback(() => {
    setState(AUTH_TRANSITION_STATES.LOGIN);
    setErrorMessage(null);
  }, []);

  /**
   * Activar transición de logout
   */
  const showLogout = useCallback(() => {
    setState(AUTH_TRANSITION_STATES.LOGOUT);
    setErrorMessage(null);
  }, []);

  /**
   * Mostrar estado de éxito
   */
  const showSuccess = useCallback(() => {
    setState(AUTH_TRANSITION_STATES.SUCCESS);
    setErrorMessage(null);
  }, []);

  /**
   * Mostrar estado de error
   * 
   * @param {string} message - Mensaje de error a mostrar
   */
  const showError = useCallback((message = 'Error de autenticación') => {
    setState(AUTH_TRANSITION_STATES.ERROR);
    setErrorMessage(message);
  }, []);

  /**
   * Ocultar transición y limpiar estado
   */
  const hide = useCallback(() => {
    setState(AUTH_TRANSITION_STATES.IDLE);
    setErrorMessage(null);
  }, []);

  return {
    state,
    setState,
    errorMessage,
    isActive: state !== AUTH_TRANSITION_STATES.IDLE,
    showLogin,
    showLogout,
    showSuccess,
    showError,
    hide,
  };
}

