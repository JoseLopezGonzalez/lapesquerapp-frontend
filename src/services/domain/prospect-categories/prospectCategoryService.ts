import { API_URL_V2 } from '@/configs/config';
import { getAuthToken } from '@/lib/auth/getAuthToken';
import { fetchEntitiesGeneric, deleteEntityGeneric } from '@/services/generic/entityService';
import { createEntityGeneric } from '@/services/generic/createEntityService';
import {
  fetchAutocompleteOptionsGeneric,
  fetchEntityDataGeneric,
  submitEntityFormGeneric,
} from '@/services/generic/editEntityService';
import { addFiltersToParams } from '@/lib/entity/filtersHelper';
import type { CatalogListFilters, CatalogListResponse, CatalogOption, ProspectCategory } from '@/types/catalog';

const ENDPOINT = 'prospect-categories';

export const prospectCategoryService = {
  async list(
    filters: CatalogListFilters = {},
    pagination: { page?: number; perPage?: number } = {}
  ): Promise<CatalogListResponse<ProspectCategory>> {
    const token = await getAuthToken();
    const { page = 1, perPage = 12 } = pagination;
    const queryParams = new URLSearchParams();
    addFiltersToParams(queryParams, filters);
    queryParams.append('page', String(page));
    queryParams.append('perPage', String(perPage));

    return fetchEntitiesGeneric(`${API_URL_V2}${ENDPOINT}?${queryParams.toString()}`, token) as Promise<
      CatalogListResponse<ProspectCategory>
    >;
  },

  async getById(id: number | string): Promise<ProspectCategory> {
    const token = await getAuthToken();
    return fetchEntityDataGeneric(`${API_URL_V2}${ENDPOINT}/${id}`, token) as Promise<ProspectCategory>;
  },

  async create(data: Record<string, unknown>): Promise<ProspectCategory> {
    const token = await getAuthToken();
    const response = await createEntityGeneric(`${API_URL_V2}${ENDPOINT}`, data, token);
    const result = await response.json();
    return (result.data ?? result) as ProspectCategory;
  },

  async update(id: number | string, data: Record<string, unknown>): Promise<ProspectCategory> {
    const token = await getAuthToken();
    const response = await submitEntityFormGeneric(`${API_URL_V2}${ENDPOINT}/${id}`, 'PUT', data, token);
    const result = await response.json();
    return (result.data ?? result) as ProspectCategory;
  },

  async delete(id: number | string): Promise<{ response: Response; data: unknown }> {
    const token = await getAuthToken();
    return deleteEntityGeneric(`${API_URL_V2}${ENDPOINT}/${id}`, undefined, token) as Promise<{
      response: Response;
      data: unknown;
    }>;
  },

  async deleteMultiple(ids: (number | string)[]): Promise<void> {
    await Promise.all(ids.map((id) => this.delete(id)));
  },

  async getOptions(): Promise<CatalogOption[]> {
    const token = await getAuthToken();
    return fetchAutocompleteOptionsGeneric(`${API_URL_V2}${ENDPOINT}/options`, token) as Promise<CatalogOption[]>;
  },
};
