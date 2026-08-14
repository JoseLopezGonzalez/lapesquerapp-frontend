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
  fieldOperatorId?: number | null;
  isFieldOperator?: boolean;
  salespersonId?: number | null;
  actorType?: 'internal_user' | 'external_user' | null;
  externalUserType?: 'maquilador' | null;
  /** ID del TollClient vinculado (portal de maquila). Único campo fiable para distinguir
   * un cliente de maquila real de un ExternalUser genérico — ver docs/maquila/frontend/00-index.md §1.1 */
  tollClientId?: number | null;
  tollClientName?: string | null;
  allowedStoreIds?: number[];
  assigned_store_id?: number | null;
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
