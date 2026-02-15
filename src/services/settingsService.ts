/**
 * Settings Service - API client for tenant configuration
 * @module services/settingsService
 */

import { fetchWithTenant } from '@/lib/fetchWithTenant';
import { API_URL_V2 } from '@/configs/config';
import { getSession } from 'next-auth/react';
import { getUserAgent } from '@/lib/utils/getUserAgent';
import type { SettingsData, UpdateSettingsAuthError } from '@/types/settings';

/**
 * Fetches tenant settings from the API.
 * @returns Settings object or null on 401/403 (auth handled by fetchWithTenant event)
 * @throws Error when not authenticated or request fails
 */
export async function getSettings(): Promise<SettingsData | null> {
  const session = await getSession();
  if (!session?.user?.accessToken) {
    throw new Error('No autenticado');
  }
  const res = await fetchWithTenant(`${API_URL_V2}settings`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.user.accessToken}`,
      'User-Agent': getUserAgent(),
    },
  });
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) return null;
    throw new Error('Error al obtener configuración');
  }
  return (await res.json()) as SettingsData;
}

/**
 * Updates tenant settings.
 * @param data - Settings payload to send
 * @returns Updated settings or auth error object
 * @throws Error with userMessage when backend returns error
 */
export async function updateSettings(
  data: SettingsData
): Promise<SettingsData | UpdateSettingsAuthError> {
  const session = await getSession();
  if (!session?.user?.accessToken) {
    throw new Error('No autenticado');
  }
  const res = await fetchWithTenant(`${API_URL_V2}settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.user.accessToken}`,
      'User-Agent': getUserAgent(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      return { success: false, authError: true };
    }
    try {
      const errorData = (await res.json()) as { message?: string; userMessage?: string };
      const error = new Error(errorData.message || 'Error al guardar configuración') as Error & {
        userMessage?: string;
      };
      error.userMessage = errorData.userMessage ?? errorData.message;
      throw error;
    } catch (parseError) {
      if (parseError instanceof Error && 'userMessage' in parseError) {
        throw parseError;
      }
      throw new Error('Error al guardar configuración');
    }
  }
  return (await res.json()) as SettingsData;
}
