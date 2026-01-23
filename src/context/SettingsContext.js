"use client";
import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { getSettings } from "@/services/settingsService";
import { invalidateSettingsCache } from "@/helpers/getSettingValue";
import { isAuthError } from "@/configs/authConfig";
import { useSession } from "next-auth/react";
import { getCurrentTenant } from "@/lib/utils/getCurrentTenant";

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();
  
  // Usar accessToken en lugar del objeto session completo para evitar cambios de referencia
  const accessToken = session?.user?.accessToken;
  
  // Obtener tenant actual (solo en cliente)
  const currentTenant = typeof window !== 'undefined' ? getCurrentTenant() : null;
  
  // Ref para prevenir múltiples llamadas simultáneas y rastrear errores
  const isLoadingRef = useRef(false);
  const hasErrorRef = useRef(false);
  const lastTokenRef = useRef(null);
  const lastTenantRef = useRef(null);

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
      lastTenantRef.current = null;
      return;
    }

    // Si no hay tenant (solo puede pasar en servidor), no cargar settings
    if (!currentTenant) {
      return;
    }

    // Si el tenant cambió, limpiar settings y caché del tenant anterior
    if (lastTenantRef.current && lastTenantRef.current !== currentTenant) {
      console.log(`[SettingsProvider] Tenant cambió de ${lastTenantRef.current} a ${currentTenant}, limpiando settings`);
      setSettings(null);
      invalidateSettingsCache(lastTenantRef.current);
      hasErrorRef.current = false; // Resetear error al cambiar tenant
    }

    // Prevenir llamadas múltiples simultáneas
    if (isLoadingRef.current) {
      return;
    }

    // Si el token y tenant no cambiaron y ya hay un error previo, no reintentar automáticamente
    // (evita loops infinitos con errores 500)
    if (lastTokenRef.current === accessToken && 
        lastTenantRef.current === currentTenant && 
        hasErrorRef.current) {
      return;
    }

    // Si el token o tenant cambió, resetear el flag de error
    if (lastTokenRef.current !== accessToken || lastTenantRef.current !== currentTenant) {
      hasErrorRef.current = false;
      lastTokenRef.current = accessToken;
      lastTenantRef.current = currentTenant;
    }

    // Marcar como cargando y hacer la llamada
    isLoadingRef.current = true;
    setLoading(true);

    getSettings()
      .then((data) => {
        // console.log(`[SettingsProvider] Settings recibidos para tenant ${currentTenant}:`, data);
        setSettings(data);
        hasErrorRef.current = false; // Resetear flag de error en éxito
      })
      .catch((err) => {
        console.error(`[SettingsProvider] Error al obtener settings para tenant ${currentTenant}:`, err);
        
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
  }, [status, accessToken, currentTenant]); // Incluir currentTenant en dependencias

  // Cuando se actualizan los settings, invalidamos el caché del tenant actual
  const updateSettingsContext = (newSettings) => {
    setSettings(newSettings);
    // Invalidar caché del tenant actual (o todos si no se puede obtener tenant)
    invalidateSettingsCache(currentTenant);
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