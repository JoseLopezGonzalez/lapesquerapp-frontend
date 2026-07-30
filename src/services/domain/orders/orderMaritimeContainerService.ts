import { API_URL_V2 } from '@/configs/config';
import { getAuthToken } from '@/lib/auth/getAuthToken';
import { apiRequest, ApiError, getErrorMessage } from '@/lib/api/apiHelpers';
import { deleteEntityGeneric, downloadFileGeneric } from '@/services/generic/entityService';
import type {
  MaritimeContainer,
  MaritimeContainerCreatePayload,
  MaritimeContainerUpdatePayload,
} from '@/types/orders';

export { ApiError, getErrorMessage };

const endpoint = (orderId: number | string) => `${API_URL_V2}orders/${orderId}/maritime-containers`;

export const orderMaritimeContainerService = {
  async list(orderId: number | string): Promise<MaritimeContainer[]> {
    const token = await getAuthToken();
    const response: { data: MaritimeContainer[] } = await apiRequest(endpoint(orderId), {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async create(
    orderId: number | string,
    payload: MaritimeContainerCreatePayload
  ): Promise<MaritimeContainer> {
    const token = await getAuthToken();
    const response: { data: MaritimeContainer } = await apiRequest(endpoint(orderId), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    return response.data;
  },

  async update(
    orderId: number | string,
    containerId: number | string,
    payload: MaritimeContainerUpdatePayload
  ): Promise<MaritimeContainer> {
    const token = await getAuthToken();
    const response: { data: MaritimeContainer } = await apiRequest(
      `${endpoint(orderId)}/${containerId}`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      }
    );
    return response.data;
  },

  async delete(orderId: number | string, containerId: number | string): Promise<void> {
    const token = await getAuthToken();
    await deleteEntityGeneric(`${endpoint(orderId)}/${containerId}`, undefined, token);
  },

  async assignPalletsToContainer(
    orderId: number | string,
    containerId: number | string,
    palletIds: (number | string)[]
  ): Promise<MaritimeContainer> {
    const token = await getAuthToken();
    const response: { data: MaritimeContainer } = await apiRequest(
      `${endpoint(orderId)}/${containerId}/pallets`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ palletIds }),
      }
    );
    return response.data;
  },

  async downloadExportPackingList(
    orderId: number | string,
    containerId: number | string,
    fileName: string
  ): Promise<boolean> {
    const url = `${API_URL_V2}orders/${orderId}/maritime-containers/${containerId}/pdf/export-packing-list`;
    return downloadFileGeneric(url, fileName, 'pdf');
  },
};
