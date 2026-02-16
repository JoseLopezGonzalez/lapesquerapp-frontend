/**
 * Service de dominio para Sessions (Sesiones)
 * Bloque 11 — Usuarios y sesiones
 */

import { API_URL_V2 } from '@/configs/config';
import { getAuthToken } from '@/lib/auth/getAuthToken';
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
  Session,
  SessionsListResponse,
  SessionListFilters,
} from '@/types/session';

const ENDPOINT = 'sessions';

export const sessionService = {
  async list(
    filters: SessionListFilters = {},
    pagination: { page?: number; perPage?: number } = {}
  ): Promise<SessionsListResponse> {
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
    return fetchEntitiesGeneric(url, token) as Promise<SessionsListResponse>;
  },

  async getById(id: number | string): Promise<Session> {
    const token = await getAuthToken();
    const url = `${API_URL_V2}${ENDPOINT}/${id}`;
    return fetchEntityDataGeneric(url, token) as Promise<Session>;
  },

  async create(data: Record<string, unknown>): Promise<Session> {
    const token = await getAuthToken();
    const url = `${API_URL_V2}${ENDPOINT}`;
    const response = await createEntityGeneric(url, data, token);
    const result = await response.json();
    return (result.data ?? result) as Session;
  },

  async update(
    id: number | string,
    data: Record<string, unknown>
  ): Promise<Session> {
    const token = await getAuthToken();
    const url = `${API_URL_V2}${ENDPOINT}/${id}`;
    const response = await submitEntityFormGeneric(url, 'PUT', data, token);
    const result = await response.json();
    return (result.data ?? result) as Session;
  },

  async delete(id: number | string): Promise<{ response: Response; data: unknown }> {
    const token = await getAuthToken();
    const url = `${API_URL_V2}${ENDPOINT}/${id}`;
    return deleteEntityGeneric(url, null, token);
  },

  async deleteMultiple(ids: (number | string)[]): Promise<{ response: Response; data: unknown }> {
    const token = await getAuthToken();
    const url = `${API_URL_V2}${ENDPOINT}`;
    return deleteEntityGeneric(url, { ids }, token);
  },

  async getOptions(): Promise<Array<{ value: number | string; label: string }>> {
    const token = await getAuthToken();
    const url = `${API_URL_V2}${ENDPOINT}/options`;
    return fetchAutocompleteOptionsGeneric(url, token);
  },
};
