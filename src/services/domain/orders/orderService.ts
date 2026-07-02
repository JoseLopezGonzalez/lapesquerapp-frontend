/**
 * Service de dominio para Orders (Pedidos)
 *
 * Expone métodos semánticos de negocio para interactuar con pedidos.
 * Oculta detalles técnicos (URLs, endpoints, configuración dinámica).
 *
 * NOTA: Este servicio actúa como wrapper/adapter del orderService.ts raíz,
 * que es muy complejo (18 métodos específicos de negocio). Este wrapper implementa
 * la interfaz estándar de servicios de dominio para permitir que EntityClient lo use,
 * mientras que los métodos específicos de orders (estadísticas, incidencias, etc.)
 * siguen estando disponibles directamente desde el servicio raíz de pedidos.
 *
 * Este service encapsula la lógica genérica internamente, pero expone
 * métodos claros y predecibles para componentes y AI Chat.
 */

import { API_URL_V2 } from '@/configs/config';
import { getAuthToken } from '@/lib/auth/getAuthToken';
import { fetchEntitiesGeneric, deleteEntityGeneric } from '@/services/generic/entityService';
import { fetchAutocompleteOptionsGeneric } from '@/services/generic/editEntityService';
import { addWithParams } from '@/lib/entity/entityRelationsHelper';
import { addFiltersToParams } from '@/lib/entity/filtersHelper';
// Importar funciones del orderService existente
import * as orderServiceFunctions from '@/services/orderService';
import type {
  Order,
  OrderPayload,
  OrderPlannedProductDetailPayload,
  OrderRankingStatsParams,
  OrderStatus,
  SalesChartParams,
  TransportChartParams,
} from '@/services/orderService';
import type { CatalogListFilters, CatalogListResponse, CatalogOption } from '@/types/catalog';

const ENDPOINT = 'orders';
type EntityId = number | string;
type Pagination = { page?: number; perPage?: number };
type DateRangeParams = { dateFrom?: string; dateTo?: string; includeAuxiliary?: boolean };

const normalizeOption = (option: unknown): CatalogOption => {
  if (option && typeof option === 'object') {
    const record = option as Record<string, unknown>;
    const value = record.id ?? record.value ?? String(option);
    const label = record.name ?? record.label ?? String(option);
    return {
      value: typeof value === 'number' || typeof value === 'string' ? value : String(value),
      label: typeof label === 'string' ? label : String(label),
    };
  }

  return {
    value: String(option),
    label: String(option),
  };
};

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
  async list(
    filters: CatalogListFilters = {},
    pagination: Pagination = {}
  ): Promise<CatalogListResponse<Order>> {
    const token = await getAuthToken();
    const { page = 1, perPage = 12 } = pagination;

    const queryParams = new URLSearchParams();

    // Agregar todos los filtros genéricos usando el helper
    addFiltersToParams(queryParams, filters);

    // Agregar parámetros with[] para cargar relaciones necesarias
    if (filters._requiredRelations && Array.isArray(filters._requiredRelations)) {
      addWithParams(queryParams, filters._requiredRelations);
    }

    queryParams.append('page', String(page));
    queryParams.append('perPage', String(perPage));

    const url = `${API_URL_V2}${ENDPOINT}?${queryParams.toString()}`;
    return fetchEntitiesGeneric(url, token) as Promise<CatalogListResponse<Order>>;
  },

  /**
   * Obtiene un pedido por ID
   * @param {string|number} id - ID del pedido
   * @returns {Promise<Object>} Datos del pedido
   *
   * @example
   * const order = await orderService.getById(123);
   */
  async getById(id: EntityId): Promise<Order | null> {
    // Usar función del orderService existente
    return orderServiceFunctions.getOrder(String(id));
  },

  /**
   * Crea un nuevo pedido
   * @param {Object} data - Datos del pedido a crear
   * @returns {Promise<Object>} Pedido creado
   *
   * @example
   * const order = await orderService.create({ customer_id: 1, ... });
   */
  async create(data: OrderPayload): Promise<Order> {
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
  async update(id: EntityId, data: OrderPayload): Promise<Order | undefined> {
    // Usar función del orderService existente
    return orderServiceFunctions.updateOrder(String(id), data);
  },

  /**
   * Elimina un pedido
   * @param {string|number} id - ID del pedido
   * @returns {Promise<void>}
   *
   * @example
   * await orderService.delete(123);
   */
  async delete(id: EntityId): Promise<{ response: Response; data: unknown }> {
    const token = await getAuthToken();
    const url = `${API_URL_V2}${ENDPOINT}/${id}`;
    return deleteEntityGeneric(url, undefined, token);
  },

  /**
   * Elimina múltiples pedidos
   * @param {Array<string|number>} ids - Array de IDs de pedidos
   * @returns {Promise<void>}
   *
   * @example
   * await orderService.deleteMultiple([123, 456, 789]);
   */
  async deleteMultiple(ids: EntityId[]): Promise<{ response: Response; data: unknown }> {
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
  async getOptions(): Promise<CatalogOption[]> {
    // Usar función del orderService existente
    const options = await orderServiceFunctions.getActiveOrdersOptions();
    // Convertir al formato estándar si es necesario
    if (options && Array.isArray(options)) {
      return options.map(normalizeOption);
    }
    return [];
  },

  /**
   * Obtiene opciones de todos los pedidos para filtros históricos.
   * @returns {Promise<Array<{value: any, label: string}>>}
   */
  async getAllOptions(): Promise<CatalogOption[]> {
    const token = await getAuthToken();
    return fetchAutocompleteOptionsGeneric(`${API_URL_V2}${ENDPOINT}/options`, token) as Promise<
      CatalogOption[]
    >;
  },

  // ========== Métodos específicos de Orders (reexportar del orderService original) ==========

  /**
   * Obtiene órdenes activas
   * @returns {Promise<Array>} Array de órdenes activas
   */
  async getActiveOrders(): Promise<Order[]> {
    return orderServiceFunctions.getActiveOrders();
  },

  /**
   * Actualiza un detalle planificado de producto
   * @param {string|number} detailId - ID del detalle
   * @param {Object} detailData - Datos del detalle
   * @returns {Promise<Object>} Detalle actualizado
   */
  async updatePlannedProductDetail(
    detailId: EntityId,
    detailData: OrderPlannedProductDetailPayload
  ): Promise<unknown> {
    return orderServiceFunctions.updateOrderPlannedProductDetail(String(detailId), detailData);
  },

  /**
   * Elimina un detalle planificado de producto
   * @param {string|number} detailId - ID del detalle
   * @returns {Promise<void>}
   */
  async deletePlannedProductDetail(detailId: EntityId): Promise<unknown> {
    return orderServiceFunctions.deleteOrderPlannedProductDetail(String(detailId));
  },

  /**
   * Crea un detalle planificado de producto
   * @param {Object} detailData - Datos del detalle
   * @returns {Promise<Object>} Detalle creado
   */
  async createPlannedProductDetail(detailData: OrderPlannedProductDetailPayload): Promise<unknown> {
    return orderServiceFunctions.createOrderPlannedProductDetail(detailData);
  },

  /**
   * Establece el estado de un pedido
   * @param {string|number} orderId - ID del pedido
   * @param {string} status - Nuevo estado
   * @returns {Promise<Object>} Pedido actualizado
   */
  async setStatus(orderId: EntityId, status: OrderStatus): Promise<unknown> {
    return orderServiceFunctions.setOrderStatus(String(orderId), status);
  },

  /**
   * Crea una incidencia en un pedido
   * @param {string|number} orderId - ID del pedido
   * @param {string} description - Descripción de la incidencia
   * @returns {Promise<Object>} Incidencia creada
   */
  async createIncident(orderId: EntityId, description: string): Promise<unknown> {
    return orderServiceFunctions.createOrderIncident(String(orderId), description);
  },

  /**
   * Actualiza una incidencia de pedido
   * @param {string|number} orderId - ID del pedido
   * @param {string} resolutionType - Tipo de resolución
   * @param {string} resolutionNotes - Notas de resolución
   * @returns {Promise<Object>} Incidencia actualizada
   */
  async updateIncident(
    orderId: EntityId,
    resolutionType: string,
    resolutionNotes: string
  ): Promise<unknown> {
    return orderServiceFunctions.updateOrderIncident(
      String(orderId),
      resolutionType,
      resolutionNotes
    );
  },

  /**
   * Elimina una incidencia de pedido
   * @param {string|number} orderId - ID del pedido
   * @returns {Promise<void>}
   */
  async destroyIncident(orderId: EntityId): Promise<unknown> {
    return orderServiceFunctions.destroyOrderIncident(String(orderId));
  },

  /**
   * Obtiene estadísticas de ranking de pedidos
   * @param {Object} params - Parámetros { groupBy, valueType, dateFrom, dateTo, speciesId }
   * @returns {Promise<Object>} Estadísticas de ranking
   */
  async getRankingStats(params: Partial<OrderRankingStatsParams> = {}): Promise<unknown> {
    return orderServiceFunctions.getOrderRankingStats(params as OrderRankingStatsParams);
  },

  /**
   * Obtiene ventas por comercial
   * @param {Object} params - Parámetros { dateFrom, dateTo }
   * @returns {Promise<Object>} Ventas por comercial
   */
  async getSalesBySalesperson(params: DateRangeParams = {}): Promise<unknown> {
    return orderServiceFunctions.getSalesBySalesperson(
      params as { dateFrom: string; dateTo: string }
    );
  },

  /**
   * Obtiene estadísticas de peso neto total de pedidos
   * @param {Object} params - Parámetros { dateFrom, dateTo }
   * @returns {Promise<Object>} Estadísticas de peso neto
   */
  async getTotalNetWeightStats(params: DateRangeParams = {}): Promise<unknown> {
    return orderServiceFunctions.getOrdersTotalNetWeightStats(
      params as { dateFrom: string; dateTo: string }
    );
  },

  /**
   * Obtiene estadísticas de importe total de pedidos
   * @param {Object} params - Parámetros { dateFrom, dateTo }
   * @returns {Promise<Object>} Estadísticas de importe
   */
  async getTotalAmountStats(params: DateRangeParams = {}): Promise<unknown> {
    return orderServiceFunctions.getOrdersTotalAmountStats(
      params as { dateFrom: string; dateTo: string; includeAuxiliary?: boolean }
    );
  },

  /**
   * Obtiene datos de gráfico de ventas
   * @param {Object} params - Parámetros { speciesId, categoryId, familyId, from, to, unit, groupBy }
   * @returns {Promise<Array>} Datos del gráfico
   */
  async getSalesChartData(params: Partial<SalesChartParams> = {}): Promise<unknown[]> {
    return orderServiceFunctions.getSalesChartData(params as SalesChartParams);
  },

  /**
   * Obtiene datos de gráfico de transporte
   * @param {Object} params - Parámetros { from, to }
   * @returns {Promise<Array>} Datos del gráfico
   */
  async getTransportChartData(params: Partial<TransportChartParams> = {}): Promise<unknown> {
    return orderServiceFunctions.getTransportChartData(params as TransportChartParams);
  },
};
