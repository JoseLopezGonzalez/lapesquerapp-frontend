'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { getSpeciesOptions } from '@/services/speciesService';

/**
 * Hook para obtener opciones de especies usando React Query.
 * @returns {Object} { data, isLoading, error }
 */
export function useSpeciesOptions() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['species', 'options', tenantId ?? 'unknown'],
    queryFn: () => getSpeciesOptions(token),
    enabled: !!token && !!tenantId,
  });

  return {
    data: Array.isArray(data) ? data : [],
    isLoading,
    error: error?.message ?? null,
  };
}
