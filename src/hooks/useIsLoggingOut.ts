"use client";

import { useState, useEffect } from "react";

/**
 * Hook que verifica si hay un logout en curso
 * Verifica sessionStorage de forma síncrona para evitar renders intermedios
 */
export function useIsLoggingOut(): boolean {
  const [isLoggingOut, setIsLoggingOut] = useState(() => {
    if (typeof window === "undefined" || typeof sessionStorage === "undefined") {
      return false;
    }
    return sessionStorage.getItem("__is_logging_out__") === "true";
  });

  useEffect(() => {
    const checkLogout = () => {
      if (typeof sessionStorage !== "undefined") {
        const flag = sessionStorage.getItem("__is_logging_out__") === "true";
        setIsLoggingOut((prev) => (prev !== flag ? flag : prev));
      }
    };
    checkLogout();
    const interval = setInterval(checkLogout, 100);
    return () => clearInterval(interval);
  }, []);

  return isLoggingOut;
}
