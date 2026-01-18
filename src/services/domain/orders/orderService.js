/**
 * Service de dominio para Orders (Pedidos)
 * 
 * Expone métodos semánticos de negocio para interactuar con pedidos.
 * Oculta detalles técnicos (URLs, endpoints, configuración dinámica).
 * 
 * NOTA: Este servicio actúa como wrapper/adapter del orderService.js existente,
 * que es muy complejo (18 métodos específicos de negocio). Este wrapper implementa
 * la interfaz estándar de servicios de dominio para permitir que EntityClient lo use,
 * mientras que los métodos específicos de orders (estadísticas, incidencias, etc.)
 * siguen estando disponibles directamente desde orderService.js.
 * 
 * Este service encapsula la lógica genérica internamente, pero expone
 * métodos claros y predecibles para componentes y AI Chat.
 */

import { API_URL_V2 } from '@/configs/config';
import { getAuthToken } from '@/lib/auth/getAuthToken';
import { 
    fetchEntitiesGeneric, 
    deleteEntityGeneric
} from '@/services/generic/entityService';
import { 
    fetchEntityDataGeneric, 
    submitEntityFormGeneric
} from '@/services/generic/editEntityService';
// Importar funciones del orderService existente
import * as orderServiceFunctions from '@/services/orderService';

const ENDPOINT = 'orders';

/**
 * Service de dominio para Orders
 */
export const orderService = {
    /**
     * Lista todos los pedidos con filtros opcionales
     * 
     * NOTA: El orderService original tiene `getActiveOrders()` que devuelve órdenes activas.
     * Este método usa el endpoint genérico de listado que debería devolver todas las órdenes
     * con paginación. Si el endpoint `/orders` no soporta listado paginado, podría necesitarse
     * usar `getActiveOrders()` como alternativa.
     * 
     * @param {Object} filters - Filtros de búsqueda (search, ids, dates, customers, salespeople, status, etc.)
     * @param {Object} pagination - Opciones de paginación { page, perPage }
     * @returns {Promise<Object>} Datos paginados con pedidos
     * 
     * @example
     * const result = await orderService.list({ search: 'Pedido A' }, { page: 1, perPage: 12 });
     */
    async list(filters = {}, pagination = {}) {
        const token = await getAuthToken();
        const { page = 1, perPage = 12 } = pagination;
        
        const queryParams = new URLSearchParams();
        if (filters.search) queryParams.append('search', filters.search);
        if (filters.ids && Array.isArray(filters.ids)) {
            filters.ids.forEach(id => queryParams.append('ids[]', id));
        }
        if (filters.status) queryParams.append('status', filters.status);
        if (filters.customer_id) queryParams.append('customer_id', filters.customer_id);
        if (filters.salesperson_id) queryParams.append('salesperson_id', filters.salesperson_id);
        if (filters.dates) {
            if (filters.dates.start) queryParams.append('dates[start]', filters.dates.start);
            if (filters.dates.end) queryParams.append('dates[end]', filters.dates.end);
        }
        queryParams.append('page', page);
        queryParams.append('perPage', perPage);
        
        const url = `${API_URL_V2}${ENDPOINT}?${queryParams.toString()}`;
        return fetchEntitiesGeneric(url, token);
    },

    /**
     * Obtiene un pedido por ID
     * @param {string|number} id - ID del pedido
     * @returns {Promise<Object>} Datos del pedido
     * 
     * @example
     * const order = await orderService.getById(123);
     */
    async getById(id) {
        const token = await getAuthToken();
        // Usar función del orderService existente
        return orderServiceFunctions.getOrder(id, token);
    },

    /**
     * Crea un nuevo pedido
     * @param {Object} data - Datos del pedido a crear
     * @returns {Promise<Object>} Pedido creado
     * 
     * @example
     * const order = await orderService.create({ customer_id: 1, ... });
     */
    async create(data) {
        // Usar función del orderService existente que maneja el token internamente
        return orderServiceFunctions.createOrder(data);
    },

    /**
     * Actualiza un pedido existente
     * @param {string|number} id - ID del pedido
     * @param {Object} data - Datos a actualizar
     * @returns {Promise<Object>} Pedido actualizado
     * 
     * @example
     * const order = await orderService.update(123, { status: 'completed' });
     */
    async update(id, data) {
        const token = await getAuthToken();
        // Usar función del orderService existente
        return orderServiceFunctions.updateOrder(id, data, token);
    },

    /**
     * Elimina un pedido
     * @param {string|number} id - ID del pedido
     * @returns {Promise<void>}
     * 
     * @example
     * await orderService.delete(123);
     */
    async delete(id) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}/${id}`;
        return deleteEntityGeneric(url, null, token);
    },

    /**
     * Elimina múltiples pedidos
     * @param {Array<string|number>} ids - Array de IDs de pedidos
     * @returns {Promise<void>}
     * 
     * @example
     * await orderService.deleteMultiple([123, 456, 789]);
     */
    async deleteMultiple(ids) {
        const token = await getAuthToken();
        const url = `${API_URL_V2}${ENDPOINT}`;
        return deleteEntityGeneric(url, { ids }, token);
    },

    /**
     * Obtiene opciones para autocompletado (formato {value, label})
     * Usa getActiveOrdersOptions del orderService existente
     * @returns {Promise<Array<{value: any, label: string}>>} Opciones para Combobox
     * 
     * @example
     * const options = await orderService.getOptions();
     */
    async getOptions() {
        const token = await getAuthToken();
        // Usar función del orderService existente
        const options = await orderServiceFunctions.getActiveOrdersOptions(token);
        // Convertir al formato estándar si es necesario
        if (options && Array.isArray(options)) {
            return options.map(opt => ({
                value: opt.id || opt.value,
                label: opt.name || opt.label || opt.toString()
            }));
        }
        return options || [];
    },

    // ========== Métodos específicos de Orders (reexportar del orderService original) ==========
    
    /**
     * Obtiene órdenes activas
     * @returns {Promise<Array>} Array de órdenes activas
     */
    async getActiveOrders() {
        try {
            console.log('[orderService.getActiveOrders] 🔄 Obteniendo token...');
            const token = await getAuthToken();
            console.log('[orderService.getActiveOrders] ✅ Token obtenido, longitud:', token?.length || 0, 'primeros 10 chars:', token?.substring(0, 10) || 'none');
            const orders = await orderServiceFunctions.getActiveOrders(token);
            console.log('[orderService.getActiveOrders] ✅ Pedidos obtenidos, tipo:', typeof orders, '¿Es array?:', Array.isArray(orders), 'cantidad:', Array.isArray(orders) ? orders.length : 'N/A');
            return orders;
        } catch (error) {
            console.error('[orderService.getActiveOrders] ❌ Error obteniendo pedidos activos:', error.message);
            console.error('[orderService.getActiveOrders] ❌ Stack:', error.stack);
            throw error;
        }
    },

    /**
     * Actualiza un detalle planificado de producto
     * @param {string|number} detailId - ID del detalle
     * @param {Object} detailData - Datos del detalle
     * @returns {Promise<Object>} Detalle actualizado
     */
    async updatePlannedProductDetail(detailId, detailData) {
        const token = await getAuthToken();
        return orderServiceFunctions.updateOrderPlannedProductDetail(detailId, detailData, token);
    },

    /**
     * Elimina un detalle planificado de producto
     * @param {string|number} detailId - ID del detalle
     * @returns {Promise<void>}
     */
    async deletePlannedProductDetail(detailId) {
        const token = await getAuthToken();
        return orderServiceFunctions.deleteOrderPlannedProductDetail(detailId, token);
    },

    /**
     * Crea un detalle planificado de producto
     * @param {Object} detailData - Datos del detalle
     * @returns {Promise<Object>} Detalle creado
     */
    async createPlannedProductDetail(detailData) {
        const token = await getAuthToken();
        return orderServiceFunctions.createOrderPlannedProductDetail(detailData, token);
    },

    /**
     * Establece el estado de un pedido
     * @param {string|number} orderId - ID del pedido
     * @param {string} status - Nuevo estado
     * @returns {Promise<Object>} Pedido actualizado
     */
    async setStatus(orderId, status) {
        const token = await getAuthToken();
        return orderServiceFunctions.setOrderStatus(orderId, status, token);
    },

    /**
     * Crea una incidencia en un pedido
     * @param {string|number} orderId - ID del pedido
     * @param {string} description - Descripción de la incidencia
     * @returns {Promise<Object>} Incidencia creada
     */
    async createIncident(orderId, description) {
        const token = await getAuthToken();
        return orderServiceFunctions.createOrderIncident(orderId, description, token);
    },

    /**
     * Actualiza una incidencia de pedido
     * @param {string|number} orderId - ID del pedido
     * @param {string} resolutionType - Tipo de resolución
     * @param {string} resolutionNotes - Notas de resolución
     * @returns {Promise<Object>} Incidencia actualizada
     */
    async updateIncident(orderId, resolutionType, resolutionNotes) {
        const token = await getAuthToken();
        return orderServiceFunctions.updateOrderIncident(orderId, resolutionType, resolutionNotes, token);
    },

    /**
     * Elimina una incidencia de pedido
     * @param {string|number} orderId - ID del pedido
     * @returns {Promise<void>}
     */
    async destroyIncident(orderId) {
        const token = await getAuthToken();
        return orderServiceFunctions.destroyOrderIncident(orderId, token);
    },

    /**
     * Obtiene estadísticas de ranking de pedidos
     * @param {Object} params - Parámetros { groupBy, valueType, dateFrom, dateTo, speciesId }
     * @returns {Promise<Object>} Estadísticas de ranking
     */
    async getRankingStats(params) {
        const token = await getAuthToken();
        return orderServiceFunctions.getOrderRankingStats(params, token);
    },

    /**
     * Obtiene ventas por comercial
     * @param {Object} params - Parámetros { dateFrom, dateTo }
     * @returns {Promise<Object>} Ventas por comercial
     */
    async getSalesBySalesperson(params) {
        const token = await getAuthToken();
        return orderServiceFunctions.getSalesBySalesperson(params, token);
    },

    /**
     * Obtiene estadísticas de peso neto total de pedidos
     * @param {Object} params - Parámetros { dateFrom, dateTo }
     * @returns {Promise<Object>} Estadísticas de peso neto
     */
    async getTotalNetWeightStats(params) {
        const token = await getAuthToken();
        return orderServiceFunctions.getOrdersTotalNetWeightStats(params, token);
    },

    /**
     * Obtiene estadísticas de importe total de pedidos
     * @param {Object} params - Parámetros { dateFrom, dateTo }
     * @returns {Promise<Object>} Estadísticas de importe
     */
    async getTotalAmountStats(params) {
        const token = await getAuthToken();
        return orderServiceFunctions.getOrdersTotalAmountStats(params, token);
    },

    /**
     * Obtiene datos de gráfico de ventas
     * @param {Object} params - Parámetros { speciesId, categoryId, familyId, from, to, unit, groupBy }
     * @returns {Promise<Array>} Datos del gráfico
     */
    async getSalesChartData(params) {
        const token = await getAuthToken();
        return orderServiceFunctions.getSalesChartData({ token, ...params });
    },

    /**
     * Obtiene datos de gráfico de transporte
     * @param {Object} params - Parámetros { from, to }
     * @returns {Promise<Array>} Datos del gráfico
     */
    async getTransportChartData(params) {
        const token = await getAuthToken();
        return orderServiceFunctions.getTransportChartData({ token, ...params });
    },
};

