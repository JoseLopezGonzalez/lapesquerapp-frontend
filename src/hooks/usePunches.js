'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { getPunchesDashboard } from '@/services/punchService';
import { getPunchesStatistics } from '@/services/punchService';
import { format } from 'date-fns';

/**
 * Hook para obtener datos del dashboard de fichajes.
 * Incluye refetch automático cada 5 minutos.
 */
export function usePunchesDashboard() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['punches', 'dashboard', tenantId ?? 'unknown'],
    queryFn: () => getPunchesDashboard(token),
    enabled: !!token && !!tenantId,
    refetchInterval: 5 * 60 * 1000, // 5 minutos
  });

  return {
    data: data ?? null,
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
}

/**
 * Hook para obtener estadísticas de fichajes.
 * @param {Object} dateRange - { from, to }
 */
export function usePunchesStatistics(dateRange) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const date_start = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : null;
  const date_end = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : null;

  const { data, isLoading, error, isError } = useQuery({
    queryKey: ['punches', 'statistics', tenantId ?? 'unknown', date_start, date_end],
    queryFn: () => getPunchesStatistics(token, { date_start, date_end }),
    enabled: !!token && !!tenantId && !!date_start && !!date_end,
  });

  return {
    data: data ?? null,
    isLoading,
    error: error ?? null,
    isError,
  };
}
