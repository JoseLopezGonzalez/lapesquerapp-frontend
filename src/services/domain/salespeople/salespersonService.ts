/**
 * Service de dominio para Salespeople (Comerciales). Bloque 10.
 */
import { API_URL_V2 } from '@/configs/config';
import { getAuthToken } from '@/lib/auth/getAuthToken';
import { fetchEntitiesGeneric, deleteEntityGeneric } from '@/services/generic/entityService';
import { createEntityGeneric } from '@/services/generic/createEntityService';
import { fetchEntityDataGeneric, submitEntityFormGeneric, fetchAutocompleteOptionsGeneric } from '@/services/generic/editEntityService';
import { addFiltersToParams } from '@/lib/entity/filtersHelper';
import { addWithParams } from '@/lib/entity/entityRelationsHelper';
import type { Salesperson, CatalogListResponse, CatalogListFilters, CatalogOption } from '@/types/catalog';

const ENDPOINT = 'salespeople';

export const salespersonService = {
  async list(filters: CatalogListFilters = {}, pagination: { page?: number; perPage?: number } = {}): Promise<CatalogListResponse<Salesperson>> {
    const token = await getAuthToken();
    const { page = 1, perPage = 12 } = pagination;
    const queryParams = new URLSearchParams();
    addFiltersToParams(queryParams, filters);
    if (filters._requiredRelations && Array.isArray(filters._requiredRelations)) addWithParams(queryParams, filters._requiredRelations);
    queryParams.append('page', String(page));
    queryParams.append('perPage', String(perPage));
    const url = `${API_URL_V2}${ENDPOINT}?${queryParams.toString()}`;
    return fetchEntitiesGeneric(url, token) as Promise<CatalogListResponse<Salesperson>>;
  },
  async getById(id: number | string): Promise<Salesperson> {
    const token = await getAuthToken();
    return fetchEntityDataGeneric(`${API_URL_V2}${ENDPOINT}/${id}`, token) as Promise<Salesperson>;
  },
  async create(data: Record<string, unknown>): Promise<Salesperson> {
    const token = await getAuthToken();
    const response = await createEntityGeneric(`${API_URL_V2}${ENDPOINT}`, data, token);
    const result = await response.json();
    return (result.data ?? result) as Salesperson;
  },
  async update(id: number | string, data: Record<string, unknown>): Promise<Salesperson> {
    const token = await getAuthToken();
    const response = await submitEntityFormGeneric(`${API_URL_V2}${ENDPOINT}/${id}`, 'PUT', data, token);
    const result = await response.json();
    return (result.data ?? result) as Salesperson;
  },
  async delete(id: number | string): Promise<{ response: Response; data: unknown }> {
    const token = await getAuthToken();
    return deleteEntityGeneric(`${API_URL_V2}${ENDPOINT}/${id}`, undefined, token) as Promise<{ response: Response; data: unknown }>;
  },
  async deleteMultiple(ids: (number | string)[]): Promise<{ response: Response; data: unknown }> {
    const token = await getAuthToken();
    return deleteEntityGeneric(`${API_URL_V2}${ENDPOINT}`, { ids }, token) as Promise<{ response: Response; data: unknown }>;
  },
  async getOptions(): Promise<CatalogOption[]> {
    const token = await getAuthToken();
    return fetchAutocompleteOptionsGeneric(`${API_URL_V2}${ENDPOINT}/options`, token) as Promise<CatalogOption[]>;
  },
};
