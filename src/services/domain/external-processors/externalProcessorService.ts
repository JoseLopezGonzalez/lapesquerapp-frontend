/**
 * Service de dominio para External Processors (Transformadores externos).
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
import type { CatalogListFilters, CatalogListResponse } from '@/types/catalog';

const ENDPOINT = 'external-processors';

function normalizeExternalProcessorFilters(filters: CatalogListFilters): CatalogListFilters {
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

export interface ExternalProcessor {
  id: number | string;
  name: string;
  legalName?: string | null;
  vatNumber: string;
  sanitaryRegistrationNumber?: string | null;
  contactPerson?: string | null;
  phone?: string | null;
  emails?: string[];
  ccEmails?: string[];
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  province?: string | null;
  country?: { id: number | string; name: string } | null;
  isActive?: boolean;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  [key: string]: unknown;
}

export interface ExternalProcessorOption {
  value: number | string;
  label: string;
}

export const externalProcessorService = {
  async list(
    filters: CatalogListFilters = {},
    pagination: { page?: number; perPage?: number } = {}
  ): Promise<CatalogListResponse<ExternalProcessor>> {
    const token = await getAuthToken();
    const { page = 1, perPage = 12 } = pagination;
    const queryParams = new URLSearchParams();
    const normalizedFilters = normalizeExternalProcessorFilters(filters);
    addFiltersToParams(queryParams, normalizedFilters);
    if (filters._requiredRelations && Array.isArray(filters._requiredRelations)) {
      addWithParams(queryParams, filters._requiredRelations);
    }
    queryParams.append('page', String(page));
    queryParams.append('perPage', String(perPage));
    const url = `${API_URL_V2}${ENDPOINT}?${queryParams.toString()}`;
    return fetchEntitiesGeneric(url, token) as Promise<CatalogListResponse<ExternalProcessor>>;
  },

  async getById(id: number | string): Promise<ExternalProcessor> {
    const token = await getAuthToken();
    return fetchEntityDataGeneric(`${API_URL_V2}${ENDPOINT}/${id}`, token) as Promise<
      ExternalProcessor
    >;
  },

  async create(data: Record<string, unknown>): Promise<ExternalProcessor> {
    const token = await getAuthToken();
    const response = await createEntityGeneric(`${API_URL_V2}${ENDPOINT}`, data, token);
    const result = await response.json();
    return (result.data ?? result) as ExternalProcessor;
  },

  async update(id: number | string, data: Record<string, unknown>): Promise<ExternalProcessor> {
    const token = await getAuthToken();
    const response = await submitEntityFormGeneric(
      `${API_URL_V2}${ENDPOINT}/${id}`,
      'PUT',
      data,
      token
    );
    const result = await response.json();
    return (result.data ?? result) as ExternalProcessor;
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

  async activate(id: number | string): Promise<ExternalProcessor> {
    return this.update(id, { isActive: true });
  },

  async deactivate(id: number | string): Promise<ExternalProcessor> {
    return this.update(id, { isActive: false });
  },

  async getOptions(): Promise<ExternalProcessorOption[]> {
    const token = await getAuthToken();
    return fetchAutocompleteOptionsGeneric(`${API_URL_V2}${ENDPOINT}/options`, token) as Promise<
      ExternalProcessorOption[]
    >;
  },
};
