export async function fetchWithTenant(url, options = {}) {
  const tenant = process.env.NODE_ENV === 'development'
  ? 'brisamar'
  : window.location.hostname.split('.')[0] || 'brisamar';

  console.log(`Fetching from tenant: ${tenant}`);
  console.log(`Fetching URL: ${url}`);
  console.log('Options:', options);

  const headers = {
    ...(options.headers || {}),
    'X-Tenant': tenant,
    'Content-Type': 'application/json',
  };

  const config = {
    ...options,
    headers,
  };

  const res = await fetch(url, config);

  if (!res.ok) {
    try {
      const errorJson = await res.json();
      console.error('Error JSON recibido:', errorJson);
      const errorText = errorJson.message || JSON.stringify(errorJson);
      throw new Error(errorText || 'Error inesperado en la solicitud');
    } catch (e) {
      const rawText = await res.text();
      console.error('Respuesta no es JSON. Texto recibido:', rawText);
      throw new Error(`Respuesta no JSON: ${rawText}`);
    }
  }


  return res;
}
