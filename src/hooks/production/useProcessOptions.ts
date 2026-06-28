'use client';

import { useMemo } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { processService } from '@/services/domain/productions/processService';
import { processOptionKeys } from '@/lib/routes/queryKeys';

export type { ProcessOption } from '@/services/domain/productions/processService';
import type { ProcessOption } from '@/services/domain/productions/processService';

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
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  const { data, isLoading, error } = useQuery({
    queryKey: processOptionKeys.options(tenantId),
    queryFn: () => processService.getOptions(),
    enabled: !!tenantId,
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
