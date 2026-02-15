/**
 * Tipos para la API de autenticación y respuestas del backend.
 * Alineados con next-auth.d.ts donde aplica (role, assignedStoreId, etc.).
 */

/** Respuesta de POST auth/request-access y auth/otp/request */
export interface RequestAccessResponse {
  message?: string;
}

/** Usuario tal como lo devuelve el backend (snake_case) en /me, otp/verify, magic-link/verify */
export interface AuthUser {
  id?: number;
  email?: string | null;
  name?: string | null;
  role?: string | string[] | null;
  assigned_store_id?: number | null;
  company_name?: string | null;
  company_logo_url?: string | null;
  [key: string]: unknown;
}

/** Respuesta de POST auth/otp/verify y auth/magic-link/verify */
export interface VerifyAuthResponse {
  access_token: string;
  user: AuthUser;
}

/** Respuesta de GET /me (puede venir en data o en raíz) */
export type GetCurrentUserResponse = AuthUser | { data: AuthUser };

/** Error lanzado por verifyOtp/verifyMagicLinkToken con status y data del backend */
export interface AuthApiError extends Error {
  status?: number;
  data?: Record<string, unknown>;
}
