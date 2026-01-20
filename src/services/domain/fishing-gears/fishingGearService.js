/**
 * Service de dominio para Fishing Gears (Artes de Pesca)
 * 
 * Expone métodos semánticos de negocio para interactuar con artes de pesca.
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
import { addFiltersToParams } from '@/lib/entity/filtersHelper';
import { addWithParams } from '@/lib/entity/entityRelationsHelper';

const ENDPOINT = 'fishing-gears';

/**
 * Service de dominio para Fishing Gears
 */
export const fishingGearService = {
    /**
     * Lista todos los artes de pesca con filtros opcionales
     * @param {Object} filters - Filtros de búsqueda (search, ids, dates, etc.)
     * @param {Object} pagination - Opciones de paginación { page, perPage }
     * @returns {Promise<Object>} Datos paginados con artes de pesca
     * 
     * @example
     * const result = await fishingGearService.list({ search: 'Arte A' }, { page: 1, perPage: 10 });
     */
    async list(filters = {}, pagination = {}) {
        const token = await getAuthToken();
        const { page = 1, perPage = 12 } = pagination;
        
        const queryParams = new URLSearchParams();
        
        // Agregar todos los filtros genéricos usando el helper
        addFiltersToParams(queryParams, filters);
        
        // Agregar parámetros with[] para cargar relaciones necesarias
        if (filters._requiredRelations && Array.isArray(filters._requiredRelations)) {
            addWithParams(queryParams, filters._requiredRelations);
        }
        
        queryParams.append('page', page);
        queryParams.append('perPage', perPage);
        
        const url = `${API_URL_V2}${ENDPOINT}?${queryParams.toString()}`;
        return fetchEntitiesGeneric(url, token);
    },

    /**
     * Obtiene un arte de pesca por ID
     * @param {string|number} id - ID del arte de pesca
     * @returns {Promise<Object>} Datos del arte de pesca
     * 
     * @example
     * const fishingGear = await fishingGearService.getById(123);
     */
    async getById(id) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/${id}`;
        return fetchEntityDataGeneric(url, token);
    },

    /**
     * Crea un nuevo arte de pesca
     * @param {Object} data - Datos del arte de pesca a crear
     * @returns {Promise<Object>} Arte de pesca creado
     * 
     * @example
     * const fishingGear = await fishingGearService.create({ name: 'Nuevo Arte', ... });
     */
    async create(data) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}`;
        const response = await createEntityGeneric(url, data, token);
        const result = await response.json();
        return result.data || result;
    },

    /**
     * Actualiza un arte de pesca existente
     * @param {string|number} id - ID del arte de pesca
     * @param {Object} data - Datos a actualizar
     * @returns {Promise<Object>} Arte de pesca actualizado
     * 
     * @example
     * const fishingGear = await fishingGearService.update(123, { name: 'Nombre Actualizado' });
     */
    async update(id, data) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/${id}`;
        const response = await submitEntityFormGeneric(url, 'PUT', data, token);
        const result = await response.json();
        return result.data || result;
    },

    /**
     * Elimina un arte de pesca
     * @param {string|number} id - ID del arte de pesca
     * @returns {Promise<void>}
     * 
     * @example
     * await fishingGearService.delete(123);
     */
    async delete(id) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/${id}`;
        return deleteEntityGeneric(url, null, token);
    },

    /**
     * Elimina múltiples artes de pesca
     * @param {Array<string|number>} ids - Array de IDs de artes de pesca
     * @returns {Promise<void>}
     * 
     * @example
     * await fishingGearService.deleteMultiple([123, 456, 789]);
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
     * const options = await fishingGearService.getOptions();
     * // [{ value: 1, label: 'Arte A' }, { value: 2, label: 'Arte B' }]
     */
    async getOptions() {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/options`;
        return fetchAutocompleteOptionsGeneric(url, token);
    },
};

