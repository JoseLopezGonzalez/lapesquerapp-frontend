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

    console.error('🌐 Tenant detectado (servidor):', tenant);
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
    // Manejo específico para errores de autenticación
    if (isAuthStatusCode(res.status)) {
      console.error('❌ Error de autenticación (401/403): Sesión expirada o token inválido');
      throw new Error('No autenticado');
    }

    try {
      // Clonar la respuesta para poder leer el body
      const responseClone = res.clone();
      const errorJson = await responseClone.json();
      console.error('❌ Error JSON recibido:', errorJson);
      
      // Verificar si el error contiene mensaje de autenticación
      if (isAuthError({ message: errorJson.message })) {
        throw new Error('No autenticado');
      }
      
      const errorText = errorJson.message || JSON.stringify(errorJson);
      throw new Error(errorText || 'Error inesperado en la solicitud');
    } catch (e) {
      // Si ya es un error de autenticación, re-lanzarlo
      if (e.message === 'No autenticado') {
        throw e;
      }
      
      // Si no es JSON, intentar leer como texto
      try {
        const responseClone = res.clone();
        const rawText = await responseClone.text();
        console.error('❌ Respuesta no es JSON o error de parseo. Texto recibido:', rawText);
        
        // Verificar si el texto contiene indicadores de error de autenticación
        if (isAuthError({ message: rawText })) {
          throw new Error('No autenticado');
        }
        
        throw new Error(`Error en la respuesta de la API: ${rawText}`);
      } catch (textError) {
        // Si tampoco se puede leer como texto, crear un error genérico
        throw new Error(`Error HTTP ${res.status}: ${res.statusText}`);
      }
    }
  }

  return res;
}
