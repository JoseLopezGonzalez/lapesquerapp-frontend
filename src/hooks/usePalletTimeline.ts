'use client';

import { useQuery } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { palletTimelineKeys } from '@/lib/routes/queryKeys';
import { getPalletTimeline, type PalletTimelineEntry } from '@/services/palletService';

function isValidPalletId(palletId: string | number | null | undefined): boolean {
  if (palletId == null) return false;
  if (palletId === 'new') return false;
  const str = String(palletId);
  if (str.startsWith('temp-')) return false;
  return true;
}

/**
 * Hook to fetch the timeline (history) of a pallet.
 * Only fetches when palletId is valid (not 'new', not temporary).
 * Call refetch() when the user opens the Historial tab to reload events.
 *
 * @param palletId - Pallet ID (number or string); skipped if 'new' or temp-*
 * @returns { timeline, loading, error, refetch }
 */
export function usePalletTimeline(palletId: string | number | null | undefined): {
  timeline: PalletTimelineEntry[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const isValid = isValidPalletId(palletId);

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: palletTimelineKeys.detail(tenantId, palletId),
    queryFn: () => getPalletTimeline(palletId as string | number),
    enabled: !!tenantId && isValid,
    staleTime: 60 * 1000,
  });

  return {
    timeline: data?.timeline ?? [],
    loading: isLoading,
    error: error instanceof Error ? error : error ? new Error(String(error)) : null,
    refetch: () => {
      void refetch();
    },
  };
}
