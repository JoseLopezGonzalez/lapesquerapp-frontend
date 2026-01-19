/**
 * Service de dominio para Suppliers (Proveedores)
 * 
 * Expone métodos semánticos de negocio para interactuar con proveedores.
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
import { addWithParams } from '@/lib/entity/entityRelationsHelper';
import { addFiltersToParams } from '@/lib/entity/filtersHelper';

const ENDPOINT = 'suppliers';

/**
 * Service de dominio para Suppliers
 */
export const supplierService = {
    /**
     * Lista todos los proveedores con filtros opcionales
     * @param {Object} filters - Filtros de búsqueda (search, ids, etc.)
     * @param {Object} pagination - Opciones de paginación { page, perPage }
     * @returns {Promise<Object>} Datos paginados con proveedores
     * 
     * @example
     * const result = await supplierService.list({ search: 'ACME' }, { page: 1, perPage: 10 });
     */
    async list(filters = {}, pagination = {}) {
        const token = await getAuthToken();
        const { page = 1, perPage = 12 } = pagination;
        
        // Construir query string desde filtros
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
     * Obtiene un proveedor por ID
     * @param {string|number} id - ID del proveedor
     * @returns {Promise<Object>} Datos del proveedor
     * 
     * @example
     * const supplier = await supplierService.getById(123);
     */
    async getById(id) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/${id}`;
        return fetchEntityDataGeneric(url, token);
    },

    /**
     * Crea un nuevo proveedor
     * @param {Object} data - Datos del proveedor a crear
     * @returns {Promise<Object>} Proveedor creado
     * 
     * @example
     * const supplier = await supplierService.create({ name: 'Nuevo Proveedor', ... });
     */
    async create(data) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}`;
        const response = await createEntityGeneric(url, data, token);
        const result = await response.json();
        return result.data || result;
    },

    /**
     * Actualiza un proveedor existente
     * @param {string|number} id - ID del proveedor
     * @param {Object} data - Datos a actualizar
     * @returns {Promise<Object>} Proveedor actualizado
     * 
     * @example
     * const supplier = await supplierService.update(123, { name: 'Nombre Actualizado' });
     */
    async update(id, data) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/${id}`;
        const response = await submitEntityFormGeneric(url, 'PUT', data, token);
        const result = await response.json();
        return result.data || result;
    },

    /**
     * Elimina un proveedor
     * @param {string|number} id - ID del proveedor
     * @returns {Promise<void>}
     * 
     * @example
     * await supplierService.delete(123);
     */
    async delete(id) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/${id}`;
        return deleteEntityGeneric(url, null, token);
    },

    /**
     * Elimina múltiples proveedores
     * @param {Array<string|number>} ids - Array de IDs de proveedores
     * @returns {Promise<void>}
     * 
     * @example
     * await supplierService.deleteMultiple([123, 456, 789]);
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
     * const options = await supplierService.getOptions();
     * // [{ value: 1, label: 'Proveedor A' }, { value: 2, label: 'Proveedor B' }]
     */
    async getOptions() {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/options`;
        return fetchAutocompleteOptionsGeneric(url, token);
    },
};

