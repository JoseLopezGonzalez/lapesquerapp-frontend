import { API_URL_V2 } from '@/configs/config';
import { getAuthToken } from '@/lib/auth/getAuthToken';
import { addFiltersToParams } from '@/lib/entity/filtersHelper';
import { fetchEntitiesGeneric } from '@/services/generic/entityService';
import { deleteLiquidation } from './supplierLiquidationService';
import type { CatalogListResponse } from '@/types/catalog';
import type { SupplierLiquidationListItem } from '@/types/supplierLiquidation';

const ENDPOINT = 'supplier-liquidations';

export const supplierLiquidationDomainService = {
  async list(
    filters: Record<string, unknown> = {},
    pagination: { page?: number; perPage?: number } = {}
  ): Promise<CatalogListResponse<SupplierLiquidationListItem>> {
    const token = await getAuthToken();
    const { page = 1, perPage = 15 } = pagination;

    const queryParams = new URLSearchParams();
    queryParams.set('page', String(page));
    queryParams.set('per_page', String(perPage));
    addFiltersToParams(queryParams, filters);

    return fetchEntitiesGeneric(
      `${API_URL_V2}${ENDPOINT}?${queryParams.toString()}`,
      token
    ) as Promise<CatalogListResponse<SupplierLiquidationListItem>>;
  },

  async delete(id: number | string): Promise<void> {
    return deleteLiquidation(id);
  },
};
