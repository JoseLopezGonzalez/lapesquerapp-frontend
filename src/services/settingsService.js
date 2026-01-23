import { fetchWithTenant } from "@/lib/fetchWithTenant";
import { API_URL_V2 } from "@/configs/config";
import { getSession } from "next-auth/react";
import { getUserAgent } from '@/lib/utils/getUserAgent';

export async function getSettings() {
  const session = await getSession();
  if (!session || !session.user || !session.user.accessToken) throw new Error("No autenticado");
  const res = await fetchWithTenant(`${API_URL_V2}settings`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.user.accessToken}`,
      'User-Agent': getUserAgent(),
    },
  });
  if (!res.ok) throw new Error('Error al obtener configuración');
  return await res.json();
}

export async function updateSettings(data) {
  const session = await getSession();
  if (!session || !session.user || !session.user.accessToken) throw new Error("No autenticado");
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
    // Intentar parsear el error del backend para mostrar mensaje más específico
    try {
      const errorData = await res.json();
      const error = new Error(errorData.message || 'Error al guardar configuración');
      error.userMessage = errorData.userMessage || errorData.message;
      throw error;
    } catch (parseError) {
      if (parseError instanceof Error && parseError.userMessage) {
        throw parseError;
      }
      throw new Error('Error al guardar configuración');
    }
  }
  return await res.json();
} 