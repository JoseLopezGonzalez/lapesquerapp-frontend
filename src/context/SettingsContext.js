"use client";
import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { getSettings } from "@/services/settingsService";
import { invalidateSettingsCache } from "@/helpers/getSettingValue";
import { isAuthError } from "@/configs/authConfig";
import { useSession } from "next-auth/react";

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();
  
  // Usar accessToken en lugar del objeto session completo para evitar cambios de referencia
  const accessToken = session?.user?.accessToken;
  
  // Ref para prevenir múltiples llamadas simultáneas y rastrear errores
  const isLoadingRef = useRef(false);
  const hasErrorRef = useRef(false);
  const lastTokenRef = useRef(null);

  useEffect(() => {
    // Solo cargar settings si hay una sesión activa
    if (status === "loading") {
      // Esperar a que la sesión se cargue
      return;
    }

    if (status === "unauthenticated" || !accessToken) {
      // No hay sesión, establecer settings vacío y dejar de cargar
      setSettings({});
      setLoading(false);
      isLoadingRef.current = false;
      hasErrorRef.current = false;
      lastTokenRef.current = null;
      return;
    }

    // Prevenir llamadas múltiples simultáneas
    if (isLoadingRef.current) {
      return;
    }

    // Si el token no cambió y ya hay un error previo, no reintentar automáticamente
    // (evita loops infinitos con errores 500)
    if (lastTokenRef.current === accessToken && hasErrorRef.current) {
      return;
    }

    // Si el token cambió, resetear el flag de error
    if (lastTokenRef.current !== accessToken) {
      hasErrorRef.current = false;
      lastTokenRef.current = accessToken;
    }

    // Marcar como cargando y hacer la llamada
    isLoadingRef.current = true;
    setLoading(true);

    getSettings()
      .then((data) => {
        // console.log("[SettingsProvider] Settings recibidos:", data);
        setSettings(data);
        hasErrorRef.current = false; // Resetear flag de error en éxito
      })
      .catch((err) => {
        console.error("[SettingsProvider] Error al obtener settings:", err);
        
        // Para errores de autenticación, el AuthErrorInterceptor se encargará de la redirección
        // Para otros errores (incluyendo 500), establecer settings vacío y marcar error
        if (!isAuthError(err)) {
          setSettings({});
          // Marcar que hubo un error para prevenir reintentos infinitos
          // Solo marcar error si es un error del servidor (5xx) o de red
          const isServerError = err?.status >= 500 || err?.status === undefined;
          if (isServerError) {
            hasErrorRef.current = true;
          }
        }
      })
      .finally(() => {
        setLoading(false);
        isLoadingRef.current = false;
      });
  }, [status, accessToken]); // Usar accessToken en lugar de session completo

  // Cuando se actualizan los settings, invalidamos el caché global
  const updateSettingsContext = (newSettings) => {
    setSettings(newSettings);
    invalidateSettingsCache();
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, setSettings: updateSettingsContext }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
} 