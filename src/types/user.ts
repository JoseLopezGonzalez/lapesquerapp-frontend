/**
 * Types for user (usuario) domain — Bloque 11 Usuarios y sesiones
 */

/** Meta for paginated list responses (Laravel-style) */
export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number;
  to?: number;
}

/** User record from API (list/detail) */
export interface User {
  id: number | string;
  name: string;
  email: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

/** Paginated list response for users */
export interface UsersListResponse {
  data: User[];
  meta: PaginationMeta;
}

/** Filters for user list (aligned with entitiesConfig.users.filtersGroup) */
export interface UserListFilters {
  name?: string;
  id?: string | number;
  ids?: (string | number)[];
  role?: string | number | (string | number)[];
  created_at?: { start?: string; end?: string };
  _requiredRelations?: string[];
  [key: string]: unknown;
}

/** Payload for create user */
export interface UserCreatePayload {
  name: string;
  email: string;
  role: string | number;
  [key: string]: unknown;
}

/** Payload for update user */
export interface UserUpdatePayload {
  name?: string;
  email?: string;
  role?: string | number;
  [key: string]: unknown;
}

/** Autocomplete option (value/label) */
export interface UserOption {
  value: number | string;
  label: string;
}
