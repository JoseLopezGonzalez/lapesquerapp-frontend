import { isAuthError, isAuthStatusCode } from '@/configs/authConfig';

export async function fetchWithTenant(url, options = {}, reqHeaders = null) {
  let tenant = 'brisamar'; // Valor por defecto si no se detecta ninguno

  if (typeof window === 'undefined') {
    // ---- SERVIDOR ----
    let host;
    
    // Si se pasan headers desde el middleware, usarlos directamente
    if (reqHeaders) {
      host = reqHeaders.get('host');
    } else {
      // En otros contextos del servidor, usar headers() de next/headers
      try {
        const { headers } = await import('next/headers');
        const headersList = await headers(); // En Next.js 16, headers() devuelve una Promise
        host = headersList.get('host');
      } catch (error) {
        // Si falla (por ejemplo, en middleware), intentar obtener del URL
        console.warn('⚠️ No se pudo obtener headers, usando valor por defecto');
      }
    }

    if (host) {
      const parts = host.split('.');
      const isLocal = host.includes('localhost');
      tenant = isLocal
        ? parts.length > 1 && parts[0] !== 'localhost' ? parts[0] : 'brisamar'
        : host.split('.')[0];
    }

    console.log('🌐 Tenant detectado (servidor):', tenant);
  } else {
    // ---- CLIENTE ----
    const clientHost = window.location.host;
    const parts = clientHost.split('.');
    const isLocal = clientHost.includes('localhost');

    tenant = isLocal
      ? parts.length > 1 && parts[0] !== 'localhost' ? parts[0] : 'brisamar'
      : parts[0];

    // console.log('🌐 Tenant detectado (cliente):', tenant);
  }

  // --- Headers personalizados ---
  const customHeaders = {
    ...(options.headers || {}),
    'X-Tenant': tenant,
    'Content-Type': options.headers?.['Content-Type'] || 'application/json',
    'User-Agent': typeof window !== 'undefined' ? navigator.userAgent : 'Node.js Fetch/Next.js',
  };

  const config = {
    ...options,
    headers: customHeaders,
  };

  const res = await fetch(url, config);

  if (!res.ok) {
    // Verificar si hay un logout en curso ANTES de procesar el error
    const isLoggingOut = typeof window !== 'undefined' && 
                         typeof sessionStorage !== 'undefined' && 
                         sessionStorage.getItem('__is_logging_out__') === 'true';
    
    // Si es una llamada al endpoint /logout, permitir que continúe aunque devuelva 401/403
    // ya que es esperado cuando se está cerrando sesión
    const urlString = typeof url === 'string' ? url : (url?.href || url?.url || '');
    const isLogoutRequest = urlString.includes('/logout') || urlString.endsWith('logout');
    
    // Si es un error de autenticación (401/403)
    if (isAuthStatusCode(res.status)) {
      // Si es logout O hay un logout en curso, no tratarlo como error
      if (isLogoutRequest || isLoggingOut) {
        // Solo loguear sin lanzar error para que el logout continúe
        if (isLogoutRequest) {
          console.log('ℹ️ Logout: respuesta 401/403 esperada al revocar token');
        } else if (isLoggingOut) {
          console.log('ℹ️ Logout en curso: ignorando error 401/403');
        }
        return res; // Retornar la respuesta sin lanzar error
      }
      
      // Solo mostrar error si NO es logout ni hay logout en curso
      console.error('❌ Error de autenticación (401/403): Sesión expirada o token inválido');
      throw new Error('No autenticado');
    }

    try {
      // Clonar la respuesta para poder leer el body sin consumir el original
      const responseClone = res.clone();
      const contentType = res.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      let errorJson = {};
      let errorText = '';
      
      if (isJson) {
        try {
          // Intentar leer como JSON
          errorText = await responseClone.text();
          if (errorText && errorText.trim()) {
            errorJson = JSON.parse(errorText);
          } else {
            // Si el body está vacío, usar un objeto vacío
            errorJson = {};
          }
        } catch (parseError) {
          console.error('❌ Error al parsear JSON del error:', parseError);
          console.error('❌ Texto recibido:', errorText);
          // Si falla el parseo, usar el texto como mensaje
          throw new Error(errorText || `Error HTTP ${res.status}: ${res.statusText}`);
        }
      } else {
        // Si no es JSON, leer como texto
        errorText = await responseClone.text();
        console.error('❌ Respuesta de error (no JSON):', errorText);
        throw new Error(errorText || `Error HTTP ${res.status}: ${res.statusText}`);
      }
      
      console.error('❌ Error JSON recibido:', errorJson);
      
      // Verificar si hay un logout en curso antes de lanzar errores de autenticación
      const isLoggingOut = typeof window !== 'undefined' && 
                           typeof sessionStorage !== 'undefined' && 
                           sessionStorage.getItem('__is_logging_out__') === 'true';
      
      // Verificar si el error contiene mensaje de autenticación
      if (isAuthError({ message: errorJson.message })) {
        // Si hay un logout en curso, no lanzar error
        if (isLoggingOut) {
          console.log('ℹ️ Logout en curso: ignorando error de autenticación');
          return res; // Retornar la respuesta sin lanzar error
        }
        throw new Error('No autenticado');
      }
      
      // Priorizar userMessage sobre message para mostrar errores en formato natural
      const finalErrorMessage = errorJson.userMessage || errorJson.message || `Error HTTP ${res.status}: ${res.statusText}`;
      
      // Crear un error que preserve la información completa del error
      const error = new Error(finalErrorMessage);
      error.status = res.status;
      error.data = errorJson;
      throw error;
    } catch (e) {
      // Si ya es un error de autenticación, re-lanzarlo
      if (e.message === 'No autenticado') {
        throw e;
      }
      
      // Si el error ya tiene un mensaje útil (no es un error de parseo genérico), re-lanzarlo
      if (e.message && !e.message.startsWith('Error HTTP')) {
        throw e;
      }
      
      // Si no se pudo leer el body, crear un error genérico
      throw new Error(`Error HTTP ${res.status}: ${res.statusText}`);
    }
  }

  return res;
}
