/**
 * Service de dominio para Customs Brokers (Agentes de aduanas / Intermediate Consignee)
 */

import { API_URL_V2 } from '@/configs/config';
import { getAuthToken } from '@/lib/auth/getAuthToken';
import { fetchEntitiesGeneric, deleteEntityGeneric } from '@/services/generic/entityService';
import { createEntityGeneric } from '@/services/generic/createEntityService';
import { fetchEntityDataGeneric, submitEntityFormGeneric } from '@/services/generic/editEntityService';
import { addFiltersToParams } from '@/lib/entity/filtersHelper';
import { addWithParams } from '@/lib/entity/entityRelationsHelper';
import type {
  CustomsBroker,
  CustomsBrokerOption,
  CatalogListResponse,
  CatalogListFilters,
} from '@/types/catalog';

const ENDPOINT = 'customs-brokers';

export const customsBrokerService = {
  async list(
    filters: CatalogListFilters = {},
    pagination: { page?: number; perPage?: number } = {}
  ): Promise<CatalogListResponse<CustomsBroker>> {
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
    return fetchEntitiesGeneric(url, token) as Promise<CatalogListResponse<CustomsBroker>>;
  },

  async getById(id: number | string): Promise<CustomsBroker> {
    const token = await getAuthToken();
    const url = `${API_URL_V2}${ENDPOINT}/${id}`;
    return fetchEntityDataGeneric(url, token) as Promise<CustomsBroker>;
  },

  async create(data: Record<string, unknown>): Promise<CustomsBroker> {
    const token = await getAuthToken();
    const url = `${API_URL_V2}${ENDPOINT}`;
    const response = await createEntityGeneric(url, data, token);
    const result = await response.json();
    return (result.data ?? result) as CustomsBroker;
  },

  async update(id: number | string, data: Record<string, unknown>): Promise<CustomsBroker> {
    const token = await getAuthToken();
    const url = `${API_URL_V2}${ENDPOINT}/${id}`;
    const response = await submitEntityFormGeneric(url, 'PATCH', data, token);
    const result = await response.json();
    return (result.data ?? result) as CustomsBroker;
  },

  async delete(id: number | string): Promise<{ response: Response; data: unknown }> {
    const token = await getAuthToken();
    const url = `${API_URL_V2}${ENDPOINT}/${id}`;
    return deleteEntityGeneric(url, undefined, token) as Promise<{
      response: Response;
      data: unknown;
    }>;
  },

  async getOptions(): Promise<CustomsBrokerOption[]> {
    const token = await getAuthToken();
    const url = `${API_URL_V2}${ENDPOINT}/options`;
    return fetchEntitiesGeneric(url, token) as Promise<CustomsBrokerOption[]>;
  },
};
