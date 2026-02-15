'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { captureZoneService } from '@/services/domain/capture-zones/captureZoneService';
import { fishingGearService } from '@/services/domain/fishing-gears/fishingGearService';

function useOptions(queryKey, queryFn, enabled) {
  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn,
    enabled,
  });
  return {
    data: Array.isArray(data) ? data : [],
    isLoading,
    error: error?.message ?? null,
  };
}

/**
 * Hook para opciones de zonas de captura (Bloque 4 Productos). React Query, tenant-aware.
 */
export function useCaptureZoneOptions() {
  const { data: session } = useSession();
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  return useOptions(
    ['captureZones', 'options', tenantId ?? 'unknown'],
    () => captureZoneService.getOptions(),
    !!session?.user?.accessToken && !!tenantId
  );
}

/**
 * Hook para opciones de artes de pesca (Bloque 4 Productos). React Query, tenant-aware.
 */
export function useFishingGearOptions() {
  const { data: session } = useSession();
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  return useOptions(
    ['fishingGears', 'options', tenantId ?? 'unknown'],
    () => fishingGearService.getOptions(),
    !!session?.user?.accessToken && !!tenantId
  );
}
