'use client';

import { useQuery } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { userService } from '@/services/domain/users/userService';
import type { UserListFilters } from '@/types/user';
import type { PaginationMeta } from '@/types/user';

const DEFAULT_PER_PAGE = 12;

export interface UseUsersListParams {
  filters?: UserListFilters;
  page?: number;
  perPage?: number;
  /** Si false, la query no se ejecuta (útil cuando EntityClient muestra otra entidad). */
  enabled?: boolean;
}

export interface UseUsersListResult {
  data: unknown[];
  meta: PaginationMeta;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook para listar usuarios con React Query (Bloque 11).
 * Cache key incluye tenant para aislamiento multi-tenant.
 */
export function useUsersList(params: UseUsersListParams = {}): UseUsersListResult {
  const {
    filters = {},
    page = 1,
    perPage = DEFAULT_PER_PAGE,
    enabled = true,
  } = params;

  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['users', 'list', tenantId ?? 'unknown', filters, page, perPage],
    queryFn: () => userService.list(filters, { page, perPage }),
    enabled: !!tenantId && enabled,
  });

  const data = response?.data ?? [];
  const meta = response?.meta ?? {
    current_page: 1,
    last_page: 1,
    per_page: perPage,
    total: 0,
  };

  return {
    data: Array.isArray(data) ? data : [],
    meta: meta as PaginationMeta,
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
}
