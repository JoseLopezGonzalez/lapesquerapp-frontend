/**
 * Service de dominio para Salespeople (Comerciales/Vendedores)
 * 
 * Expone métodos semánticos de negocio para interactuar con comerciales.
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
import { addFiltersToParams } from '@/lib/entity/filtersHelper';
import { addWithParams } from '@/lib/entity/entityRelationsHelper';

const ENDPOINT = 'salespeople';

/**
 * Service de dominio para Salespeople
 */
export const salespersonService = {
    /**
     * Lista todos los comerciales con filtros opcionales
     * @param {Object} filters - Filtros de búsqueda (search, ids, dates, etc.)
     * @param {Object} pagination - Opciones de paginación { page, perPage }
     * @returns {Promise<Object>} Datos paginados con comerciales
     * 
     * @example
     * const result = await salespersonService.list({ search: 'Comercial A' }, { page: 1, perPage: 10 });
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
     * Obtiene un comercial por ID
     * @param {string|number} id - ID del comercial
     * @returns {Promise<Object>} Datos del comercial
     * 
     * @example
     * const salesperson = await salespersonService.getById(123);
     */
    async getById(id) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/${id}`;
        return fetchEntityDataGeneric(url, token);
    },

    /**
     * Crea un nuevo comercial
     * @param {Object} data - Datos del comercial a crear
     * @returns {Promise<Object>} Comercial creado
     * 
     * @example
     * const salesperson = await salespersonService.create({ name: 'Nuevo Comercial', ... });
     */
    async create(data) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}`;
        const response = await createEntityGeneric(url, data, token);
        const result = await response.json();
        return result.data || result;
    },

    /**
     * Actualiza un comercial existente
     * @param {string|number} id - ID del comercial
     * @param {Object} data - Datos a actualizar
     * @returns {Promise<Object>} Comercial actualizado
     * 
     * @example
     * const salesperson = await salespersonService.update(123, { name: 'Nombre Actualizado' });
     */
    async update(id, data) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/${id}`;
        const response = await submitEntityFormGeneric(url, 'PUT', data, token);
        const result = await response.json();
        return result.data || result;
    },

    /**
     * Elimina un comercial
     * @param {string|number} id - ID del comercial
     * @returns {Promise<void>}
     * 
     * @example
     * await salespersonService.delete(123);
     */
    async delete(id) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/${id}`;
        return deleteEntityGeneric(url, null, token);
    },

    /**
     * Elimina múltiples comerciales
     * @param {Array<string|number>} ids - Array de IDs de comerciales
     * @returns {Promise<void>}
     * 
     * @example
     * await salespersonService.deleteMultiple([123, 456, 789]);
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
     * const options = await salespersonService.getOptions();
     * // [{ value: 1, label: 'Comercial A' }, { value: 2, label: 'Comercial B' }]
     */
    async getOptions() {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/options`;
        return fetchAutocompleteOptionsGeneric(url, token);
    },
};

// Mantener compatibilidad con función exportada anteriormente
// TODO: Migrar componentes que usan esta función a usar el service directamente
export const getSalespeopleOptions = async (token) => {
    const service = salespersonService;
    const options = await service.getOptions();
    return options.map(opt => ({ id: opt.value, name: opt.label }));
};

