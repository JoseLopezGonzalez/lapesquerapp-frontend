import { getSession } from "next-auth/react";

/**
 * Contexto de token para API routes (server-side). Evita llamar a getSession
 * cuando el token ya fue resuelto por el caller.
 */
let serverTokenContext: string | null = null;
let cachedClientToken: string | null = null;
let cachedClientTokenExpiresAt = 0;
let pendingClientTokenPromise: Promise<string> | null = null;

function decodeJwtExpiryMs(token: string): number {
  try {
    const payload = token.split(".")[1];
    if (!payload) return 0;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const payloadJson =
      typeof globalThis.atob === "function"
        ? globalThis.atob(padded)
        : Buffer.from(padded, "base64").toString("utf-8");
    const decoded = JSON.parse(payloadJson);
    const expSeconds = Number(decoded?.exp);
    if (!Number.isFinite(expSeconds) || expSeconds <= 0) return 0;
    return expSeconds * 1000;
  } catch {
    return 0;
  }
}

export function setServerTokenContext(token: string | null): void {
  serverTokenContext = token;
}

export function clearServerTokenContext(): void {
  serverTokenContext = null;
}

export function clearAuthTokenCache(): void {
  cachedClientToken = null;
  cachedClientTokenExpiresAt = 0;
  pendingClientTokenPromise = null;
}

/**
 * Obtiene el token de autenticación (cliente o servidor).
 * Sin logs para no generar ruido en producción; el caller puede registrar errores si lo necesita.
 */
export async function getAuthToken(providedToken?: string | null): Promise<string> {
  if (providedToken) return providedToken;
  if (serverTokenContext) return serverTokenContext;

  const now = Date.now();
  if (cachedClientToken && cachedClientTokenExpiresAt > now + 30_000) {
    return cachedClientToken;
  }

  if (!pendingClientTokenPromise) {
    pendingClientTokenPromise = getSession()
      .then((session) => {
        const token = session?.user?.accessToken;
        if (!token) {
          throw new Error("No hay sesión autenticada. No se puede realizar la operación.");
        }
        cachedClientToken = token;
        cachedClientTokenExpiresAt = decodeJwtExpiryMs(token);
        return token;
      })
      .finally(() => {
        pendingClientTokenPromise = null;
      });
  }

  return pendingClientTokenPromise;
}
