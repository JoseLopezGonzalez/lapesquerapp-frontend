import { getSettings } from "@/services/settingsService";
import { getCurrentTenant } from "@/lib/utils/getCurrentTenant";

// Caché por tenant: { 'brisamar': {...}, 'pymcolorao': {...} }
// IMPORTANTE: Este caché se comparte entre pestañas, pero está indexado por tenant
// Cada pestaña con el mismo tenant compartirá el caché (lo cual es correcto)
let cachedSettingsByTenant = {};

// Generar un ID único para esta instancia de la aplicación (útil para debugging)
const INSTANCE_ID = typeof window !== 'undefined' 
  ? `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  : 'server';

/**
 * Obtiene el valor de un setting por clave
 * El caché está separado por tenant para evitar mezcla de datos
 * 
 * @param {string} key - Clave del setting (ej: 'company.name')
 * @param {boolean} forceRefresh - Si true, fuerza recarga desde API
 * @returns {Promise<any>} Valor del setting o undefined
 */
export async function getSettingValue(key, forceRefresh = false) {
  // Obtener tenant en el momento de la ejecución (no durante el render)
  // Esto es crítico: siempre obtener el tenant actual, no uno cacheado
  const tenant = getCurrentTenant();
  
  if (!tenant) {
    console.warn(`[getSettingValue:${INSTANCE_ID}] No se pudo obtener tenant, intentando obtener settings sin caché`);
    const settings = await getSettings();
    if (settings === null) return undefined;
    return settings?.[key];
  }

  // Si no hay caché para este tenant o se fuerza refresh, cargar desde API
  if (!cachedSettingsByTenant[tenant] || forceRefresh) {
    // Obtener settings desde API (fetchWithTenant ya maneja el tenant correcto)
    const settings = await getSettings();
    if (settings === null) {
      invalidateSettingsCache(tenant);
      return undefined;
    }
    // Verificar nuevamente el tenant después de cargar (doble verificación de seguridad)
    const tenantAfterLoad = getCurrentTenant();
    if (tenantAfterLoad && tenantAfterLoad !== tenant) {
      console.warn(`[getSettingValue:${INSTANCE_ID}] ⚠️ Tenant cambió durante la carga (${tenant} → ${tenantAfterLoad}), guardando en tenant correcto`);
      // Guardar en el tenant correcto (el actual después de cargar)
      cachedSettingsByTenant[tenantAfterLoad] = settings;
      // Limpiar caché del tenant anterior si existe
      if (cachedSettingsByTenant[tenant]) {
        delete cachedSettingsByTenant[tenant];
      }
      return settings?.[key];
    }
    
    // Guardar en caché del tenant correcto
    cachedSettingsByTenant[tenant] = settings;
    // console.log(`[getSettingValue:${INSTANCE_ID}] Caché actualizado para tenant: ${tenant}`);
  }

  // Verificar una última vez antes de retornar (triple verificación)
  const tenantAtReturn = getCurrentTenant();
  if (tenantAtReturn && tenantAtReturn !== tenant) {
    console.warn(`[getSettingValue:${INSTANCE_ID}] ⚠️ Tenant cambió antes de retornar (${tenant} → ${tenantAtReturn})`);
    // Intentar obtener del tenant correcto
    if (cachedSettingsByTenant[tenantAtReturn]) {
      return cachedSettingsByTenant[tenantAtReturn]?.[key];
    }
    // Si no hay caché para el tenant actual, retornar undefined (no cargar para evitar loops)
    console.warn(`[getSettingValue:${INSTANCE_ID}] No hay caché para tenant ${tenantAtReturn}, retornando undefined`);
    return undefined;
  }

  return cachedSettingsByTenant[tenant]?.[key];
}

/**
 * Invalida el caché de settings para un tenant específico
 * Si no se especifica tenant, invalida el caché del tenant actual
 * 
 * @param {string|null} tenant - Tenant a invalidar (opcional, usa tenant actual si no se especifica)
 */
export function invalidateSettingsCache(tenant = null) {
  const tenantToInvalidate = tenant || getCurrentTenant();
  
  if (tenantToInvalidate) {
    delete cachedSettingsByTenant[tenantToInvalidate];
  } else {
    // Si no se puede obtener tenant, limpiar todo el caché (último recurso)
    console.warn('[invalidateSettingsCache] No se pudo obtener tenant, limpiando todo el caché');
    cachedSettingsByTenant = {};
  }
}

/**
 * Limpia todo el caché de settings (todos los tenants)
 * Útil para limpieza completa o debugging
 */
export function clearAllSettingsCache() {
  cachedSettingsByTenant = {};
} 