"use client";

import * as React from "react";
import { LogoutDialog } from "@/components/Utilities/LogoutDialog";

interface LogoutContextValue {
  isLoggingOut: boolean;
  setIsLoggingOut: (value: boolean) => void;
}

const LogoutContext = React.createContext<LogoutContextValue>({
  isLoggingOut: false,
  setIsLoggingOut: () => {},
});

interface LogoutProviderProps {
  children: React.ReactNode;
}

export function LogoutProvider({ children }: LogoutProviderProps) {
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  React.useEffect(() => {
    if (isLoggingOut) {
      console.log("🔐 LogoutContext: Diálogo de logout abierto");
    }
  }, [isLoggingOut]);

  return (
    <LogoutContext.Provider value={{ isLoggingOut, setIsLoggingOut }}>
      {children}
      <LogoutDialog open={isLoggingOut} />
    </LogoutContext.Provider>
  );
}

export function useLogout(): LogoutContextValue {
  const context = React.useContext(LogoutContext);
  if (!context) {
    return {
      isLoggingOut: false,
      setIsLoggingOut: () => {
        console.warn("useLogout: LogoutProvider no encontrado");
      },
    };
  }
  return context;
}
