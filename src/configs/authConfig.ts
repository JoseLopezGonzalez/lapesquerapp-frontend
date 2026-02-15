/**
 * Configuración para el manejo de errores de autenticación
 */

export const AUTH_ERROR_CONFIG = {
  AUTH_SESSION_EXPIRED_EVENT: "auth:session-expired",
  AUTH_ERROR_MESSAGES: [
    "No autenticado",
    "Unauthorized",
    "401",
    "Token",
    "Sesión expirada",
    "Session expired",
    "Invalid token",
    "Token expired",
  ],
  REDIRECT_DELAY: 1500,
  DEFAULT_LOGIN_URL: "/",
  FROM_PARAM: "from",
} as const;

export interface AuthErrorLike {
  code?: string;
  message?: string;
}

export function isAuthError(error: AuthErrorLike | null | undefined): boolean {
  if (!error) return false;
  if (error.code === "UNAUTHENTICATED") return true;
  if (!error.message) return false;
  const message = error.message.toLowerCase();
  return AUTH_ERROR_CONFIG.AUTH_ERROR_MESSAGES.some((authMessage) =>
    message.includes(authMessage.toLowerCase())
  );
}

export function isAuthStatusCode(status: number): boolean {
  return status === 401 || status === 403;
}

export function buildLoginUrl(currentPath = ""): string {
  if (typeof window === "undefined") {
    return currentPath ? `/?from=${encodeURIComponent(currentPath)}` : "/";
  }
  const url = new URL(AUTH_ERROR_CONFIG.DEFAULT_LOGIN_URL, window.location.origin);
  if (currentPath) {
    url.searchParams.set(AUTH_ERROR_CONFIG.FROM_PARAM, currentPath);
  }
  return url.toString();
}
