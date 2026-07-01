/**
 * Service de dominio para Auxiliary Products (Productos Auxiliares)
 * Líneas auxiliares — catálogo opcional de artículos no pesqueros (nieve, envases, palets, servicios)
 */

import { API_URL_V2 } from '@/configs/config';
import { getAuthToken } from '@/lib/auth/getAuthToken';
import { fetchEntitiesGeneric, deleteEntityGeneric } from '@/services/generic/entityService';
import { createEntityGeneric } from '@/services/generic/createEntityService';
import {
  fetchEntityDataGeneric,
  submitEntityFormGeneric,
} from '@/services/generic/editEntityService';
import { addFiltersToParams } from '@/lib/entity/filtersHelper';
import { addWithParams } from '@/lib/entity/entityRelationsHelper';
import type {
  AuxiliaryProduct,
  AuxiliaryProductOption,
  CatalogListResponse,
  CatalogListFilters,
} from '@/types/catalog';

const ENDPOINT = 'auxiliary-products';

export const auxiliaryProductService = {
  async list(
    filters: CatalogListFilters = {},
    pagination: { page?: number; perPage?: number } = {}
  ): Promise<CatalogListResponse<AuxiliaryProduct>> {
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
    return fetchEntitiesGeneric(url, token) as Promise<CatalogListResponse<AuxiliaryProduct>>;
  },

  async getById(id: number | string): Promise<AuxiliaryProduct> {
    const token = await getAuthToken();
    const url = `${API_URL_V2}${ENDPOINT}/${id}`;
    return fetchEntityDataGeneric(url, token) as Promise<AuxiliaryProduct>;
  },

  async create(data: Record<string, unknown>): Promise<AuxiliaryProduct> {
    const token = await getAuthToken();
    const url = `${API_URL_V2}${ENDPOINT}`;
    const response = await createEntityGeneric(url, data, token);
    const result = await response.json();
    return (result.data ?? result) as AuxiliaryProduct;
  },

  async update(id: number | string, data: Record<string, unknown>): Promise<AuxiliaryProduct> {
    const token = await getAuthToken();
    const url = `${API_URL_V2}${ENDPOINT}/${id}`;
    const response = await submitEntityFormGeneric(url, 'PUT', data, token);
    const result = await response.json();
    return (result.data ?? result) as AuxiliaryProduct;
  },

  async delete(id: number | string): Promise<{ response: Response; data: unknown }> {
    const token = await getAuthToken();
    const url = `${API_URL_V2}${ENDPOINT}/${id}`;
    return deleteEntityGeneric(url, undefined, token) as Promise<{
      response: Response;
      data: unknown;
    }>;
  },

  async deleteMultiple(ids: (number | string)[]): Promise<{ response: Response; data: unknown }> {
    const token = await getAuthToken();
    const url = `${API_URL_V2}${ENDPOINT}`;
    return deleteEntityGeneric(url, { ids }, token) as Promise<{
      response: Response;
      data: unknown;
    }>;
  },

  /**
   * Opciones para selects — array plano con unit/defaultPrice para autocompletar
   * la línea al elegir un artículo (el backend no transforma a { value, label }).
   */
  async getOptions(): Promise<AuxiliaryProductOption[]> {
    const token = await getAuthToken();
    const url = `${API_URL_V2}${ENDPOINT}/options`;
    return fetchEntitiesGeneric(url, token) as Promise<AuxiliaryProductOption[]>;
  },
};
