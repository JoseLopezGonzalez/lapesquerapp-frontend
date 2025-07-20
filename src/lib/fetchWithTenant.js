export async function fetchWithTenant(url, options = {}) {
  let tenant = 'brisamar'; // Valor por defecto si no se detecta ninguno

  if (typeof window === 'undefined') {
    // ---- SERVIDOR ----
    const { headers } = await import('next/headers');
    const headersList = headers();
    const host = headersList.get('host');

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

    console.log('🌐 Tenant detectado (cliente):', tenant);
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
    try {
      const errorJson = await res.json();
      console.error('❌ Error JSON recibido:', errorJson);
      const errorText = errorJson.message || JSON.stringify(errorJson);
      throw new Error(errorText || 'Error inesperado en la solicitud');
    } catch (e) {
      const rawText = await res.text();
      console.error('❌ Respuesta no es JSON o error de parseo. Texto recibido:', rawText);
      throw new Error(`Error en la respuesta de la API: ${rawText}`);
    }
  }

  return res;
}
