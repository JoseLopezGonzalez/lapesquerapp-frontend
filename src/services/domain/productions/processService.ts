import { API_URL_V2 } from '@/configs/config';
import { getAuthToken } from '@/lib/auth/getAuthToken';
import { fetchEntitiesGeneric } from '@/services/generic/entityService';

export interface ProcessOption {
  id: number;
  name: string;
  type?: string;
  description?: string | null;
  [key: string]: unknown;
}

const ENDPOINT = 'processes';

export const processService = {
  async getOptions(): Promise<ProcessOption[]> {
    const token = await getAuthToken();
    const response = await fetchEntitiesGeneric(`${API_URL_V2}${ENDPOINT}/options`, token);
    if (Array.isArray(response)) return response as ProcessOption[];
    const obj = response as Record<string, unknown>;
    return Array.isArray(obj?.data) ? (obj.data as ProcessOption[]) : [];
  },
};
