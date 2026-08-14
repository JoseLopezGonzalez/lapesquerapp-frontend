import { API_URL_V2 } from '@/configs/config';
import { getAuthToken } from '@/lib/auth/getAuthToken';
import { apiRequest } from '@/lib/api/apiHelpers';
import type {
  MaquilaTollClientReturn,
  MaquilaTollClientReturnListResponse,
} from '@/types/tollClientReturn';

const ENDPOINT = `${API_URL_V2}toll-client-returns`;

/**
 * Devoluciones de mercancía al cliente de maquila — ruta compartida (actor:internal,external),
 * el filtro por toll_client_id se aplica automáticamente en el controller para ExternalUser.
 * Ver docs/maquila/frontend/07-devoluciones.md. Solo lectura: la creación es exclusiva del tenant.
 */
export const tollClientReturnService = {
  async list(
    pagination: { page?: number; perPage?: number } = {}
  ): Promise<MaquilaTollClientReturnListResponse> {
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

  async getById(id: number | string): Promise<MaquilaTollClientReturn> {
    const token = await getAuthToken();
    const response: { data: MaquilaTollClientReturn } = await apiRequest(`${ENDPOINT}/${id}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};
