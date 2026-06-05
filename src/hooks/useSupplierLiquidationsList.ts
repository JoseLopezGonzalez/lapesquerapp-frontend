'use client';
import { useQuery } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { supplierLiquidationKeys } from '@/lib/routes/queryKeys';
import { getSupplierLiquidationsList } from '@/services/domain/supplier-liquidations/supplierLiquidationService';
import type { SupplierLiquidationListFilters } from '@/types/supplierLiquidation';

export function useSupplierLiquidationsList(
  filters: SupplierLiquidationListFilters = {},
  enabled = true
) {
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  const { suppliers, dates, closed_at, page = 1, perPage = 15 } = filters;

  const filterKey = {
    suppliers,
    dates_start: dates?.start,
    dates_end: dates?.end,
    closed_at_start: closed_at?.start,
    closed_at_end: closed_at?.end,
    page,
    perPage,
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: supplierLiquidationKeys.closedList(tenantId, filterKey),
    queryFn: () => getSupplierLiquidationsList(filters),
    enabled: !!tenantId && enabled,
  });

  const items = data?.data ?? [];
  const rawMeta = data?.meta;
  const meta = rawMeta
    ? {
        currentPage: rawMeta.current_page,
        lastPage: rawMeta.last_page,
        total: rawMeta.total,
        perPage: rawMeta.per_page,
        totalPages: rawMeta.last_page,
      }
    : { currentPage: 1, lastPage: 1, total: 0, perPage, totalPages: 1 };

  return {
    data: items,
    meta,
    isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  };
}
