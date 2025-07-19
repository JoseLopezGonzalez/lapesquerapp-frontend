import { headers } from 'next/headers';

export async function fetchWithTenant(url, options = {}) {
  const headersList = headers();
  const host = headersList.get('host'); // ej. brisamar.lapesquerapp.es

  const tenant =
    process.env.NODE_ENV === 'development'
      ? 'brisamar'
      : host?.split('.')[0] || 'brisamar';

  console.error('🌐 Tenant detectado (servidor):', tenant);
  console.log(`➡️ URL de fetch: ${url}`);
  console.log('📦 Opciones de fetch:', options);

  const customHeaders = {
    ...(options.headers || {}),
    'X-Tenant': tenant,
    'Content-Type': 'application/json',
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
      console.error('❌ Respuesta no es JSON. Texto recibido:', rawText);
      throw new Error(`Respuesta no JSON: ${rawText}`);
    }
  }

  return res;
}
