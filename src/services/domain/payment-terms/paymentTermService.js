/**
 * Service de dominio para Payment Terms (Términos de Pago)
 * 
 * Expone métodos semánticos de negocio para interactuar con términos de pago.
 * Oculta detalles técnicos (URLs, endpoints, configuración dinámica).
 * 
 * Este service encapsula la lógica genérica internamente, pero expone
 * métodos claros y predecibles para componentes y AI Chat.
 * 
 * Nota: El servicio anterior se llamaba "paymentTernService" (con typo).
 * Este servicio corrige el nombre a "paymentTermService".
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

const ENDPOINT = 'payment-terms';

/**
 * Service de dominio para Payment Terms
 */
export const paymentTermService = {
    /**
     * Lista todos los términos de pago con filtros opcionales
     * @param {Object} filters - Filtros de búsqueda (search, ids, dates, etc.)
     * @param {Object} pagination - Opciones de paginación { page, perPage }
     * @returns {Promise<Object>} Datos paginados con términos de pago
     * 
     * @example
     * const result = await paymentTermService.list({ search: '30 días' }, { page: 1, perPage: 10 });
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
     * Obtiene un término de pago por ID
     * @param {string|number} id - ID del término de pago
     * @returns {Promise<Object>} Datos del término de pago
     * 
     * @example
     * const paymentTerm = await paymentTermService.getById(123);
     */
    async getById(id) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/${id}`;
        return fetchEntityDataGeneric(url, token);
    },

    /**
     * Crea un nuevo término de pago
     * @param {Object} data - Datos del término de pago a crear
     * @returns {Promise<Object>} Término de pago creado
     * 
     * @example
     * const paymentTerm = await paymentTermService.create({ name: '30 días', ... });
     */
    async create(data) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}`;
        const response = await createEntityGeneric(url, data, token);
        const result = await response.json();
        return result.data || result;
    },

    /**
     * Actualiza un término de pago existente
     * @param {string|number} id - ID del término de pago
     * @param {Object} data - Datos a actualizar
     * @returns {Promise<Object>} Término de pago actualizado
     * 
     * @example
     * const paymentTerm = await paymentTermService.update(123, { name: '60 días' });
     */
    async update(id, data) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/${id}`;
        const response = await submitEntityFormGeneric(url, 'PUT', data, token);
        const result = await response.json();
        return result.data || result;
    },

    /**
     * Elimina un término de pago
     * @param {string|number} id - ID del término de pago
     * @returns {Promise<void>}
     * 
     * @example
     * await paymentTermService.delete(123);
     */
    async delete(id) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/${id}`;
        return deleteEntityGeneric(url, null, token);
    },

    /**
     * Elimina múltiples términos de pago
     * @param {Array<string|number>} ids - Array de IDs de términos de pago
     * @returns {Promise<void>}
     * 
     * @example
     * await paymentTermService.deleteMultiple([123, 456, 789]);
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
     * const options = await paymentTermService.getOptions();
     * // [{ value: 1, label: '30 días' }, { value: 2, label: '60 días' }]
     */
    async getOptions() {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/options`;
        return fetchAutocompleteOptionsGeneric(url, token);
    },
};

// Mantener compatibilidad con funciones exportadas anteriormente (con nombre con typo)
// TODO: Migrar componentes que usan estas funciones a usar el service directamente
// TODO: Eliminar estas funciones una vez que todos los componentes estén migrados
export const getPaymentTermOptions = async (token) => {
    const service = paymentTermService;
    const options = await service.getOptions();
    return options.map(opt => ({ id: opt.value, name: opt.label }));
};

// Mantener compatibilidad con el nombre anterior (con typo "Tern")
export const getPaymentTernOptions = async (token) => {
    return getPaymentTermOptions(token);
};

