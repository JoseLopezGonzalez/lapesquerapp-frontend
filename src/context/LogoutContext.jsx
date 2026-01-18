"use client";

import * as React from "react";
import { LogoutDialog } from "@/components/Utilities/LogoutDialog";

const LogoutContext = React.createContext({
  isLoggingOut: false,
  setIsLoggingOut: () => {},
});

export function LogoutProvider({ children }) {
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  // Log para debug (puedes removerlo después)
  React.useEffect(() => {
    if (isLoggingOut) {
      console.log('🔐 LogoutContext: Diálogo de logout abierto');
    }
  }, [isLoggingOut]);

  return (
    <LogoutContext.Provider value={{ isLoggingOut, setIsLoggingOut }}>
      {children}
      <LogoutDialog open={isLoggingOut} />
    </LogoutContext.Provider>
  );
}

export function useLogout() {
  const context = React.useContext(LogoutContext);
  if (!context) {
    // Si no hay contexto, retornar valores por defecto (no lanzar error para evitar crashes)
    return {
      isLoggingOut: false,
      setIsLoggingOut: () => {
        console.warn('useLogout: LogoutProvider no encontrado');
      },
    };
  }
  return context;
}

