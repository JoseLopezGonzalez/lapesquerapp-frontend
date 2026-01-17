/**
 * Service de dominio para Product Families (Familias de Productos)
 * 
 * Expone métodos semánticos de negocio para interactuar con familias de productos.
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

const ENDPOINT = 'product-families';

/**
 * Service de dominio para Product Families
 */
export const productFamilyService = {
    /**
     * Lista todas las familias de productos con filtros opcionales
     * @param {Object} filters - Filtros de búsqueda (search, ids, etc.)
     * @param {Object} pagination - Opciones de paginación { page, perPage }
     * @returns {Promise<Object>} Datos paginados con familias de productos
     * 
     * @example
     * const result = await productFamilyService.list({ search: 'Familia A' }, { page: 1, perPage: 10 });
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
     * Obtiene una familia de productos por ID
     * @param {string|number} id - ID de la familia de productos
     * @returns {Promise<Object>} Datos de la familia de productos
     * 
     * @example
     * const productFamily = await productFamilyService.getById(123);
     */
    async getById(id) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/${id}`;
        return fetchEntityDataGeneric(url, token);
    },

    /**
     * Crea una nueva familia de productos
     * @param {Object} data - Datos de la familia de productos a crear
     * @returns {Promise<Object>} Familia de productos creada
     * 
     * @example
     * const productFamily = await productFamilyService.create({ name: 'Nueva Familia', ... });
     */
    async create(data) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}`;
        const response = await createEntityGeneric(url, data, token);
        const result = await response.json();
        return result.data || result;
    },

    /**
     * Actualiza una familia de productos existente
     * @param {string|number} id - ID de la familia de productos
     * @param {Object} data - Datos a actualizar
     * @returns {Promise<Object>} Familia de productos actualizada
     * 
     * @example
     * const productFamily = await productFamilyService.update(123, { name: 'Nombre Actualizado' });
     */
    async update(id, data) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/${id}`;
        const response = await submitEntityFormGeneric(url, 'PUT', data, token);
        const result = await response.json();
        return result.data || result;
    },

    /**
     * Elimina una familia de productos
     * @param {string|number} id - ID de la familia de productos
     * @returns {Promise<void>}
     * 
     * @example
     * await productFamilyService.delete(123);
     */
    async delete(id) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/${id}`;
        return deleteEntityGeneric(url, null, token);
    },

    /**
     * Elimina múltiples familias de productos
     * @param {Array<string|number>} ids - Array de IDs de familias de productos
     * @returns {Promise<void>}
     * 
     * @example
     * await productFamilyService.deleteMultiple([123, 456, 789]);
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
     * const options = await productFamilyService.getOptions();
     * // [{ value: 1, label: 'Familia A' }, { value: 2, label: 'Familia B' }]
     */
    async getOptions() {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/options`;
        return fetchAutocompleteOptionsGeneric(url, token);
    },
};

// Mantener compatibilidad con funciones exportadas anteriormente
// TODO: Migrar componentes que usan estas funciones a usar el service directamente
export const getProductFamilyOptions = async (token) => {
    const service = productFamilyService;
    const options = await service.getOptions();
    return options.map(opt => ({ id: opt.value, name: opt.label }));
};

export const getProductFamilies = async (token) => {
    const service = productFamilyService;
    const result = await service.list({}, { perPage: 1000 }); // Obtener todas
    return result.data || [];
};

export const getProductFamily = async (id, token) => {
    const service = productFamilyService;
    return service.getById(id);
};

