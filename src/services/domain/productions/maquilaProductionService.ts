import { API_URL_V2 } from '@/configs/config';
import { getAuthToken } from '@/lib/auth/getAuthToken';
import { apiRequest } from '@/lib/api/apiHelpers';
import type { Production } from '@/types/production';

const ENDPOINT = `${API_URL_V2}maquila/productions`;

export interface MaquilaProductionListResponse {
  data: Production[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
}

/**
 * Producciones propias del cliente de maquila — lotes completos cuyo propietario único es él.
 * Ver docs/maquila/frontend/03-producciones.md. Solo `perPage` soportado hoy (🔶 sin filtros).
 */
export const maquilaProductionService = {
  async list(
    pagination: { page?: number; perPage?: number } = {}
  ): Promise<MaquilaProductionListResponse> {
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

  async getById(id: number | string): Promise<Production> {
    const token = await getAuthToken();
    const response: { data: Production } = await apiRequest(`${ENDPOINT}/${id}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  /** Árbol de trazabilidad ya filtrado por propiedad — misma forma que el interno. */
  async getTraceability(id: number | string): Promise<unknown> {
    const token = await getAuthToken();
    const response: { data: unknown } = await apiRequest(`${ENDPOINT}/${id}/traceability`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};
