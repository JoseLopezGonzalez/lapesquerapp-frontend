'use client';

import { useQuery } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { maquilaPalletKeys } from '@/lib/routes/queryKeys';
import { getPallet } from '@/services/palletService';
import type { MaquilaPallet } from '@/types/pallet';

/** Detalle de un palet propio — GET /pallets/{id}, mismo PalletResource que el listado. */
export function useMaquilaPalletDetail(palletId: number | string | null | undefined) {
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: maquilaPalletKeys.detail(tenantId, palletId),
    queryFn: () => getPallet(palletId as number | string) as Promise<MaquilaPallet>,
    enabled: !!tenantId && palletId != null,
    staleTime: 60 * 1000,
  });

  return {
    data: data ?? null,
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
}
