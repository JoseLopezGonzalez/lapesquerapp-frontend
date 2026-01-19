/**
 * Service de dominio para Species (Especies)
 * 
 * Expone métodos semánticos de negocio para interactuar con especies.
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
import { addWithParams } from '@/lib/entity/entityRelationsHelper';

const ENDPOINT = 'species';

/**
 * Service de dominio para Species
 */
export const speciesService = {
    /**
     * Lista todas las especies con filtros opcionales
     * @param {Object} filters - Filtros de búsqueda (search, ids, etc.)
     * @param {Object} pagination - Opciones de paginación { page, perPage }
     * @returns {Promise<Object>} Datos paginados con especies
     * 
     * @example
     * const result = await speciesService.list({ search: 'Especie A' }, { page: 1, perPage: 10 });
     */
    async list(filters = {}, pagination = {}) {
        const token = await getAuthToken();
        const { page = 1, perPage = 12 } = pagination;
        
        const queryParams = new URLSearchParams();
        if (filters.search) queryParams.append('search', filters.search);
        if (filters.ids && Array.isArray(filters.ids)) {
            filters.ids.forEach(id => queryParams.append('ids[]', id));
        }
        
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
     * Obtiene una especie por ID
     * @param {string|number} id - ID de la especie
     * @returns {Promise<Object>} Datos de la especie
     * 
     * @example
     * const species = await speciesService.getById(123);
     */
    async getById(id) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/${id}`;
        return fetchEntityDataGeneric(url, token);
    },

    /**
     * Crea una nueva especie
     * @param {Object} data - Datos de la especie a crear
     * @returns {Promise<Object>} Especie creada
     * 
     * @example
     * const species = await speciesService.create({ name: 'Nueva Especie', ... });
     */
    async create(data) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}`;
        const response = await createEntityGeneric(url, data, token);
        const result = await response.json();
        return result.data || result;
    },

    /**
     * Actualiza una especie existente
     * @param {string|number} id - ID de la especie
     * @param {Object} data - Datos a actualizar
     * @returns {Promise<Object>} Especie actualizada
     * 
     * @example
     * const species = await speciesService.update(123, { name: 'Nombre Actualizado' });
     */
    async update(id, data) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/${id}`;
        const response = await submitEntityFormGeneric(url, 'PUT', data, token);
        const result = await response.json();
        return result.data || result;
    },

    /**
     * Elimina una especie
     * @param {string|number} id - ID de la especie
     * @returns {Promise<void>}
     * 
     * @example
     * await speciesService.delete(123);
     */
    async delete(id) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/${id}`;
        return deleteEntityGeneric(url, null, token);
    },

    /**
     * Elimina múltiples especies
     * @param {Array<string|number>} ids - Array de IDs de especies
     * @returns {Promise<void>}
     * 
     * @example
     * await speciesService.deleteMultiple([123, 456, 789]);
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
     * const options = await speciesService.getOptions();
     * // [{ value: 1, label: 'Especie A' }, { value: 2, label: 'Especie B' }]
     */
    async getOptions() {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/options`;
        return fetchAutocompleteOptionsGeneric(url, token);
    },
};

// Mantener compatibilidad con función exportada anteriormente
// TODO: Migrar componentes que usan esta función a usar el service directamente
export const getSpeciesOptions = async (token) => {
    const service = speciesService;
    const options = await service.getOptions();
    return options.map(opt => ({ id: opt.value, name: opt.label }));
};

