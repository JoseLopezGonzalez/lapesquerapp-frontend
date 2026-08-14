import { API_URL_V2 } from '@/configs/config';
import { fetchWithTenant } from '@/lib/fetchWithTenant';
import type { TollClientBranding } from '@/types/tollClient';

/**
 * Branding público del portal de maquila para la pantalla de login, previo a autenticar
 * (requiere X-Tenant, sin Authorization — ver docs/maquila/frontend/00-index.md §1.2).
 * 404 si el slug no existe o el cliente está inactivo (nunca revela cuál de los dos caso es).
 */
export async function getTollClientBranding(slug: string): Promise<TollClientBranding | null> {
  const response = await fetchWithTenant(
    `${API_URL_V2}toll-clients/branding/${encodeURIComponent(slug)}`,
    { method: 'GET' }
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error('No se pudo cargar el acceso del cliente de maquila.');
  }

  const body = (await response.json()) as { data: TollClientBranding };
  return body.data;
}
