/**
 * Dispatch Chart Data - API client for cebo dispatch chart endpoints
 * @module services/ceboDispatch/getDispatchChartData
 */

import { fetchWithTenant } from '@/lib/fetchWithTenant';
import { API_URL_V2 } from '@/configs/config';
import { getAuthToken } from '@/lib/auth/getAuthToken';
import { getErrorMessage } from '@/lib/api/apiHelpers';
import { getUserAgent } from '@/lib/utils/getUserAgent';

export interface DispatchChartDataParams {
  speciesId?: string;
  categoryId?: string;
  familyId?: string;
  from: string | null;
  to: string | null;
  unit: string;
  groupBy: string;
}

export interface ChartDataPoint {
  label?: string;
  value?: number;
  [key: string]: unknown;
}

export async function getDispatchChartData(
  params: DispatchChartDataParams
): Promise<ChartDataPoint[]> {
  const token = await getAuthToken();
  const { speciesId, categoryId, familyId, from, to, unit, groupBy } = params;

  const query = new URLSearchParams({
    dateFrom: from ?? '',
    dateTo: to ?? '',
    valueType: unit,
    groupBy,
  });

  if (speciesId && speciesId !== 'all') {
    query.append('speciesId', speciesId);
  }

  if (categoryId && categoryId !== 'all') {
    query.append('categoryId', categoryId);
  }

  if (familyId && familyId !== 'all') {
    query.append('familyId', familyId);
  }

  const response = await fetchWithTenant(
    `${API_URL_V2}cebo-dispatches/dispatch-chart-data?${query.toString()}`,
    {
      method: 'GET',
      headers: { 'User-Agent': getUserAgent() },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      getErrorMessage(errorData) || 'Error al obtener datos del gráfico de salidas de cebo'
    );
  }

  const data = await response.json();
  return Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
}
