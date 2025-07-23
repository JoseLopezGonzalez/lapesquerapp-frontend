import { fetchWithTenant } from "@/lib/fetchWithTenant";
import { API_URL_V2 } from "@/configs/config";
import { getSession } from "next-auth/react";

export async function getSettings() {
  const session = await getSession();
  if (!session || !session.user || !session.user.accessToken) throw new Error("No autenticado");
  const res = await fetchWithTenant(`${API_URL_V2}settings`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.user.accessToken}`,
      'User-Agent': navigator.userAgent,
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
      'User-Agent': navigator.userAgent,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al guardar configuración');
  return await res.json();
} 