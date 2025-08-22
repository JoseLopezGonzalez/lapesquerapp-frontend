// Configuración para el manejo de errores de autenticación
export const AUTH_ERROR_CONFIG = {
  // Mensajes de error que indican problemas de autenticación
  AUTH_ERROR_MESSAGES: [
    'No autenticado',
    'Unauthorized',
    '401',
    'Token',
    'Sesión expirada',
    'Session expired',
    'Invalid token',
    'Token expired'
  ],
  
  // Tiempo de delay antes de redirigir (en milisegundos)
  REDIRECT_DELAY: 1500,
  
  // URL de redirección por defecto
  DEFAULT_LOGIN_URL: '/',
  
  // Parámetro para guardar la página actual
  FROM_PARAM: 'from'
};

// Función para verificar si un error es de autenticación
export function isAuthError(error) {
  if (!error || !error.message) return false;
  
  const message = error.message.toLowerCase();
  return AUTH_ERROR_CONFIG.AUTH_ERROR_MESSAGES.some(
    authMessage => message.includes(authMessage.toLowerCase())
  );
}

// Función para verificar si un status code es de autenticación
export function isAuthStatusCode(status) {
  return status === 401 || status === 403;
}

// Función para construir la URL de login con parámetro from
export function buildLoginUrl(currentPath = '') {
  const url = new URL(AUTH_ERROR_CONFIG.DEFAULT_LOGIN_URL, window.location.origin);
  if (currentPath) {
    url.searchParams.set(AUTH_ERROR_CONFIG.FROM_PARAM, currentPath);
  }
  return url.toString();
}
