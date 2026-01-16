"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { getSettings } from "@/services/settingsService";
import { invalidateSettingsCache } from "@/helpers/getSettingValue";
import { isAuthError } from "@/configs/authConfig";
import { useSession } from "next-auth/react";

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();

  useEffect(() => {
    // Solo cargar settings si hay una sesión activa
    if (status === "loading") {
      // Esperar a que la sesión se cargue
      return;
    }

    if (status === "unauthenticated" || !session) {
      // No hay sesión, establecer settings vacío y dejar de cargar
      setSettings({});
      setLoading(false);
      return;
    }

    // Hay sesión, cargar settings
    getSettings()
      .then((data) => {
        // console.log("[SettingsProvider] Settings recibidos:", data);
        setSettings(data);
      })
      .catch((err) => {
        console.error("[SettingsProvider] Error al obtener settings:", err);
        
        // Para errores de autenticación, el AuthErrorInterceptor se encargará de la redirección
        // Para otros errores, establecer settings vacío
        if (!isAuthError(err)) {
          setSettings({});
        }
      })
      .finally(() => setLoading(false));
  }, [session, status]);

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