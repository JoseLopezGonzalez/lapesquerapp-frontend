import { API_URL_V2 } from '@/configs/config';
import { getAuthToken } from '@/lib/auth/getAuthToken';
import { apiRequest, ApiError, getErrorMessage } from '@/lib/api/apiHelpers';
import type { MaritimeShippingDetail, MaritimeShippingDetailPayload } from '@/types/orders';

export { ApiError, getErrorMessage };

const endpoint = (orderId: number | string) =>
  `${API_URL_V2}orders/${orderId}/maritime-shipping-details`;

export const orderMaritimeShippingDetailService = {
  /** Devuelve null si el pedido todavía no tiene datos de envío guardados (404). */
  async get(orderId: number | string): Promise<MaritimeShippingDetail | null> {
    const token = await getAuthToken();
    try {
      const response: { data: MaritimeShippingDetail } = await apiRequest(endpoint(orderId), {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /** Reemplazo completo (upsert) — enviar siempre el objeto completo, los campos omitidos quedan a null. */
  async upsert(
    orderId: number | string,
    payload: MaritimeShippingDetailPayload
  ): Promise<MaritimeShippingDetail> {
    const token = await getAuthToken();
    const response: { data: MaritimeShippingDetail } = await apiRequest(endpoint(orderId), {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    return response.data;
  },
};
