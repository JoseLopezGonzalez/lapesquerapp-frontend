/**
 * Types for session (sesión) domain — Bloque 11 Usuarios y sesiones
 */

import type { PaginationMeta } from '@/types/user';

/** Session record from API (list) */
export interface Session {
  id: number | string;
  user_name?: string;
  created_at?: string;
  last_used_at?: string;
  expires_at?: string;
  [key: string]: unknown;
}

/** Paginated list response for sessions */
export interface SessionsListResponse {
  data: Session[];
  meta: PaginationMeta;
}

/** Filters for session list (aligned with entitiesConfig.sessions) */
export interface SessionListFilters {
  id?: string;
  ids?: (string | number)[];
  name?: string;
  _requiredRelations?: string[];
  [key: string]: unknown;
}
