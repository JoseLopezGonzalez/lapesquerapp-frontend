import { isAuthError, isAuthStatusCode, AUTH_ERROR_CONFIG } from '@/configs/authConfig';

export async function fetchWithTenant(url, options = {}, reqHeaders = null) {
  // En desarrollo (localhost) usar tenant 'dev'; en producción por subdominio o 'brisamar'
  const DEFAULT_DEV_TENANT = 'dev';
  let tenant = 'brisamar';

  if (typeof window === 'undefined') {
    // ---- SERVIDOR ----
    let host;

    if (reqHeaders) {
      host = reqHeaders.get('host');
    } else {
      try {
        const { headers } = await import('next/headers');
        const headersList = await headers();
        host = headersList.get('host');
      } catch (error) {
        console.warn('⚠️ No se pudo obtener headers, usando valor por defecto');
      }
    }

    if (host) {
      const parts = host.split('.');
      const isLocal = host.includes('localhost');
      tenant = isLocal
        ? (parts.length > 1 && parts[0] !== 'localhost' ? parts[0] : DEFAULT_DEV_TENANT)
        : host.split('.')[0];
    }

    console.log('🌐 Tenant detectado (servidor):', tenant);
  } else {
    // ---- CLIENTE ----
    const clientHost = window.location.host;
    const parts = clientHost.split('.');
    const isLocal = clientHost.includes('localhost');

    tenant = isLocal
      ? (parts.length > 1 && parts[0] !== 'localhost' ? parts[0] : DEFAULT_DEV_TENANT)
      : parts[0];
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
    
    // Leer el cuerpo de la respuesta una sola vez
    const responseClone = res.clone();
    const contentType = res.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    
    let errorJson = {};
    let errorText = '';
    
    // Leer el cuerpo de la respuesta
    try {
      if (isJson) {
        errorText = await responseClone.text();
        if (errorText && errorText.trim()) {
          errorJson = JSON.parse(errorText);
        }
      } else {
        errorText = await responseClone.text();
      }
    } catch (parseError) {
      // Si falla el parseo, continuar con errorJson vacío
      console.warn('⚠️ No se pudo parsear la respuesta de error:', parseError);
    }
    
    // Si es un error de autenticación (401/403), verificar el tipo de error
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
      
      // Verificar si el mensaje indica que es un error de validación del backend
      // (no un error de sesión expirada)
      const errorMessage = (errorJson.message || errorJson.userMessage || '').toLowerCase();
      const isValidationError = errorMessage.includes('validation') ||
                               errorMessage.includes('validación') ||
                               errorMessage.includes('invalid') ||
                               errorMessage.includes('inválido') ||
                               errorMessage.includes('required') ||
                               errorMessage.includes('requerido') ||
                               errorMessage.includes('error al crear') ||
                               errorMessage.includes('error al registrar') ||
                               errorMessage.includes('employee') ||
                               errorMessage.includes('empleado') ||
                               errorMessage.includes('timestamp') ||
                               errorMessage.includes('event_type') ||
                               errorMessage.includes('requieren autenticación') ||
                               errorMessage.includes('require authentication') ||
                               errorMessage.includes('fichajes manuales');
      
      // Si es un error de validación, NO lanzar "No autenticado"
      // Permitir que el error se propague con el mensaje real del backend
      if (!isValidationError) {
        // En cliente: no lanzar para evitar que el overlay/consola muestre el error.
        // Se dispara un evento que AuthErrorInterceptor escucha (toast + signOut + redirect).
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent(AUTH_ERROR_CONFIG.AUTH_SESSION_EXPIRED_EVENT));
          return res;
        }
        // En servidor: lanzar para que API routes etc. reciban el error
        const err = new Error('No autenticado');
        err.status = res.status;
        err.code = 'UNAUTHENTICATED';
        throw err;
      }
      // Si es un error de validación, continuar con el flujo normal de manejo de errores
    }

    // Procesar el error normalmente (para todos los códigos de error, incluyendo 401/403 de validación)
    try {
      console.error('❌ Error JSON recibido:', errorJson);
      
      // Verificar si hay un logout en curso antes de lanzar errores de autenticación
      const isLoggingOut2 = typeof window !== 'undefined' && 
                           typeof sessionStorage !== 'undefined' && 
                           sessionStorage.getItem('__is_logging_out__') === 'true';
      
      // Verificar si el error contiene mensaje de autenticación (solo si NO es 401/403 ya procesado)
      if (!isAuthStatusCode(res.status) && isAuthError({ message: errorJson.message })) {
        // Si hay un logout en curso, no lanzar error
        if (isLoggingOut2) {
          console.log('ℹ️ Logout en curso: ignorando error de autenticación');
          return res; // Retornar la respuesta sin lanzar error
        }
        const err = new Error('No autenticado');
        err.status = res.status;
        err.code = 'UNAUTHENTICATED';
        throw err;
      }
      
      // Priorizar userMessage sobre message para mostrar errores en formato natural
      const finalErrorMessage = errorJson.userMessage || errorJson.message || errorText || `Error HTTP ${res.status}: ${res.statusText}`;
      
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
