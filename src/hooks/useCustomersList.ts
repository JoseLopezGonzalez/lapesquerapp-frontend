'use client';
import { useQuery } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { customerService } from '@/services/domain/customers/customerService';
import type { CatalogListFilters, PaginationMeta } from '@/types/catalog';

export function useCustomersList(params: { filters?: CatalogListFilters; page?: number; perPage?: number; enabled?: boolean } = {}) {
  const { filters = {}, page = 1, perPage = 12, enabled = true } = params;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey: ['customers', 'list', tenantId ?? 'unknown', filters, page, perPage],
    queryFn: () => customerService.list(filters, { page, perPage }),
    enabled: !!tenantId && enabled,
  });
  const data = response?.data ?? [];
  const meta = response?.meta ?? { current_page: 1, last_page: 1, per_page: perPage, total: 0 };
  return { data: Array.isArray(data) ? data : [], meta: meta as PaginationMeta, isLoading, error: error?.message ?? null, refetch };
}
