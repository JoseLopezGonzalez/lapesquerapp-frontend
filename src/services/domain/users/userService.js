/**
 * Service de dominio para Users (Usuarios)
 * 
 * Expone métodos semánticos de negocio para interactuar con usuarios.
 */

import { API_URL_V2 } from '@/configs/config';
import { getAuthToken } from '@/lib/auth/getAuthToken';
import { 
    fetchEntitiesGeneric, 
    deleteEntityGeneric, 
    performActionGeneric
} from '@/services/generic/entityService';
import { 
    createEntityGeneric 
} from '@/services/generic/createEntityService';
import { 
    fetchEntityDataGeneric, 
    submitEntityFormGeneric,
    fetchAutocompleteOptionsGeneric
} from '@/services/generic/editEntityService';

const ENDPOINT = 'users';

export const userService = {
    async list(filters = {}, pagination = {}) {
        const token = await getAuthToken();
        const { page = 1, perPage = 12 } = pagination;
        
        const queryParams = new URLSearchParams();
        if (filters.search) queryParams.append('search', filters.search);
        if (filters.ids && Array.isArray(filters.ids)) {
            filters.ids.forEach(id => queryParams.append('ids[]', id));
        }
        if (filters.name) queryParams.append('name', filters.name);
        if (filters.email) queryParams.append('email', filters.email);
        if (filters.roles && Array.isArray(filters.roles)) {
            filters.roles.forEach(role => queryParams.append('roles[]', role));
        }
        if (filters.created_at) {
            if (filters.created_at.start) queryParams.append('created_at[start]', filters.created_at.start);
            if (filters.created_at.end) queryParams.append('created_at[end]', filters.created_at.end);
        }
        queryParams.append('page', page);
        queryParams.append('perPage', perPage);
        
        const url = `${API_URL_V2}${ENDPOINT}?${queryParams.toString()}`;
        return fetchEntitiesGeneric(url, token);
    },

    async getById(id) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/${id}`;
        return fetchEntityDataGeneric(url, token);
    },

    async create(data) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}`;
        const response = await createEntityGeneric(url, data, token);
        const result = await response.json();
        return result.data || result;
    },

    async update(id, data) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/${id}`;
        const response = await submitEntityFormGeneric(url, 'PUT', data, token);
        const result = await response.json();
        return result.data || result;
    },

    async delete(id) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/${id}`;
        return deleteEntityGeneric(url, null, token);
    },

    async deleteMultiple(ids) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}`;
        return deleteEntityGeneric(url, { ids }, token);
    },

    async getOptions() {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/options`;
        return fetchAutocompleteOptionsGeneric(url, token);
    },
};

