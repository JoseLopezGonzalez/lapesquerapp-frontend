/**
 * Reception Chart Data - API client for raw material reception chart endpoints
 * @module services/rawMaterialReception/getReceptionChartData
 */

import { fetchWithTenant } from '@lib/fetchWithTenant';
import { API_URL_V2 } from '@/configs/config';
import { getErrorMessage } from '@/lib/api/apiHelpers';
import { getUserAgent } from '@/lib/utils/getUserAgent';

export interface ReceptionChartDataParams {
  token: string;
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

export async function getReceptionChartData(
  params: ReceptionChartDataParams
): Promise<ChartDataPoint[]> {
  const { token, speciesId, categoryId, familyId, from, to, unit, groupBy } = params;

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
    `${API_URL_V2}raw-material-receptions/reception-chart-data?${query.toString()}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': getUserAgent(),
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      getErrorMessage(errorData) || 'Error al obtener datos del gráfico de recepciones'
    );
  }

  const data = await response.json();
  return Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
}
