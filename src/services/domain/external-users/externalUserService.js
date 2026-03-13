import { API_URL_V2 } from "@/configs/config";
import { getAuthToken } from "@/lib/auth/getAuthToken";
import { fetchWithTenant } from "@/lib/fetchWithTenant";
import {
  fetchEntitiesGeneric,
  deleteEntityGeneric,
} from "@/services/generic/entityService";
import { createEntityGeneric } from "@/services/generic/createEntityService";
import {
  fetchEntityDataGeneric,
  submitEntityFormGeneric,
  fetchAutocompleteOptionsGeneric,
} from "@/services/generic/editEntityService";
import { addFiltersToParams } from "@/lib/entity/filtersHelper";
import { addWithParams } from "@/lib/entity/entityRelationsHelper";

const ENDPOINT = "external-users";

async function performEntityAction(id, action) {
  const token = await getAuthToken();
  const response = await fetchWithTenant(`${API_URL_V2}${ENDPOINT}/${id}/${action}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const err = new Error(
      data.userMessage || data.message || "No se pudo ejecutar la acción."
    );
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return response.json().catch(() => ({ message: "Acción ejecutada correctamente." }));
}

export const externalUserService = {
  async list(filters = {}, pagination = {}) {
    const token = await getAuthToken();
    const { page = 1, perPage = 12 } = pagination;

    const queryParams = new URLSearchParams();
    addFiltersToParams(queryParams, filters);

    if (filters._requiredRelations && Array.isArray(filters._requiredRelations)) {
      addWithParams(queryParams, filters._requiredRelations);
    }

    queryParams.append("page", String(page));
    queryParams.append("perPage", String(perPage));

    return fetchEntitiesGeneric(
      `${API_URL_V2}${ENDPOINT}?${queryParams.toString()}`,
      token
    );
  },

  async getById(id) {
    const token = await getAuthToken();
    return fetchEntityDataGeneric(`${API_URL_V2}${ENDPOINT}/${id}`, token);
  },

  async create(data) {
    const token = await getAuthToken();
    const response = await createEntityGeneric(`${API_URL_V2}${ENDPOINT}`, data, token);
    const result = await response.json();
    return result.data || result;
  },

  async update(id, data) {
    const token = await getAuthToken();
    const response = await submitEntityFormGeneric(
      `${API_URL_V2}${ENDPOINT}/${id}`,
      "PUT",
      data,
      token
    );
    const result = await response.json();
    return result.data || result;
  },

  async delete(id) {
    const token = await getAuthToken();
    return deleteEntityGeneric(`${API_URL_V2}${ENDPOINT}/${id}`, undefined, token);
  },

  async getOptions() {
    const token = await getAuthToken();
    try {
      return await fetchAutocompleteOptionsGeneric(
        `${API_URL_V2}${ENDPOINT}/options`,
        token
      );
    } catch (error) {
      if ((error instanceof Response && error.status === 404) || error?.status === 404) {
        const result = await this.list({}, { page: 1, perPage: 100 });
        return (result.data || []).map((item) => ({
          value: item.id,
          label: item.name,
        }));
      }
      throw error;
    }
  },

  resendAccess(id) {
    return performEntityAction(id, "resend-access");
  },

  activate(id) {
    return performEntityAction(id, "activate");
  },

  deactivate(id) {
    return performEntityAction(id, "deactivate");
  },
};
