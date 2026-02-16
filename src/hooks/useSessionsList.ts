'use client';

import { useQuery } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { sessionService } from '@/services/domain/sessions/sessionService';
import type { SessionListFilters } from '@/types/session';
import type { PaginationMeta } from '@/types/user';

const DEFAULT_PER_PAGE = 15;

export interface UseSessionsListParams {
  filters?: SessionListFilters;
  page?: number;
  perPage?: number;
  /** Si false, la query no se ejecuta (útil cuando EntityClient muestra otra entidad). */
  enabled?: boolean;
}

export interface UseSessionsListResult {
  data: unknown[];
  meta: PaginationMeta;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook para listar sesiones con React Query (Bloque 11).
 * Cache key incluye tenant para aislamiento multi-tenant.
 */
export function useSessionsList(params: UseSessionsListParams = {}): UseSessionsListResult {
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
    queryKey: ['sessions', 'list', tenantId ?? 'unknown', filters, page, perPage],
    queryFn: () => sessionService.list(filters, { page, perPage }),
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
