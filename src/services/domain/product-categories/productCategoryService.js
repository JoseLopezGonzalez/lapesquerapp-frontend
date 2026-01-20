/**
 * Service de dominio para Product Categories (Categorías de Productos)
 * 
 * Expone métodos semánticos de negocio para interactuar con categorías de productos.
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

const ENDPOINT = 'product-categories';

/**
 * Service de dominio para Product Categories
 */
export const productCategoryService = {
    /**
     * Lista todas las categorías de productos con filtros opcionales
     * @param {Object} filters - Filtros de búsqueda (search, ids, dates, etc.)
     * @param {Object} pagination - Opciones de paginación { page, perPage }
     * @returns {Promise<Object>} Datos paginados con categorías de productos
     * 
     * @example
     * const result = await productCategoryService.list({ search: 'Categoría A' }, { page: 1, perPage: 10 });
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
     * Obtiene una categoría de producto por ID
     * @param {string|number} id - ID de la categoría de producto
     * @returns {Promise<Object>} Datos de la categoría de producto
     * 
     * @example
     * const productCategory = await productCategoryService.getById(123);
     */
    async getById(id) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/${id}`;
        return fetchEntityDataGeneric(url, token);
    },

    /**
     * Crea una nueva categoría de producto
     * @param {Object} data - Datos de la categoría de producto a crear
     * @returns {Promise<Object>} Categoría de producto creada
     * 
     * @example
     * const productCategory = await productCategoryService.create({ name: 'Nueva Categoría', ... });
     */
    async create(data) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}`;
        const response = await createEntityGeneric(url, data, token);
        const result = await response.json();
        return result.data || result;
    },

    /**
     * Actualiza una categoría de producto existente
     * @param {string|number} id - ID de la categoría de producto
     * @param {Object} data - Datos a actualizar
     * @returns {Promise<Object>} Categoría de producto actualizada
     * 
     * @example
     * const productCategory = await productCategoryService.update(123, { name: 'Nombre Actualizado' });
     */
    async update(id, data) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/${id}`;
        const response = await submitEntityFormGeneric(url, 'PUT', data, token);
        const result = await response.json();
        return result.data || result;
    },

    /**
     * Elimina una categoría de producto
     * @param {string|number} id - ID de la categoría de producto
     * @returns {Promise<void>}
     * 
     * @example
     * await productCategoryService.delete(123);
     */
    async delete(id) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/${id}`;
        return deleteEntityGeneric(url, null, token);
    },

    /**
     * Elimina múltiples categorías de productos
     * @param {Array<string|number>} ids - Array de IDs de categorías de productos
     * @returns {Promise<void>}
     * 
     * @example
     * await productCategoryService.deleteMultiple([123, 456, 789]);
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
     * const options = await productCategoryService.getOptions();
     * // [{ value: 1, label: 'Categoría A' }, { value: 2, label: 'Categoría B' }]
     */
    async getOptions() {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/options`;
        return fetchAutocompleteOptionsGeneric(url, token);
    },
};

// Mantener compatibilidad con funciones exportadas anteriormente
// TODO: Migrar componentes que usan estas funciones a usar el service directamente
export const getProductCategoryOptions = async (token) => {
    const service = productCategoryService;
    const options = await service.getOptions();
    return options.map(opt => ({ id: opt.value, name: opt.label }));
};

export const getProductCategories = async (token) => {
    const service = productCategoryService;
    const result = await service.list({}, { perPage: 1000 }); // Obtener todas
    return result.data || [];
};

export const getProductCategory = async (id, token) => {
    const service = productCategoryService;
    return service.getById(id);
};

