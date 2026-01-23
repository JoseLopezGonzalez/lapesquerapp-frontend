import { getSettings } from "@/services/settingsService";
import { getCurrentTenant } from "@/lib/utils/getCurrentTenant";

// Caché por tenant: { 'brisamar': {...}, 'pymcolorao': {...} }
let cachedSettingsByTenant = {};

/**
 * Obtiene el valor de un setting por clave
 * El caché está separado por tenant para evitar mezcla de datos
 * 
 * @param {string} key - Clave del setting (ej: 'company.name')
 * @param {boolean} forceRefresh - Si true, fuerza recarga desde API
 * @returns {Promise<any>} Valor del setting o undefined
 */
export async function getSettingValue(key, forceRefresh = false) {
  const tenant = getCurrentTenant();
  
  if (!tenant) {
    console.warn('[getSettingValue] No se pudo obtener tenant, intentando obtener settings sin caché');
    const settings = await getSettings();
    return settings?.[key];
  }

  // Si no hay caché para este tenant o se fuerza refresh, cargar desde API
  if (!cachedSettingsByTenant[tenant] || forceRefresh) {
    cachedSettingsByTenant[tenant] = await getSettings();
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