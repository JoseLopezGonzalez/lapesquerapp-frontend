/**
 * Obtiene el tenant actual desde window.location.host
 * 
 * IMPORTANTE: Esta función debe llamarse dentro de useEffect o funciones que se ejecuten
 * en el momento de uso, no durante el render inicial, para asegurar que siempre obtenga
 * el tenant correcto de la pestaña/ventana actual.
 * 
 * @returns {string|null} El nombre del tenant (ej: 'brisamar', 'pymcolorao') o null si no se puede obtener
 * 
 * @example
 * useEffect(() => {
 *   const tenant = getCurrentTenant(); // Siempre obtiene el tenant actual
 *   // ...
 * }, []);
 */
export function getCurrentTenant() {
  if (typeof window === 'undefined') {
    // En el servidor, retornar null
    // El tenant debe obtenerse desde headers en el servidor
    return null;
  }

  try {
    // Usar window.location.host (incluye puerto) para mayor precisión
    const clientHost = window.location.host;
    const parts = clientHost.split('.');
    const isLocal = clientHost.includes('localhost');

    let tenant;
    if (isLocal) {
      // En localhost: brisamar.localhost:3000 → tenant: 'brisamar'
      tenant = parts.length > 1 && parts[0] !== 'localhost' ? parts[0] : 'brisamar';
    } else {
      // En producción: brisamar.lapesquerapp.es → tenant: 'brisamar'
      // pymcolorao.lapesquerapp.es → tenant: 'pymcolorao'
      tenant = parts[0];
    }

    // Validar que el tenant no esté vacío
    if (!tenant || tenant.trim() === '') {
      console.warn('[getCurrentTenant] Tenant vacío detectado, usando default: brisamar');
      return 'brisamar';
    }

    // Log en desarrollo para debugging (comentar en producción si es muy verboso)
    if (process.env.NODE_ENV === 'development') {
      // console.log(`[getCurrentTenant] Tenant detectado: ${tenant} desde ${clientHost}`);
    }

    return tenant;
  } catch (error) {
    console.error('[getCurrentTenant] Error al obtener tenant:', error);
    return null;
  }
}

