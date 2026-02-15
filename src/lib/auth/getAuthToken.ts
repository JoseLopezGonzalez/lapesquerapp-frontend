import { getSession } from "next-auth/react";

/**
 * Contexto de token para API routes (server-side). Evita llamar a getSession
 * cuando el token ya fue resuelto por el caller.
 */
let serverTokenContext: string | null = null;

export function setServerTokenContext(token: string | null): void {
  serverTokenContext = token;
}

export function clearServerTokenContext(): void {
  serverTokenContext = null;
}

/**
 * Obtiene el token de autenticación (cliente o servidor).
 * Sin logs para no generar ruido en producción; el caller puede registrar errores si lo necesita.
 */
export async function getAuthToken(providedToken?: string | null): Promise<string> {
  if (providedToken) return providedToken;
  if (serverTokenContext) return serverTokenContext;

  const session = await getSession();
  if (!session?.user?.accessToken) {
    throw new Error("No hay sesión autenticada. No se puede realizar la operación.");
  }
  return session.user.accessToken;
}
