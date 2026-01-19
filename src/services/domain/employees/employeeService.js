/**
 * Service de dominio para Employees (Empleados)
 * 
 * Expone métodos semánticos de negocio para interactuar con empleados.
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
import { addFiltersToParams } from '@/lib/entity/filtersHelper';

const ENDPOINT = 'employees';

/**
 * Service de dominio para Employees
 */
export const employeeService = {
    /**
     * Lista todos los empleados con filtros opcionales
     * @param {Object} filters - Filtros de búsqueda (id, ids, name, nfc_uid, with_last_punch, etc.)
     * @param {Object} pagination - Opciones de paginación { page, perPage }
     * @returns {Promise<Object>} Datos paginados con empleados { data, links, meta }
     * 
     * @example
     * const result = await employeeService.list({ name: 'Juan' }, { page: 1, perPage: 10 });
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
        
        // Paginación
        queryParams.append('page', page);
        queryParams.append('perPage', perPage);
        
        const url = `${API_URL_V2}${ENDPOINT}?${queryParams.toString()}`;
        return fetchEntitiesGeneric(url, token);
    },

    /**
     * Obtiene un empleado por ID
     * @param {string|number} id - ID del empleado
     * @returns {Promise<Object>} Datos del empleado
     * 
     * @example
     * const employee = await employeeService.getById(123);
     */
    async getById(id) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/${id}`;
        return fetchEntityDataGeneric(url, token);
    },

    /**
     * Crea un nuevo empleado
     * @param {Object} data - Datos del empleado a crear { name, nfc_uid }
     * @returns {Promise<Object>} Empleado creado
     * 
     * @example
     * const employee = await employeeService.create({ name: 'Juan Pérez', nfc_uid: 'ABC123' });
     */
    async create(data) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}`;
        const response = await createEntityGeneric(url, data, token);
        const result = await response.json();
        return result.data || result;
    },

    /**
     * Actualiza un empleado existente
     * @param {string|number} id - ID del empleado
     * @param {Object} data - Datos a actualizar { name?, nfc_uid? }
     * @returns {Promise<Object>} Empleado actualizado
     * 
     * @example
     * const employee = await employeeService.update(123, { name: 'Nombre Actualizado' });
     */
    async update(id, data) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/${id}`;
        const response = await submitEntityFormGeneric(url, 'PUT', data, token);
        const result = await response.json();
        return result.data || result;
    },

    /**
     * Elimina un empleado
     * @param {string|number} id - ID del empleado
     * @returns {Promise<void>}
     * 
     * @example
     * await employeeService.delete(123);
     */
    async delete(id) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/${id}`;
        return deleteEntityGeneric(url, null, token);
    },

    /**
     * Elimina múltiples empleados
     * @param {Array<string|number>} ids - Array de IDs de empleados
     * @returns {Promise<void>}
     * 
     * @example
     * await employeeService.deleteMultiple([123, 456, 789]);
     */
    async deleteMultiple(ids) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}`;
        return deleteEntityGeneric(url, { ids }, token);
    },

    /**
     * Obtiene opciones para autocompletado (formato {value, label})
     * @param {Object} params - Parámetros opcionales { name? }
     * @returns {Promise<Array<{value: any, label: string}>>} Opciones para Combobox
     * 
     * @example
     * const options = await employeeService.getOptions({ name: 'Juan' });
     * // [{ value: 1, label: 'Juan Pérez' }, { value: 2, label: 'Juan García' }]
     */
    async getOptions(params = {}) {
        const token = await getAuthToken();
        const queryParams = new URLSearchParams();
        if (params.name) queryParams.append('name', params.name);
        
        const queryString = queryParams.toString();
        const url = `${API_URL_V2}${ENDPOINT}/options${queryString ? `?${queryString}` : ''}`;
        return fetchAutocompleteOptionsGeneric(url, token);
    },
};

// Mantener compatibilidad con funciones exportadas anteriormente
// TODO: Migrar componentes que usan estas funciones a usar el service directamente
export const getEmployees = async (token, params = {}) => {
    const service = employeeService;
    const filters = {};
    const pagination = {};
    
    // Mapear parámetros a filtros y paginación
    if (params.id) filters.id = params.id;
    if (params.ids) filters.ids = params.ids;
    if (params.name) filters.name = params.name;
    if (params.nfc_uid) filters.nfc_uid = params.nfc_uid;
    if (params.with_last_punch) filters.with_last_punch = params.with_last_punch;
    if (params.page) pagination.page = params.page;
    if (params.perPage) pagination.perPage = params.perPage;
    
    const result = await service.list(filters, pagination);
    return {
        data: result.data || [],
        links: result.links || null,
        meta: result.meta || null
    };
};

export const getEmployee = async (id, token) => {
    const service = employeeService;
    return service.getById(id);
};

export const createEmployee = async (employeeData, token) => {
    const service = employeeService;
    return service.create(employeeData);
};

export const updateEmployee = async (id, employeeData, token) => {
    const service = employeeService;
    return service.update(id, employeeData);
};

export const deleteEmployee = async (id, token) => {
    const service = employeeService;
    return service.delete(id);
};

export const getEmployeeOptions = async (token, params = {}) => {
    const service = employeeService;
    const options = await service.getOptions(params);
    return options.map(opt => ({ id: opt.value, name: opt.label, nfcUid: opt.nfcUid }));
};

