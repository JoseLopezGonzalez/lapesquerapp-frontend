/**
 * Obtiene el tenant actual desde window.location.host
 * 
 * @returns {string} El nombre del tenant (ej: 'brisamar', 'pymcolorao')
 * 
 * @example
 * const tenant = getCurrentTenant(); // 'brisamar' o 'pymcolorao'
 */
export function getCurrentTenant() {
  if (typeof window === 'undefined') {
    // En el servidor, retornar null o lanzar error
    // El tenant debe obtenerse desde headers en el servidor
    return null;
  }

  const clientHost = window.location.host;
  const parts = clientHost.split('.');
  const isLocal = clientHost.includes('localhost');

  const tenant = isLocal
    ? parts.length > 1 && parts[0] !== 'localhost' ? parts[0] : 'brisamar'
    : parts[0];

  return tenant;
}

