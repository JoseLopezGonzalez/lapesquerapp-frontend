'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import {
  getPalletTimeline,
  type PalletTimelineEntry,
} from '@/services/palletService';

function isValidPalletId(palletId: string | number | null | undefined): boolean {
  if (palletId == null) return false;
  if (palletId === 'new') return false;
  const str = String(palletId);
  if (str.startsWith('temp-')) return false;
  return true;
}

/**
 * Hook to fetch the timeline (history) of a pallet.
 * Only fetches when palletId is valid (not 'new', not temporary) and user is authenticated.
 *
 * @param palletId - Pallet ID (number or string); skipped if 'new' or temp-*
 * @returns { timeline, loading, error }
 */
export function usePalletTimeline(
  palletId: string | number | null | undefined
): {
  timeline: PalletTimelineEntry[];
  loading: boolean;
  error: Error | null;
} {
  const { data: session } = useSession();
  const token = session?.user?.accessToken as string | undefined;

  const [timeline, setTimeline] = useState<PalletTimelineEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const shouldFetch = !!token && isValidPalletId(palletId);

  useEffect(() => {
    if (!shouldFetch || palletId == null) {
      setTimeline([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getPalletTimeline(palletId, token)
      .then((res) => {
        if (!cancelled) {
          setTimeline(res.timeline ?? []);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setTimeline([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [shouldFetch, palletId, token]);

  return { timeline, loading, error };
}
