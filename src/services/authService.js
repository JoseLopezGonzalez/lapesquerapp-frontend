// services/authService.js
import { fetchWithTenant } from "@lib/fetchWithTenant";
import { getSession } from "next-auth/react";
import { API_URL_V2 } from "@/configs/config";

const THROTTLE_MESSAGE = "Demasiados intentos; espera un momento antes de volver a intentar.";

/**
 * Solicita acceso: un solo correo con enlace + código (reemplaza magic-link/request y otp/request).
 * @param {string} email
 * @returns {Promise<{ message: string }>}
 */
export const requestAccess = async (email) => {
    const response = await fetchWithTenant(`${API_URL_V2}auth/request-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
    });
    if (response.status === 429) {
        throw new Error(THROTTLE_MESSAGE);
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.message || data.userMessage || "Error al solicitar acceso.");
    }
    return data;
};

/**
 * Canjea el token del magic link y devuelve access_token y user (sin autenticación).
 * @param {string} token
 * @returns {Promise<{ access_token: string, user: object }>}
 */
export const verifyMagicLinkToken = async (token) => {
    const response = await fetchWithTenant(`${API_URL_V2}auth/magic-link/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
    });
    if (response.status === 429) {
        throw new Error(THROTTLE_MESSAGE);
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const msg = data.message || data.userMessage || "Enlace no válido o expirado.";
        const err = new Error(msg);
        err.status = response.status;
        err.data = data;
        throw err;
    }
    return data;
};

/**
 * Solicita un código OTP por email (sin autenticación).
 * @param {string} email
 * @returns {Promise<{ message: string }>}
 */
export const requestOtp = async (email) => {
    const response = await fetchWithTenant(`${API_URL_V2}auth/otp/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
    });
    if (response.status === 429) {
        throw new Error(THROTTLE_MESSAGE);
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.message || data.userMessage || "Error al solicitar el código.");
    }
    return data;
};

/**
 * Canjea el código OTP y devuelve access_token y user (sin autenticación).
 * @param {string} email
 * @param {string} code
 * @returns {Promise<{ access_token: string, user: object }>}
 */
export const verifyOtp = async (email, code) => {
    const response = await fetchWithTenant(`${API_URL_V2}auth/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
    });
    if (response.status === 429) {
        throw new Error(THROTTLE_MESSAGE);
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const msg = data.message || data.userMessage || "Código no válido o expirado.";
        const err = new Error(msg);
        err.status = response.status;
        err.data = data;
        throw err;
    }
    return data;
};

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

