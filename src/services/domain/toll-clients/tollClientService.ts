/**
 * Service de dominio para Toll Clients (Clientes de maquila) — gestión admin (staff interno).
 * Mismo patrón que externalProcessorService.ts (misma familia de entidad en backend).
 */
import { API_URL_V2 } from '@/configs/config';
import { getAuthToken } from '@/lib/auth/getAuthToken';
import { fetchEntitiesGeneric, deleteEntityGeneric } from '@/services/generic/entityService';
import { createEntityGeneric } from '@/services/generic/createEntityService';
import {
  fetchEntityDataGeneric,
  submitEntityFormGeneric,
  fetchAutocompleteOptionsGeneric,
} from '@/services/generic/editEntityService';
import { addFiltersToParams } from '@/lib/entity/filtersHelper';
import { addWithParams } from '@/lib/entity/entityRelationsHelper';
import { apiRequest, uploadMultipart } from '@/lib/api/apiHelpers';
import type { CatalogListFilters, CatalogListResponse } from '@/types/catalog';
import type { TollClient, TollClientOption } from '@/types/tollClient';

const ENDPOINT = 'toll-clients';

function normalizeTollClientFilters(filters: CatalogListFilters): CatalogListFilters {
  const normalized = { ...filters };
  const countryId = normalized.countryId;

  if (Array.isArray(countryId)) {
    const firstCountry = countryId[0];
    normalized.countryId =
      firstCountry && typeof firstCountry === 'object' && 'id' in firstCountry
        ? firstCountry.id
        : firstCountry;
  }

  return normalized;
}

export const tollClientService = {
  async list(
    filters: CatalogListFilters = {},
    pagination: { page?: number; perPage?: number } = {}
  ): Promise<CatalogListResponse<TollClient>> {
    const token = await getAuthToken();
    const { page = 1, perPage = 12 } = pagination;
    const queryParams = new URLSearchParams();
    const normalizedFilters = normalizeTollClientFilters(filters);
    addFiltersToParams(queryParams, normalizedFilters);
    if (filters._requiredRelations && Array.isArray(filters._requiredRelations)) {
      addWithParams(queryParams, filters._requiredRelations);
    }
    queryParams.append('page', String(page));
    queryParams.append('perPage', String(perPage));
    const url = `${API_URL_V2}${ENDPOINT}?${queryParams.toString()}`;
    return fetchEntitiesGeneric(url, token) as Promise<CatalogListResponse<TollClient>>;
  },

  async getById(id: number | string): Promise<TollClient> {
    const token = await getAuthToken();
    return fetchEntityDataGeneric(`${API_URL_V2}${ENDPOINT}/${id}`, token) as Promise<TollClient>;
  },

  async create(data: Record<string, unknown>): Promise<TollClient> {
    const token = await getAuthToken();
    const response = await createEntityGeneric(`${API_URL_V2}${ENDPOINT}`, data, token);
    const result = await response.json();
    return (result.data ?? result) as TollClient;
  },

  async update(id: number | string, data: Record<string, unknown>): Promise<TollClient> {
    const token = await getAuthToken();
    const response = await submitEntityFormGeneric(
      `${API_URL_V2}${ENDPOINT}/${id}`,
      'PUT',
      data,
      token
    );
    const result = await response.json();
    return (result.data ?? result) as TollClient;
  },

  async delete(id: number | string): Promise<{ response: Response; data: unknown }> {
    const token = await getAuthToken();
    return deleteEntityGeneric(`${API_URL_V2}${ENDPOINT}/${id}`, undefined, token) as Promise<{
      response: Response;
      data: unknown;
    }>;
  },

  async deleteMultiple(ids: (number | string)[]): Promise<{ response: Response; data: unknown }> {
    const token = await getAuthToken();
    return deleteEntityGeneric(`${API_URL_V2}${ENDPOINT}`, { ids }, token) as Promise<{
      response: Response;
      data: unknown;
    }>;
  },

  async activate(id: number | string): Promise<TollClient> {
    return this.update(id, { isActive: true });
  },

  async deactivate(id: number | string): Promise<TollClient> {
    return this.update(id, { isActive: false });
  },

  async getOptions(): Promise<TollClientOption[]> {
    try {
      const token = await getAuthToken();
      return (await fetchAutocompleteOptionsGeneric(
        `${API_URL_V2}${ENDPOINT}/options`,
        token
      )) as TollClientOption[];
    } catch {
      const response = await this.list({}, { page: 1, perPage: 500 });
      return response.data.map((tc) => ({ value: tc.id, label: tc.name }));
    }
  },

  /** Imagen grande de la pantalla de login del portal (máx. 8 MB) — solo staff. */
  async uploadLoginBanner(id: number | string, file: File): Promise<void> {
    const token = await getAuthToken();
    const formData = new FormData();
    formData.append('image', file);
    await uploadMultipart(`${API_URL_V2}${ENDPOINT}/${id}/login-banner`, token, formData);
  },

  async deleteLoginBanner(id: number | string): Promise<void> {
    const token = await getAuthToken();
    await apiRequest(`${API_URL_V2}${ENDPOINT}/${id}/login-banner`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  /** Logo pequeño de la cabecera del portal ya autenticado (máx. 5 MB) — solo staff. */
  async uploadLogo(id: number | string, file: File): Promise<void> {
    const token = await getAuthToken();
    const formData = new FormData();
    formData.append('image', file);
    await uploadMultipart(`${API_URL_V2}${ENDPOINT}/${id}/logo`, token, formData);
  },

  async deleteLogo(id: number | string): Promise<void> {
    const token = await getAuthToken();
    await apiRequest(`${API_URL_V2}${ENDPOINT}/${id}/logo`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};
