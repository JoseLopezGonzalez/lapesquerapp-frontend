'use client';

import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useRef, useState } from 'react';
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
 * Call refetch() when the user opens the Historial tab to reload events.
 *
 * @param palletId - Pallet ID (number or string); skipped if 'new' or temp-*
 * @returns { timeline, loading, error, refetch }
 */
export function usePalletTimeline(
  palletId: string | number | null | undefined
): {
  timeline: PalletTimelineEntry[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const { data: session } = useSession();
  const token = session?.user?.accessToken as string | undefined;

  const [timeline, setTimeline] = useState<PalletTimelineEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const requestIdRef = useRef(0);

  const shouldFetch = !!token && isValidPalletId(palletId);

  const fetchTimeline = useCallback(() => {
    if (!token || !isValidPalletId(palletId) || palletId == null) return;
    requestIdRef.current += 1;
    const currentId = requestIdRef.current;
    setLoading(true);
    setError(null);

    getPalletTimeline(palletId, token)
      .then((res) => {
        if (currentId === requestIdRef.current) {
          setTimeline(res.timeline ?? []);
        }
      })
      .catch((err) => {
        if (currentId === requestIdRef.current) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setTimeline([]);
        }
      })
      .finally(() => {
        if (currentId === requestIdRef.current) {
          setLoading(false);
        }
      });
  }, [palletId, token]);

  useEffect(() => {
    if (!shouldFetch || palletId == null) {
      setTimeline([]);
      setLoading(false);
      setError(null);
      return;
    }
    requestIdRef.current += 1;
    const currentId = requestIdRef.current;
    setLoading(true);
    setError(null);

    getPalletTimeline(palletId, token)
      .then((res) => {
        if (currentId === requestIdRef.current) {
          setTimeline(res.timeline ?? []);
        }
      })
      .catch((err) => {
        if (currentId === requestIdRef.current) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setTimeline([]);
        }
      })
      .finally(() => {
        if (currentId === requestIdRef.current) {
          setLoading(false);
        }
      });
  }, [shouldFetch, palletId, token]);

  const refetch = useCallback(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  return { timeline, loading, error, refetch };
}
