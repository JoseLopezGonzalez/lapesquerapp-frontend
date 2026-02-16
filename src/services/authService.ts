import { fetchWithTenant } from "@lib/fetchWithTenant";
import { getSession } from "next-auth/react";
import { API_URL_V2 } from "@/configs/config";
import type {
  RequestAccessResponse,
  VerifyAuthResponse,
  AuthUser,
  GetCurrentUserResponse,
  AuthApiError,
} from "@/types/auth";

const THROTTLE_MESSAGE =
  "Demasiados intentos; espera un momento antes de volver a intentar.";

/** En el navegador usamos proxy Next.js para evitar CORS; en servidor llamamos directo a la API. */
function authUrl(path: string): string {
  if (typeof window !== "undefined") {
    return `/api/backend-auth/${path}`;
  }
  return path === "logout" || path === "me"
    ? `${API_URL_V2}${path}`
    : `${API_URL_V2}auth/${path}`;
}

/**
 * Solicita acceso: un solo correo con enlace + código (reemplaza magic-link/request y otp/request).
 */
export async function requestAccess(email: string): Promise<RequestAccessResponse> {
  const response = await fetchWithTenant(authUrl("request-access"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (response.status === 429) {
    throw new Error(THROTTLE_MESSAGE);
  }
  const data = (await response.json().catch(() => ({}))) as RequestAccessResponse & { userMessage?: string };
  if (!response.ok) {
    throw new Error(
      data.message || (data as { userMessage?: string }).userMessage || "Error al solicitar acceso."
    );
  }
  return data;
}

/**
 * Canjea el token del magic link y devuelve access_token y user (sin autenticación).
 */
export async function verifyMagicLinkToken(token: string): Promise<VerifyAuthResponse> {
  const response = await fetchWithTenant(authUrl("magic-link/verify"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (response.status === 429) {
    throw new Error(THROTTLE_MESSAGE);
  }
  const data = (await response.json().catch(() => ({}))) as VerifyAuthResponse & {
    message?: string;
    userMessage?: string;
  };
  if (!response.ok) {
    const msg =
      data.message || data.userMessage || "Enlace no válido o expirado.";
    const err = new Error(msg) as AuthApiError;
    err.status = response.status;
    err.data = data as unknown as Record<string, unknown>;
    throw err;
  }
  return data;
}

/**
 * Solicita un código OTP por email (sin autenticación).
 */
export async function requestOtp(email: string): Promise<RequestAccessResponse> {
  const response = await fetchWithTenant(authUrl("otp/request"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (response.status === 429) {
    throw new Error(THROTTLE_MESSAGE);
  }
  const data = (await response.json().catch(() => ({}))) as RequestAccessResponse & { userMessage?: string };
  if (!response.ok) {
    throw new Error(
      data.message || (data as { userMessage?: string }).userMessage || "Error al solicitar el código."
    );
  }
  return data;
}

/**
 * Canjea el código OTP y devuelve access_token y user (sin autenticación).
 */
export async function verifyOtp(
  email: string,
  code: string
): Promise<VerifyAuthResponse> {
  const response = await fetchWithTenant(authUrl("otp/verify"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code }),
  });
  if (response.status === 429) {
    throw new Error(THROTTLE_MESSAGE);
  }
  const data = (await response.json().catch(() => ({}))) as VerifyAuthResponse & {
    message?: string;
    userMessage?: string;
  };
  if (!response.ok) {
    const msg =
      data.message || data.userMessage || "Código no válido o expirado.";
    const err = new Error(msg) as AuthApiError;
    err.status = response.status;
    err.data = data as unknown as Record<string, unknown>;
    throw err;
  }
  return data;
}

/**
 * Cierra sesión en el backend revocando el token.
 * No lanza error para no bloquear el logout del cliente.
 */
export async function logout(): Promise<Response | { ok: boolean }> {
  try {
    const session = await getSession();
    if (!session?.user?.accessToken) {
      return { ok: true };
    }

    const response = await fetchWithTenant(authUrl("logout"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.user.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.warn("Error al revocar token en backend:", response.status);
    }

    return response;
  } catch (error) {
    console.error("Error en logout del backend:", error);
    return { ok: false };
  }
}

/**
 * Obtiene los datos actualizados del usuario desde el backend.
 */
export async function getCurrentUser(): Promise<AuthUser> {
  const session = await getSession();
  if (!session?.user?.accessToken) {
    throw new Error("No hay sesión autenticada");
  }

  const response = await fetchWithTenant(authUrl("me"), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${session.user.accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw response;
  }

  const data = (await response.json()) as GetCurrentUserResponse;
  if (typeof data === "object" && data !== null && "data" in data && (data as { data?: AuthUser }).data) {
    return (data as { data: AuthUser }).data;
  }
  return data as AuthUser;
}
