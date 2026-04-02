'use client';

import { useMemo } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
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

/** Formato unificado para selects: la API puede devolver solo `id`/`name` o también `value`/`label`. */
export interface NormalizedProcessOption extends ProcessOption {
  value: number;
  label: string;
}

function normalizeProcessOptionsList(raw: ProcessOption[]): NormalizedProcessOption[] {
  if (!raw?.length) return [];
  const out: NormalizedProcessOption[] = [];
  for (const p of raw) {
    const rawValue = (p as { value?: unknown }).value;
    const coerced =
      rawValue !== undefined && rawValue !== null && !Number.isNaN(Number(rawValue))
        ? Number(rawValue)
        : p.id;
    if (coerced == null || Number.isNaN(Number(coerced))) continue;
    const value = Number(coerced);
    const labelRaw = (p as { label?: unknown }).label;
    const label =
      typeof labelRaw === 'string' && labelRaw.trim() !== ''
        ? labelRaw
        : p.name?.trim() || `Proceso #${value}`;
    out.push({ ...p, value, label });
  }
  return out;
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
      if (!response.ok) {
        console.error('useProcessOptions: error al cargar opciones de proceso', response.status);
        return [];
      }
      const json = await response.json();
      return (json.data ?? json ?? []) as ProcessOption[];
    },
    enabled: !!token && !!tenantId,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });

  const processes = useMemo(() => normalizeProcessOptionsList(data ?? []), [data]);

  return {
    processes,
    isLoading,
    error: error?.message ?? null,
  };
}
