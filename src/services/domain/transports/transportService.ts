/**
 * Service de dominio para Transports (Transportes)
 * Bloque 10 — Catálogos auxiliares
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
import type { Transport, CatalogListResponse, CatalogListFilters, CatalogOption } from '@/types/catalog';

const ENDPOINT = 'transports';

export const transportService = {
  async list(
    filters: CatalogListFilters = {},
    pagination: { page?: number; perPage?: number } = {}
  ): Promise<CatalogListResponse<Transport>> {
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
    return fetchEntitiesGeneric(url, token) as Promise<CatalogListResponse<Transport>>;
  },

  async getById(id: number | string): Promise<Transport> {
    const token = await getAuthToken();
    const url = `${API_URL_V2}${ENDPOINT}/${id}`;
    return fetchEntityDataGeneric(url, token) as Promise<Transport>;
  },

  async create(data: Record<string, unknown>): Promise<Transport> {
    const token = await getAuthToken();
    const url = `${API_URL_V2}${ENDPOINT}`;
    const response = await createEntityGeneric(url, data, token);
    const result = await response.json();
    return (result.data ?? result) as Transport;
  },

  async update(id: number | string, data: Record<string, unknown>): Promise<Transport> {
    const token = await getAuthToken();
    const url = `${API_URL_V2}${ENDPOINT}/${id}`;
    const response = await submitEntityFormGeneric(url, 'PUT', data, token);
    const result = await response.json();
    return (result.data ?? result) as Transport;
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

  async getOptions(): Promise<CatalogOption[]> {
    const token = await getAuthToken();
    const url = `${API_URL_V2}${ENDPOINT}/options`;
    return fetchAutocompleteOptionsGeneric(url, token) as Promise<CatalogOption[]>;
  },
};
