/**
 * Service de dominio para Capture Zones (Zonas de Captura)
 * 
 * Expone métodos semánticos de negocio para interactuar con zonas de captura.
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

const ENDPOINT = 'capture-zones';

/**
 * Service de dominio para Capture Zones
 */
export const captureZoneService = {
    /**
     * Lista todas las zonas de captura con filtros opcionales
     * @param {Object} filters - Filtros de búsqueda (search, ids, etc.)
     * @param {Object} pagination - Opciones de paginación { page, perPage }
     * @returns {Promise<Object>} Datos paginados con zonas de captura
     * 
     * @example
     * const result = await captureZoneService.list({ search: 'Zona A' }, { page: 1, perPage: 10 });
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
     * Obtiene una zona de captura por ID
     * @param {string|number} id - ID de la zona de captura
     * @returns {Promise<Object>} Datos de la zona de captura
     * 
     * @example
     * const captureZone = await captureZoneService.getById(123);
     */
    async getById(id) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/${id}`;
        return fetchEntityDataGeneric(url, token);
    },

    /**
     * Crea una nueva zona de captura
     * @param {Object} data - Datos de la zona de captura a crear
     * @returns {Promise<Object>} Zona de captura creada
     * 
     * @example
     * const captureZone = await captureZoneService.create({ name: 'Nueva Zona', ... });
     */
    async create(data) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}`;
        const response = await createEntityGeneric(url, data, token);
        const result = await response.json();
        return result.data || result;
    },

    /**
     * Actualiza una zona de captura existente
     * @param {string|number} id - ID de la zona de captura
     * @param {Object} data - Datos a actualizar
     * @returns {Promise<Object>} Zona de captura actualizada
     * 
     * @example
     * const captureZone = await captureZoneService.update(123, { name: 'Nombre Actualizado' });
     */
    async update(id, data) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/${id}`;
        const response = await submitEntityFormGeneric(url, 'PUT', data, token);
        const result = await response.json();
        return result.data || result;
    },

    /**
     * Elimina una zona de captura
     * @param {string|number} id - ID de la zona de captura
     * @returns {Promise<void>}
     * 
     * @example
     * await captureZoneService.delete(123);
     */
    async delete(id) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/${id}`;
        return deleteEntityGeneric(url, null, token);
    },

    /**
     * Elimina múltiples zonas de captura
     * @param {Array<string|number>} ids - Array de IDs de zonas de captura
     * @returns {Promise<void>}
     * 
     * @example
     * await captureZoneService.deleteMultiple([123, 456, 789]);
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
     * const options = await captureZoneService.getOptions();
     * // [{ value: 1, label: 'Zona A' }, { value: 2, label: 'Zona B' }]
     */
    async getOptions() {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/options`;
        return fetchAutocompleteOptionsGeneric(url, token);
    },
};

