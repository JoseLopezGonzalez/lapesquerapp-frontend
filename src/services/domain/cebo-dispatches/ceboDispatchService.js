/**
 * Service de dominio para Cebo Dispatches (Despachos de Cebo)
 * 
 * Expone métodos semánticos de negocio para interactuar con despachos de cebo.
 * Oculta detalles técnicos (URLs, endpoints, configuración dinámica).
 * 
 * Este service encapsula la lógica genérica internamente, pero expone
 * métodos claros y predecibles para componentes y AI Chat.
 */

import { API_URL_V2 } from '@/configs/config';
import { getAuthToken } from '@/lib/auth/getAuthToken';
import { 
    fetchEntitiesGeneric, 
    deleteEntityGeneric, 
    performActionGeneric,
    downloadFileGeneric
} from '@/services/generic/entityService';
import { 
    createEntityGeneric 
} from '@/services/generic/createEntityService';
import { 
    fetchEntityDataGeneric, 
    submitEntityFormGeneric,
    fetchAutocompleteOptionsGeneric
} from '@/services/generic/editEntityService';

const ENDPOINT = 'cebo-dispatches';

/**
 * Service de dominio para Cebo Dispatches
 */
export const ceboDispatchService = {
    /**
     * Lista todos los despachos de cebo con filtros opcionales
     * @param {Object} filters - Filtros de búsqueda (search, ids, etc.)
     * @param {Object} pagination - Opciones de paginación { page, perPage }
     * @returns {Promise<Object>} Datos paginados con despachos de cebo
     * 
     * @example
     * const result = await ceboDispatchService.list({ search: 'Despacho A' }, { page: 1, perPage: 10 });
     */
    async list(filters = {}, pagination = {}) {
        const token = await getAuthToken();
        const { page = 1, perPage = 12 } = pagination;
        
        // Construir query string desde filtros
        const queryParams = new URLSearchParams();
        if (filters.search) queryParams.append('search', filters.search);
        if (filters.ids && Array.isArray(filters.ids)) {
            filters.ids.forEach(id => queryParams.append('ids[]', id));
        }
        queryParams.append('page', page);
        queryParams.append('perPage', perPage);
        
        const url = `${API_URL_V2}${ENDPOINT}?${queryParams.toString()}`;
        return fetchEntitiesGeneric(url, token);
    },

    /**
     * Obtiene un despacho de cebo por ID
     * @param {string|number} id - ID del despacho de cebo
     * @returns {Promise<Object>} Datos del despacho de cebo
     * 
     * @example
     * const ceboDispatch = await ceboDispatchService.getById(123);
     */
    async getById(id) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/${id}`;
        return fetchEntityDataGeneric(url, token);
    },

    /**
     * Crea un nuevo despacho de cebo
     * @param {Object} data - Datos del despacho de cebo a crear
     * @returns {Promise<Object>} Despacho de cebo creado
     * 
     * @example
     * const ceboDispatch = await ceboDispatchService.create({ ... });
     */
    async create(data) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}`;
        const response = await createEntityGeneric(url, data, token);
        const result = await response.json();
        return result.data || result;
    },

    /**
     * Actualiza un despacho de cebo existente
     * @param {string|number} id - ID del despacho de cebo
     * @param {Object} data - Datos a actualizar
     * @returns {Promise<Object>} Despacho de cebo actualizado
     * 
     * @example
     * const ceboDispatch = await ceboDispatchService.update(123, { ... });
     */
    async update(id, data) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/${id}`;
        const response = await submitEntityFormGeneric(url, 'PUT', data, token);
        const result = await response.json();
        return result.data || result;
    },

    /**
     * Elimina un despacho de cebo
     * @param {string|number} id - ID del despacho de cebo
     * @returns {Promise<void>}
     * 
     * @example
     * await ceboDispatchService.delete(123);
     */
    async delete(id) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/${id}`;
        return deleteEntityGeneric(url, null, token);
    },

    /**
     * Elimina múltiples despachos de cebo
     * @param {Array<string|number>} ids - Array de IDs de despachos de cebo
     * @returns {Promise<void>}
     * 
     * @example
     * await ceboDispatchService.deleteMultiple([123, 456, 789]);
     */
    async deleteMultiple(ids) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}`;
        return deleteEntityGeneric(url, { ids }, token);
    },

    /**
     * Obtiene opciones para autocompletado (formato {value, label})
     * @returns {Promise<Array<{value: any, label: string}>>} Opciones para Combobox
     * 
     * @example
     * const options = await ceboDispatchService.getOptions();
     * // [{ value: 1, label: 'Despacho A' }, { value: 2, label: 'Despacho B' }]
     */
    async getOptions() {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/options`;
        return fetchAutocompleteOptionsGeneric(url, token);
    },
};

