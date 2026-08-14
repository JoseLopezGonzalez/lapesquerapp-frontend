import { API_URL_V2 } from '@/configs/config';
import { getAuthToken } from '@/lib/auth/getAuthToken';
import { apiRequest } from '@/lib/api/apiHelpers';
import type { MaquilaReception, MaquilaReceptionListResponse } from '@/types/reception';

const ENDPOINT = `${API_URL_V2}maquila/receptions`;

/**
 * Recepciones propias del cliente de maquila — solo lectura.
 * Ver docs/maquila/frontend/05-recepciones.md. Solo `perPage` soportado hoy.
 */
export const maquilaReceptionService = {
  async list(
    pagination: { page?: number; perPage?: number } = {}
  ): Promise<MaquilaReceptionListResponse> {
    const token = await getAuthToken();
    const { page = 1, perPage = 12 } = pagination;
    const query = new URLSearchParams();
    query.set('page', String(page));
    query.set('perPage', String(perPage));
    return apiRequest(`${ENDPOINT}?${query.toString()}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async getById(id: number | string): Promise<MaquilaReception> {
    const token = await getAuthToken();
    const response: { data: MaquilaReception } = await apiRequest(`${ENDPOINT}/${id}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};
