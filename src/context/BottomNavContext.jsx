"use client";

import React, { createContext, useContext, useState } from 'react';

/**
 * BottomNavContext - Context para controlar la visibilidad del bottom navbar
 * 
 * Permite que cualquier componente hijo pueda ocultar/mostrar el bottom navbar
 * de forma genérica sin necesidad de modificar el layout principal.
 */

const BottomNavContext = createContext({
  hideBottomNav: false,
  setHideBottomNav: () => {},
});

/**
 * BottomNavProvider - Provider del context
 * 
 * @param {object} props
 * @param {React.ReactNode} props.children - Componentes hijos
 */
export function BottomNavProvider({ children }) {
  const [hideBottomNav, setHideBottomNav] = useState(false);

  return (
    <BottomNavContext.Provider value={{ hideBottomNav, setHideBottomNav }}>
      {children}
    </BottomNavContext.Provider>
  );
}

/**
 * useBottomNav - Hook para acceder al context del bottom navbar
 * 
 * @returns {object} { hideBottomNav, setHideBottomNav }
 */
export function useBottomNav() {
  const context = useContext(BottomNavContext);
  if (!context) {
    throw new Error('useBottomNav must be used within a BottomNavProvider');
  }
  return context;
}

/**
 * useHideBottomNav - Hook simplificado para ocultar/mostrar el bottom navbar
 * 
 * @param {boolean} hide - Si true, oculta el bottom navbar. Si false, lo muestra.
 * 
 * @example
 * // En un componente:
 * useHideBottomNav(true); // Oculta el bottom navbar
 * useHideBottomNav(false); // Muestra el bottom navbar
 */
export function useHideBottomNav(hide = true) {
  const { setHideBottomNav } = useBottomNav();

  React.useEffect(() => {
    setHideBottomNav(hide);
    
    // Cleanup: restaurar el bottom navbar cuando el componente se desmonte
    return () => {
      setHideBottomNav(false);
    };
  }, [hide, setHideBottomNav]);
}
