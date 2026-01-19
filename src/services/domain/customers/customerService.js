/**
 * Service de dominio para Customers (Clientes)
 * 
 * Expone métodos semánticos de negocio para interactuar con clientes.
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

const ENDPOINT = 'customers';

/**
 * Service de dominio para Customers
 */
export const customerService = {
    /**
     * Lista todos los clientes con filtros opcionales
     * @param {Object} filters - Filtros de búsqueda (search, ids, etc.)
     * @param {Object} pagination - Opciones de paginación { page, perPage }
     * @returns {Promise<Object>} Datos paginados con clientes
     * 
     * @example
     * const result = await customerService.list({ search: 'Cliente A' }, { page: 1, perPage: 10 });
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
     * Obtiene un cliente por ID
     * @param {string|number} id - ID del cliente
     * @returns {Promise<Object>} Datos del cliente
     * 
     * @example
     * const customer = await customerService.getById(123);
     */
    async getById(id) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/${id}`;
        return fetchEntityDataGeneric(url, token);
    },

    /**
     * Crea un nuevo cliente
     * @param {Object} data - Datos del cliente a crear
     * @returns {Promise<Object>} Cliente creado
     * 
     * @example
     * const customer = await customerService.create({ name: 'Nuevo Cliente', ... });
     */
    async create(data) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}`;
        const response = await createEntityGeneric(url, data, token);
        const result = await response.json();
        return result.data || result;
    },

    /**
     * Actualiza un cliente existente
     * @param {string|number} id - ID del cliente
     * @param {Object} data - Datos a actualizar
     * @returns {Promise<Object>} Cliente actualizado
     * 
     * @example
     * const customer = await customerService.update(123, { name: 'Nombre Actualizado' });
     */
    async update(id, data) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/${id}`;
        const response = await submitEntityFormGeneric(url, 'PUT', data, token);
        const result = await response.json();
        return result.data || result;
    },

    /**
     * Elimina un cliente
     * @param {string|number} id - ID del cliente
     * @returns {Promise<void>}
     * 
     * @example
     * await customerService.delete(123);
     */
    async delete(id) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/${id}`;
        return deleteEntityGeneric(url, null, token);
    },

    /**
     * Elimina múltiples clientes
     * @param {Array<string|number>} ids - Array de IDs de clientes
     * @returns {Promise<void>}
     * 
     * @example
     * await customerService.deleteMultiple([123, 456, 789]);
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
     * const options = await customerService.getOptions();
     * // [{ value: 1, label: 'Cliente A' }, { value: 2, label: 'Cliente B' }]
     */
    async getOptions() {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/options`;
        return fetchAutocompleteOptionsGeneric(url, token);
    },
};

// Mantener compatibilidad con funciones exportadas anteriormente
// TODO: Migrar componentes que usan estas funciones a usar el service directamente
export const getCustomersOptions = async (token) => {
    const service = customerService;
    const options = await service.getOptions();
    return options.map(opt => ({ id: opt.value, name: opt.label }));
};

export const getCustomer = async (id, token) => {
    const service = customerService;
    return service.getById(id);
};

