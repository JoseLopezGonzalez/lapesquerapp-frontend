/**
 * Service de dominio para Users (Usuarios)
 * Bloque 11 — Usuarios y sesiones
 */

import { API_URL_V2 } from '@/configs/config';
import { getAuthToken } from '@/lib/auth/getAuthToken';
import { fetchWithTenant } from '@/lib/fetchWithTenant';
import {
  fetchEntitiesGeneric,
  deleteEntityGeneric,
} from '@/services/generic/entityService';
import { createEntityGeneric } from '@/services/generic/createEntityService';
import {
  fetchEntityDataGeneric,
  submitEntityFormGeneric,
  fetchAutocompleteOptionsGeneric,
} from '@/services/generic/editEntityService';
import { addFiltersToParams } from '@/lib/entity/filtersHelper';
import { addWithParams } from '@/lib/entity/entityRelationsHelper';
import type {
  User,
  UsersListResponse,
  UserListFilters,
  UserCreatePayload,
  UserUpdatePayload,
  UserOption,
} from '@/types/user';

const ENDPOINT = 'users';

export const userService = {
  async list(
    filters: UserListFilters = {},
    pagination: { page?: number; perPage?: number } = {}
  ): Promise<UsersListResponse> {
    const token = await getAuthToken();
    const { page = 1, perPage = 12 } = pagination;

    const queryParams = new URLSearchParams();
    addFiltersToParams(queryParams, filters);

    if (filters._requiredRelations && Array.isArray(filters._requiredRelations)) {
      addWithParams(queryParams, filters._requiredRelations);
    }

    queryParams.append('page', String(page));
    queryParams.append('perPage', String(perPage));

    const url = `${API_URL_V2}${ENDPOINT}?${queryParams.toString()}`;
    return fetchEntitiesGeneric(url, token) as Promise<UsersListResponse>;
  },

  async getById(id: number | string): Promise<User> {
    const token = await getAuthToken();
    const url = `${API_URL_V2}${ENDPOINT}/${id}`;
    return fetchEntityDataGeneric(url, token) as Promise<User>;
  },

  async create(data: UserCreatePayload): Promise<User> {
    const token = await getAuthToken();
    const url = `${API_URL_V2}${ENDPOINT}`;
    const response = await createEntityGeneric(url, data, token);
    const result = await response.json();
    return (result.data ?? result) as User;
  },

  async update(
    id: number | string,
    data: UserUpdatePayload
  ): Promise<User> {
    const token = await getAuthToken();
    const url = `${API_URL_V2}${ENDPOINT}/${id}`;
    const response = await submitEntityFormGeneric(url, 'PUT', data, token);
    const result = await response.json();
    return (result.data ?? result) as User;
  },

  async delete(id: number | string): Promise<{ response: Response; data: unknown }> {
    const token = await getAuthToken();
    const url = `${API_URL_V2}${ENDPOINT}/${id}`;
    return deleteEntityGeneric(url, undefined, token) as Promise<{ response: Response; data: unknown }>;
  },

  async deleteMultiple(ids: (number | string)[]): Promise<{ response: Response; data: unknown }> {
    const token = await getAuthToken();
    const url = `${API_URL_V2}${ENDPOINT}`;
    return deleteEntityGeneric(url, { ids }, token) as Promise<{ response: Response; data: unknown }>;
  },

  async getOptions(): Promise<UserOption[]> {
    const token = await getAuthToken();
    const url = `${API_URL_V2}${ENDPOINT}/options`;
    return fetchAutocompleteOptionsGeneric(url, token) as Promise<UserOption[]>;
  },

  /**
   * Reenvía el magic link de invitación al correo del usuario.
   */
  async resendInvitation(id: number | string): Promise<{ message?: string }> {
    const token = await getAuthToken();
    const url = `${API_URL_V2}${ENDPOINT}/${id}/resend-invitation`;
    const response = await fetchWithTenant(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({})) as { message?: string; userMessage?: string };
      const err = new Error(data.message ?? data.userMessage ?? 'Error al reenviar la invitación.') as Error & { status?: number; data?: unknown };
      err.status = response.status;
      err.data = data;
      throw err;
    }
    return response.json().catch(() => ({ message: 'Se ha enviado un enlace de acceso al correo del usuario.' }));
  },
};
