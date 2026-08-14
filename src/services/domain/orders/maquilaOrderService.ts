import { API_URL_V2 } from '@/configs/config';
import { getAuthToken } from '@/lib/auth/getAuthToken';
import { apiRequest, ApiError } from '@/lib/api/apiHelpers';
import type {
  MaquilaOrderDetail,
  MaquilaOrderIncident,
  MaquilaOrderListResponse,
  MaquilaOrderPayload,
  MaquilaOrderStatus,
} from '@/types/maquilaOrder';

const ENDPOINT = `${API_URL_V2}maquila/orders`;

/**
 * Gestor de pedidos del cliente de maquila — cabecera de pedidos hacia sus propios clientes
 * finales. Ver docs/maquila/frontend/04-pedidos.md. ⚠️ Solo `status` soportado como filtro hoy.
 *
 * Las funciones de este servicio devuelven los tipos de @/types/maquilaOrder, que son una
 * lista blanca deliberada — no tipan (ni deben usarse para leer) los campos de precio/coste/
 * margen que el backend todavía no recorta (ver ese archivo de tipos para el detalle del gap).
 */
export const maquilaOrderService = {
  async list(
    filters: { status?: MaquilaOrderStatus } = {},
    pagination: { page?: number; perPage?: number } = {}
  ): Promise<MaquilaOrderListResponse> {
    const token = await getAuthToken();
    const { page = 1, perPage = 15 } = pagination;
    const query = new URLSearchParams();
    query.set('page', String(page));
    query.set('perPage', String(perPage));
    if (filters.status) query.set('status', filters.status);
    return apiRequest(`${ENDPOINT}?${query.toString()}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async getById(id: number | string): Promise<MaquilaOrderDetail> {
    const token = await getAuthToken();
    const response: { data: MaquilaOrderDetail } = await apiRequest(`${ENDPOINT}/${id}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async create(payload: MaquilaOrderPayload): Promise<MaquilaOrderDetail> {
    const token = await getAuthToken();
    const response: { data: MaquilaOrderDetail } = await apiRequest(ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    return response.data;
  },

  async update(id: number | string, payload: MaquilaOrderPayload): Promise<MaquilaOrderDetail> {
    const token = await getAuthToken();
    const response: { data: MaquilaOrderDetail } = await apiRequest(`${ENDPOINT}/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    return response.data;
  },

  /**
   * Ruta compartida (no bajo /maquila/*) — lectura para tenant + cliente de maquila propietario.
   * 404 = el pedido no tiene incidencia (no es un error para esta UI, ver docs/maquila/frontend/04-pedidos.md §5).
   */
  async getIncident(orderId: number | string): Promise<MaquilaOrderIncident | null> {
    const token = await getAuthToken();
    try {
      const response = await apiRequest(`${API_URL_V2}orders/${orderId}/incident`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      return (response as { data?: MaquilaOrderIncident })?.data ?? null;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },
};
