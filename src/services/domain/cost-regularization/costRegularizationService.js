import { API_URL_V2 } from '@/configs/config';
import { getAuthToken } from '@/lib/auth/getAuthToken';
import { fetchEntitiesGeneric, performActionGeneric } from '@/services/generic/entityService';

const BASE = `${API_URL_V2}cost-regularization`;

export const costRegularizationService = {
  async getSalesMissingCost(filters = {}) {
    const token = await getAuthToken();
    const params = new URLSearchParams();
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    (filters.productIds || []).forEach((id) => params.append('productIds[]', id));
    (filters.customerIds || []).forEach((id) => params.append('customerIds[]', id));
    (filters.orderIds || []).forEach((id) => params.append('orderIds[]', id));
    return fetchEntitiesGeneric(`${BASE}/sales/missing-cost-boxes?${params}`, token);
  },

  async getStockMissingCost(filters = {}) {
    const token = await getAuthToken();
    const params = new URLSearchParams();
    (filters.productIds || []).forEach((id) => params.append('productIds[]', id));
    (filters.storeIds || []).forEach((id) => params.append('storeIds[]', id));
    if (filters.lot) params.append('lot', filters.lot);
    if (filters.createdFrom) params.append('createdFrom', filters.createdFrom);
    if (filters.createdTo) params.append('createdTo', filters.createdTo);
    return fetchEntitiesGeneric(`${BASE}/stock/missing-cost-boxes?${params}`, token);
  },

  async applyManualCostsByProduct(payload) {
    const token = await getAuthToken();
    const body = { ...payload };
    if (
      body.scope === 'stock' &&
      (body.filters == null || typeof body.filters !== 'object' || Array.isArray(body.filters))
    ) {
      body.filters = {};
    }
    try {
      const response = await performActionGeneric(
        `${BASE}/manual-costs/apply-by-product`,
        'POST',
        body,
        token
      );
      return response.json();
    } catch (rawResponse) {
      const errorData = await rawResponse?.json?.().catch(() => ({}));
      throw { status: rawResponse?.status, data: errorData };
    }
  },

  async applyManualCostsByLotProduct(payload) {
    const token = await getAuthToken();
    try {
      const response = await performActionGeneric(
        `${BASE}/manual-costs/apply-by-lot-product`,
        'POST',
        payload,
        token
      );
      return response.json();
    } catch (rawResponse) {
      const errorData = await rawResponse?.json?.().catch(() => ({}));
      throw { status: rawResponse?.status, data: errorData };
    }
  },
};
