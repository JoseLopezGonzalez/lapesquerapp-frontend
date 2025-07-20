// src/lib/fetchWithTenant.js

// NO importamos `headers` directamente aquí a nivel superior.
// Se importará condicionalmente dentro de la función para el lado del servidor.

export async function fetchWithTenant(url, options = {}) {
  let tenant = 'brisamar'; // Valor por defecto del tenant

  // --- Lógica de Detección y Asignación del Tenant ---
  // Detecta si el código se está ejecutando en el servidor (Node.js) o en el cliente (navegador).
  if (typeof window === 'undefined') {
    // Estamos en el SERVIDOR (Node.js/Edge Runtime del Middleware).
    // Aquí es donde `next/headers` está disponible y `window` NO existe.
    // Importación dinámica para asegurar que `next/headers` solo se cargue en el servidor.
    const { headers } = await import('next/headers'); // Importación a nivel de función/bloque
    const headersList = headers();
    const host = headersList.get('host'); // Obtiene el host de los encabezados de la solicitud del servidor

    tenant =
      process.env.NODE_ENV === 'development'
        ? 'brisamar' // En desarrollo, usa un tenant fijo (ej. para pruebas locales)
        : host?.split('.')[0] || 'brisamar'; // En producción, obtiene el tenant del subdominio o usa el por defecto

    console.error('🌐 Tenant detectado (servidor):', tenant); // Esto aparecerá en los logs del servidor
  } else {
    // Estamos en el CLIENTE (Navegador).
    // Aquí es donde `window` existe y `next/headers` NO está disponible.
    const clientHost = window.location.host; // Obtiene el host de la URL actual del navegador
    tenant =
      process.env.NODE_ENV === 'development'
        ? 'brisamar'
        : clientHost?.split('.')[0] || 'brisamar'; // Usa el subdominio del navegador como tenant

    console.log('🌐 Tenant detectado (cliente):', tenant); // Esto aparecerá en la consola del navegador
  }

  // --- Logging de depuración ---
  console.log(`➡️ URL de fetch: ${url}`);
  console.log('📦 Opciones de fetch (originales):', options);

  // --- Construcción de Encabezados Personalizados ---
  const customHeaders = {
    ...(options.headers || {}), // Mantiene cualquier encabezado ya proporcionado en `options`
    'X-Tenant': tenant, // Añade o sobrescribe el encabezado 'X-Tenant'
    'Content-Type': options.headers?.['Content-Type'] || 'application/json', // Establece Content-Type, permitiendo sobrescribir
    // Define el User-Agent: Si estamos en el cliente usa navigator.userAgent, si no, un string para el servidor.
    'User-Agent': typeof window !== 'undefined' ? navigator.userAgent : 'Node.js Fetch/Next.js',
  };

  // --- Configuración final para la solicitud fetch ---
  const config = {
    ...options, // Mantiene todas las demás opciones de fetch (method, body, cache, etc.)
    headers: customHeaders, // Aplica los encabezados personalizados
  };

  // --- Realiza la solicitud fetch ---
  const res = await fetch(url, config);

  // --- Manejo de la Respuesta y Errores ---
  if (!res.ok) {
    // Si la respuesta no es exitosa (ej. 4xx, 5xx)
    try {
      const errorJson = await res.json(); // Intenta parsear la respuesta como JSON
      console.error('❌ Error JSON recibido:', errorJson);
      const errorText = errorJson.message || JSON.stringify(errorJson);
      throw new Error(errorText || 'Error inesperado en la solicitud');
    } catch (e) {
      // Si la respuesta no es un JSON válido o hay otro error al parsear
      const rawText = await res.text(); // Lee la respuesta como texto plano
      console.error('❌ Respuesta no es JSON o error de parseo. Texto recibido:', rawText);
      throw new Error(`Error en la respuesta de la API: ${rawText}`);
    }
  }

  return res; // Devuelve la respuesta si todo fue bien
}