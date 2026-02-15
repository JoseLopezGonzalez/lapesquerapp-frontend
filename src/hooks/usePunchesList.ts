'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { getPunches } from '@/services/punchService';
import { getPunchesByMonth } from '@/services/punchService';
import type { PunchesListParams } from '@/types/punch';

/**
 * Hook para listado paginado de eventos de fichaje (React Query, tenant-aware).
 */
export function usePunchesList(params: PunchesListParams = {}) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['punches', 'list', tenantId ?? 'unknown', params],
    queryFn: () => {
      if (!token) throw new Error('No token');
      return getPunches(token, params);
    },
    enabled: !!token && !!tenantId,
  });

  return {
    data: data ?? { data: [], links: null, meta: null },
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
}

/**
 * Hook para fichajes de un mes (calendario). React Query, tenant-aware.
 */
export function usePunchesByMonth(year: number, month: number, filters: { employee_id?: number } = {}) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['punches', 'byMonth', tenantId ?? 'unknown', year, month, filters],
    queryFn: () => {
      if (!token) throw new Error('No token');
      return getPunchesByMonth(year, month, token, filters);
    },
    enabled: !!token && !!tenantId && !!year && !!month,
  });

  return {
    data: data ?? null,
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
}
