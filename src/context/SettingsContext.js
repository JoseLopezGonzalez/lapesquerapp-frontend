"use client";
import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { getSettings } from "@/services/settingsService";
import { invalidateSettingsCache } from "@/helpers/getSettingValue";
import { isAuthError } from "@/configs/authConfig";
import { useSession, signOut } from "next-auth/react";
import { getCurrentTenant } from "@/lib/utils/getCurrentTenant";

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
  const lastTenantRef = useRef(null);
  const [tenantKey, setTenantKey] = useState(0); // Forzar re-render cuando cambie el tenant
  
  // ID único para esta instancia del provider (útil para debugging)
  const instanceIdRef = useRef(
    typeof window !== 'undefined' 
      ? `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      : 'server'
  );

  // Listener para detectar cambios de tenant (navegación entre subdominios)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkTenantChange = () => {
      const currentTenant = getCurrentTenant();
      if (lastTenantRef.current && lastTenantRef.current !== currentTenant) {
        console.log(`[SettingsProvider] 🔄 Cambio de tenant detectado: ${lastTenantRef.current} → ${currentTenant}`);
        setTenantKey(prev => prev + 1); // Forzar re-render
      }
    };

    // Verificar cambios periódicamente (cada 2 segundos)
    // Esto es necesario porque no hay evento nativo para detectar cambios de subdominio
    const interval = setInterval(checkTenantChange, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Obtener tenant actual DENTRO del useEffect para asegurar que siempre sea el valor actual
    // Esto es crítico porque window.location puede cambiar entre renders
    // En producción, esto asegura que siempre se use el tenant correcto de la pestaña actual
    const currentTenant = typeof window !== 'undefined' ? getCurrentTenant() : null;

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
      console.warn('[SettingsProvider] No se pudo obtener tenant, no se cargarán settings');
      return;
    }

    // Si el tenant cambió, limpiar settings y caché del tenant anterior
    if (lastTenantRef.current && lastTenantRef.current !== currentTenant) {
      console.log(`[SettingsProvider:${instanceIdRef.current}] ⚠️ Tenant cambió de ${lastTenantRef.current} a ${currentTenant}, limpiando settings y caché`);
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

    // Verificar nuevamente el tenant antes de guardar los datos (doble verificación)
    const tenantAtSave = typeof window !== 'undefined' ? getCurrentTenant() : null;
    
    getSettings()
      .then((data) => {
        // Verificar que el tenant no haya cambiado mientras se cargaban los datos
        const tenantAfterLoad = typeof window !== 'undefined' ? getCurrentTenant() : null;
        
        if (tenantAfterLoad !== currentTenant) {
          console.warn(`[SettingsProvider:${instanceIdRef.current}] ⚠️ Tenant cambió durante la carga (${currentTenant} → ${tenantAfterLoad}), descartando datos`);
          return; // No guardar datos si el tenant cambió
        }
        if (data === null) return; // 401/403: auth ya gestionado por evento (toast + redirect)
        setSettings(data);
        hasErrorRef.current = false; // Resetear flag de error en éxito
      })
      .catch((err) => {
        console.error(`[SettingsProvider] Error al obtener settings para tenant ${currentTenant}:`, err);
        
        // Siempre dejar estado definido para no bloquear la UI (evita loader infinito)
        setSettings({});
        if (isAuthError(err)) {
          hasErrorRef.current = false;
          // Forzar signOut en cliente para que useSession() pase a "unauthenticated" y la home muestre login en vez de loader
          signOut({ redirect: false }).catch((e) => console.warn('[SettingsProvider] signOut:', e));
          return;
        }
        // Para otros errores (5xx, red), marcar error para prevenir reintentos infinitos
        const isServerError = err?.status >= 500 || err?.status === undefined;
        if (isServerError) {
          hasErrorRef.current = true;
        }
      })
      .finally(() => {
        setLoading(false);
        isLoadingRef.current = false;
      });
  }, [status, accessToken, tenantKey]); // Incluir tenantKey para re-ejecutar cuando cambie el tenant

  // Cuando se actualizan los settings, invalidamos el caché del tenant actual
  const updateSettingsContext = (newSettings) => {
    setSettings(newSettings);
    // Obtener tenant actual en el momento de la actualización
    const currentTenant = typeof window !== 'undefined' ? getCurrentTenant() : null;
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