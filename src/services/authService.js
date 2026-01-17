// services/authService.js
import { fetchWithTenant } from "@lib/fetchWithTenant";
import { getSession } from "next-auth/react";
import { API_URL_V2 } from "@/configs/config";

/**
 * Cierra sesión en el backend revocando el token
 * @returns {Promise<Response>}
 */
export const logout = async () => {
    try {
        const session = await getSession();
        if (!session?.user?.accessToken) {
            // Si no hay token, no hay nada que revocar
            return { ok: true };
        }

        const response = await fetchWithTenant(`${API_URL_V2}logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.user.accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        // Incluso si falla, continuamos con el logout del cliente
        if (!response.ok) {
            console.warn('Error al revocar token en backend:', response.status);
        }

        return response;
    } catch (error) {
        // No lanzar error para no bloquear el logout del cliente
        console.error('Error en logout del backend:', error);
        return { ok: false };
    }
};

/**
 * Obtiene los datos actualizados del usuario desde el backend
 * @returns {Promise<object>} Datos del usuario actualizados
 */
export const getCurrentUser = async () => {
    try {
        const session = await getSession();
        if (!session?.user?.accessToken) {
            throw new Error("No hay sesión autenticada");
        }

        const response = await fetchWithTenant(`${API_URL_V2}me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${session.user.accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw response;
        }

        const data = await response.json();
        // La API puede devolver directamente el objeto o envuelto en data
        return data.data || data;
    } catch (error) {
        console.error("Error obteniendo datos del usuario:", error);
        throw error;
    }
};

