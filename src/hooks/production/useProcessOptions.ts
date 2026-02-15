'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { fetchWithTenant } from '@/lib/fetchWithTenant';
import { API_URL_V2 } from '@/configs/config';

export interface ProcessOption {
  id: number;
  name: string;
  type?: string;
  description?: string | null;
  [key: string]: unknown;
}

/**
 * Hook para opciones de tipos de proceso (processes/options).
 * React Query, tenant-aware. Usado en useProductionRecord y formularios de record.
 */
export function useProcessOptions() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  const { data, isLoading, error } = useQuery({
    queryKey: ['processes', 'options', tenantId ?? 'unknown'],
    queryFn: async () => {
      if (!token) return [];
      const response = await fetchWithTenant(`${API_URL_V2}processes/options`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'User-Agent': typeof navigator !== 'undefined' ? navigator.userAgent : '',
        },
      });
      if (!response.ok) return [];
      const json = await response.json();
      return (json.data ?? json ?? []) as ProcessOption[];
    },
    enabled: !!token && !!tenantId,
  });

  return {
    processes: (data ?? []) as ProcessOption[],
    isLoading,
    error: error?.message ?? null,
  };
}
