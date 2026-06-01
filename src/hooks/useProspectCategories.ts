'use client';

import { useQuery } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { prospectCategoryService } from '@/services/domain/prospect-categories/prospectCategoryService';
import type {
  CatalogListFilters,
  CatalogOption,
  PaginationMeta,
  ProspectCategory,
} from '@/types/catalog';

const EMPTY_CATEGORIES: ProspectCategory[] = [];
const EMPTY_OPTIONS: CatalogOption[] = [];

export function useProspectCategoriesList(
  params: { filters?: CatalogListFilters; page?: number; perPage?: number; enabled?: boolean } = {}
) {
  const { filters = {}, page = 1, perPage = 12, enabled = true } = params;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['prospect-categories', 'list', tenantId ?? 'unknown', filters, page, perPage],
    queryFn: () => prospectCategoryService.list(filters, { page, perPage }),
    enabled: !!tenantId && enabled,
  });

  return {
    data: Array.isArray(response?.data) ? response.data : EMPTY_CATEGORIES,
    meta: (response?.meta ?? {
      current_page: 1,
      last_page: 1,
      per_page: perPage,
      total: 0,
    }) as PaginationMeta,
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
}

export function useProspectCategoryOptions(enabled = true) {
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['prospect-categories', 'options', tenantId ?? 'unknown'],
    queryFn: () => prospectCategoryService.getOptions(),
    enabled: !!tenantId && enabled,
  });

  return {
    data: data ?? EMPTY_OPTIONS,
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
}
