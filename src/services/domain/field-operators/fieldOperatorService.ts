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

const ENDPOINT = 'field-operators';

type Filters = Record<string, unknown> & { _requiredRelations?: string[] };
type Pagination = { page?: number; perPage?: number };
type FieldOperatorPayload = Record<string, unknown>;

export const fieldOperatorAdminService = {
  async list(filters: Filters = {}, pagination: Pagination = {}) {
    const token = await getAuthToken();
    const { page = 1, perPage = 12 } = pagination;
    const queryParams = new URLSearchParams();
    addFiltersToParams(queryParams, filters);
    if (filters._requiredRelations && Array.isArray(filters._requiredRelations)) {
      addWithParams(queryParams, filters._requiredRelations);
    }
    queryParams.append('page', String(page));
    queryParams.append('perPage', String(perPage));
    return fetchEntitiesGeneric(`${API_URL_V2}${ENDPOINT}?${queryParams.toString()}`, token);
  },
  async getById(id: number | string) {
    const token = await getAuthToken();
    return fetchEntityDataGeneric(`${API_URL_V2}${ENDPOINT}/${id}`, token);
  },
  async create(payload: FieldOperatorPayload) {
    const token = await getAuthToken();
    const response = await createEntityGeneric(`${API_URL_V2}${ENDPOINT}`, payload, token);
    const result = await response.json();
    return result.data ?? result;
  },
  async update(id: number | string, payload: FieldOperatorPayload) {
    const token = await getAuthToken();
    const response = await submitEntityFormGeneric(
      `${API_URL_V2}${ENDPOINT}/${id}`,
      'PUT',
      payload,
      token
    );
    const result = await response.json();
    return result.data ?? result;
  },
  async delete(id: number | string) {
    const token = await getAuthToken();
    return deleteEntityGeneric(`${API_URL_V2}${ENDPOINT}/${id}`, undefined, token);
  },
  async getOptions() {
    const token = await getAuthToken();
    return fetchAutocompleteOptionsGeneric(`${API_URL_V2}${ENDPOINT}/options`, token);
  },
};
