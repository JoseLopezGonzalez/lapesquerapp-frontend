/**
 * Service de dominio para Raw Material Receptions (Recepciones de Materia Prima)
 * 
 * Expone métodos semánticos de negocio para interactuar con recepciones de materia prima.
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

const ENDPOINT = 'raw-material-receptions';

/**
 * Service de dominio para Raw Material Receptions
 */
export const rawMaterialReceptionService = {
    /**
     * Lista todas las recepciones de materia prima con filtros opcionales
     * @param {Object} filters - Filtros de búsqueda (search, ids, dates, suppliers, species, products, etc.)
     * @param {Object} pagination - Opciones de paginación { page, perPage }
     * @returns {Promise<Object>} Datos paginados con recepciones
     * 
     * @example
     * const result = await rawMaterialReceptionService.list({ search: 'Recepción A' }, { page: 1, perPage: 17 });
     */
    async list(filters = {}, pagination = {}) {
        if (typeof window !== 'undefined') {
            window.console.log('🔧 [rawMaterialReceptionService] list llamado con filters:', filters);
        }
        const token = await getAuthToken();
        const { page = 1, perPage = 17 } = pagination; // Default 17 para raw-material-receptions
        
        const queryParams = new URLSearchParams();
        if (filters.search) queryParams.append('search', filters.search);
        if (filters.ids && Array.isArray(filters.ids)) {
            filters.ids.forEach(id => queryParams.append('ids[]', id));
        }
        if (filters.dates) {
            if (filters.dates.start) queryParams.append('dates[start]', filters.dates.start);
            if (filters.dates.end) queryParams.append('dates[end]', filters.dates.end);
        }
        if (filters.suppliers && Array.isArray(filters.suppliers)) {
            filters.suppliers.forEach(id => queryParams.append('suppliers[]', id));
        }
        if (filters.species && Array.isArray(filters.species)) {
            filters.species.forEach(id => queryParams.append('species[]', id));
        }
        if (filters.products && Array.isArray(filters.products)) {
            filters.products.forEach(id => queryParams.append('products[]', id));
        }
        
        // Agregar parámetros with[] para cargar relaciones necesarias
        if (filters._requiredRelations && Array.isArray(filters._requiredRelations)) {
            if (typeof window !== 'undefined') {
                window.console.log('✅ [rawMaterialReceptionService] Agregando relaciones:', filters._requiredRelations);
            }
            addWithParams(queryParams, filters._requiredRelations);
        } else {
            if (typeof window !== 'undefined') {
                window.console.log('⚠️ [rawMaterialReceptionService] No hay _requiredRelations en filters');
            }
        }
        
        queryParams.append('page', page);
        queryParams.append('perPage', perPage);
        
        const url = `${API_URL_V2}${ENDPOINT}?${queryParams.toString()}`;
        if (typeof window !== 'undefined') {
            window.console.log('🌐 [rawMaterialReceptionService] URL final:', url);
        }
        return fetchEntitiesGeneric(url, token);
    },

    /**
     * Obtiene una recepción de materia prima por ID
     * @param {string|number} id - ID de la recepción
     * @returns {Promise<Object>} Datos de la recepción
     * 
     * @example
     * const reception = await rawMaterialReceptionService.getById(123);
     */
    async getById(id) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/${id}`;
        return fetchEntityDataGeneric(url, token);
    },

    /**
     * Crea una nueva recepción de materia prima
     * @param {Object} data - Datos de la recepción a crear
     * @returns {Promise<Object>} Recepción creada
     * 
     * @example
     * const reception = await rawMaterialReceptionService.create({ ... });
     */
    async create(data) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}`;
        const response = await createEntityGeneric(url, data, token);
        const result = await response.json();
        return result.data || result;
    },

    /**
     * Actualiza una recepción de materia prima existente
     * @param {string|number} id - ID de la recepción
     * @param {Object} data - Datos a actualizar
     * @returns {Promise<Object>} Recepción actualizada
     * 
     * @example
     * const reception = await rawMaterialReceptionService.update(123, { ... });
     */
    async update(id, data) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/${id}`;
        const response = await submitEntityFormGeneric(url, 'PUT', data, token);
        const result = await response.json();
        return result.data || result;
    },

    /**
     * Elimina una recepción de materia prima
     * @param {string|number} id - ID de la recepción
     * @returns {Promise<void>}
     * 
     * @example
     * await rawMaterialReceptionService.delete(123);
     */
    async delete(id) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/${id}`;
        return deleteEntityGeneric(url, null, token);
    },

    /**
     * Elimina múltiples recepciones de materia prima
     * @param {Array<string|number>} ids - Array de IDs de recepciones
     * @returns {Promise<void>}
     * 
     * @example
     * await rawMaterialReceptionService.deleteMultiple([123, 456, 789]);
     */
    async deleteMultiple(ids) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}`;
        return deleteEntityGeneric(url, { ids }, token);
    },
};

// Mantener compatibilidad con funciones exportadas anteriormente
// TODO: Migrar componentes que usan estas funciones a usar el service directamente
export const getRawMaterialReception = async (receptionId, token) => {
    const service = rawMaterialReceptionService;
    return service.getById(receptionId);
};

export const createRawMaterialReception = async (receptionPayload) => {
    const service = rawMaterialReceptionService;
    return service.create(receptionPayload);
};

export const updateRawMaterialReception = async (receptionId, receptionPayload) => {
    const service = rawMaterialReceptionService;
    return service.update(receptionId, receptionPayload);
};

