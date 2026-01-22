/**
 * Service de dominio para Stores (Almacenes)
 * 
 * Expone métodos semánticos de negocio para interactuar con almacenes.
 * Oculta detalles técnicos (URLs, endpoints, configuración dinámica).
 * 
 * Este service encapsula la lógica genérica internamente, pero expone
 * métodos claros y predecibles para componentes y AI Chat.
 * 
 * Nota: Este servicio incluye métodos específicos de negocio además de CRUD básico
 * (estadísticas de stock, palets registrados, etc.).
 */

import { API_URL_V2 } from '@/configs/config';
import { getAuthToken } from '@/lib/auth/getAuthToken';
import { fetchWithTenant } from '@lib/fetchWithTenant';
import { getErrorMessage } from '@/lib/api/apiHelpers';
import { getUserAgent } from '@/lib/utils/getUserAgent';
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

const ENDPOINT = 'stores';

/**
 * Service de dominio para Stores
 */
export const storeService = {
    /**
     * Lista todos los almacenes con filtros opcionales
     * @param {Object} filters - Filtros de búsqueda (search, ids, etc.)
     * @param {Object} pagination - Opciones de paginación { page, perPage }
     * @returns {Promise<Object>} Datos paginados con almacenes { data, links, meta }
     * 
     * @example
     * const result = await storeService.list({}, { page: 1, perPage: 6 });
     */
    async list(filters = {}, pagination = {}) {
        const token = await getAuthToken();
        const { page = 1, perPage = 6 } = pagination; // Default 6 para stores
        
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
        const result = await fetchEntitiesGeneric(url, token);
        return {
            data: result.data || [],
            links: result.links || null,
            meta: result.meta || null
        };
    },

    /**
     * Obtiene un almacén por ID
     * @param {string|number} id - ID del almacén
     * @returns {Promise<Object>} Datos del almacén
     * 
     * @example
     * const store = await storeService.getById(123);
     */
    async getById(id) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/${id}`;
        return fetchEntityDataGeneric(url, token);
    },

    /**
     * Crea un nuevo almacén
     * @param {Object} data - Datos del almacén a crear
     * @returns {Promise<Object>} Almacén creado
     * 
     * @example
     * const store = await storeService.create({ name: 'Nuevo Almacén', ... });
     */
    async create(data) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}`;
        const response = await createEntityGeneric(url, data, token);
        const result = await response.json();
        return result.data || result;
    },

    /**
     * Actualiza un almacén existente
     * @param {string|number} id - ID del almacén
     * @param {Object} data - Datos a actualizar
     * @returns {Promise<Object>} Almacén actualizado
     * 
     * @example
     * const store = await storeService.update(123, { name: 'Nombre Actualizado' });
     */
    async update(id, data) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/${id}`;
        const response = await submitEntityFormGeneric(url, 'PUT', data, token);
        const result = await response.json();
        return result.data || result;
    },

    /**
     * Elimina un almacén
     * @param {string|number} id - ID del almacén
     * @returns {Promise<void>}
     * 
     * @example
     * await storeService.delete(123);
     */
    async delete(id) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/${id}`;
        return deleteEntityGeneric(url, null, token);
    },

    /**
     * Elimina múltiples almacenes
     * @param {Array<string|number>} ids - Array de IDs de almacenes
     * @returns {Promise<void>}
     * 
     * @example
     * await storeService.deleteMultiple([123, 456, 789]);
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
     * const options = await storeService.getOptions();
     * // [{ value: 1, label: 'Almacén A' }, { value: 2, label: 'Almacén B' }]
     */
    async getOptions() {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/options`;
        return fetchAutocompleteOptionsGeneric(url, token);
    },

    // ========== Métodos específicos de negocio (Store-specific) ==========

    /**
     * Obtiene estadísticas del stock total
     * @returns {Promise<Object>} Estadísticas de stock total
     * 
     * @example
     * const stats = await storeService.getTotalStockStats();
     */
    async getTotalStockStats() {
        const token = await getAuthToken();
        const url = `${API_URL_V2}statistics/stock/total`;
        
        const response = await fetchWithTenant(url, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                'User-Agent': getUserAgent(),
            },
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(getErrorMessage(errorData) || 'Error al obtener el stock total');
        }
        
        return await response.json();
    },

    /**
     * Obtiene el stock total agrupado por especies
     * @returns {Promise<Array>} Array de objetos con { id, name, total_kg }
     * 
     * @example
     * const stats = await storeService.getStockBySpeciesStats();
     */
    async getStockBySpeciesStats() {
        const token = await getAuthToken();
        const url = `${API_URL_V2}statistics/stock/total-by-species`;
        
        const response = await fetchWithTenant(url, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                'User-Agent': getUserAgent(),
            },
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(getErrorMessage(errorData) || 'Error al obtener el stock por especies');
        }
        
        return await response.json();
    },

    /**
     * Obtiene el stock total agrupado por productos
     * @returns {Promise<Array>} Array de objetos con { id, name, total_kg, percentage }
     * 
     * @example
     * const stats = await storeService.getStockByProducts();
     */
    async getStockByProducts() {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/total-stock-by-products`;
        
        const response = await fetchWithTenant(url, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                'User-Agent': getUserAgent(),
            },
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(getErrorMessage(errorData) || 'Error al obtener el stock por productos');
        }
        
        return await response.json();
    },

    /**
     * Obtiene palets registrados (almacén fantasma)
     * Retorna todos los palets en estado registered (state_id = 1)
     * @returns {Promise<Object>} Objeto con formato de almacén fantasma
     * 
     * @example
     * const registeredPallets = await storeService.getRegisteredPallets();
     */
    async getRegisteredPallets() {
        const token = await getAuthToken();
        const url = `${API_URL_V2}pallets/registered`;
        
        const response = await fetchWithTenant(url, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                'User-Agent': getUserAgent(),
            },
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(getErrorMessage(errorData) || 'Error al obtener los palets registrados');
        }
        
        const data = await response.json();
        // La respuesta puede venir como {data: {...}} o directamente como el objeto
        return data?.data || data;
    },
};

// Mantener compatibilidad con funciones exportadas anteriormente
// TODO: Migrar componentes que usan estas funciones a usar el service directamente
export const getStore = async (id, token) => {
    const service = storeService;
    return service.getById(id);
};

export const getStores = async (token, page = 1) => {
    const service = storeService;
    return service.list({}, { page, perPage: 6 });
};

export const getStoreOptions = async (token) => {
    const service = storeService;
    const options = await service.getOptions();
    return options.map(opt => ({ id: opt.value, name: opt.label }));
};

export const getTotalStockStats = async (token) => {
    const service = storeService;
    return service.getTotalStockStats();
};

export const getStockBySpeciesStats = async (token) => {
    const service = storeService;
    return service.getStockBySpeciesStats();
};

export const getStockByProducts = async (token) => {
    const service = storeService;
    return service.getStockByProducts();
};

export const getRegisteredPallets = async (token) => {
    const service = storeService;
    return service.getRegisteredPallets();
};

