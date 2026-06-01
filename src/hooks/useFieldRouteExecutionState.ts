'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { enrichStopsWithCoordinates } from '@/lib/routes/routeStops';
import type { DeliveryRoute, RouteStop } from '@/types/field';

function getNextPendingStop(stops: RouteStop[] = []) {
  return (stops ?? []).find((stop) => stop.status === 'pending') ?? null;
}

function buildStopsHydrationKey(stops: RouteStop[] = []) {
  return (stops ?? [])
    .map((stop, index) =>
      [
        stop.id ?? `idx-${index}`,
        stop.address ?? '',
        stop.label ?? '',
        stop.lat ?? '',
        stop.lng ?? '',
      ].join('|')
    )
    .join('::');
}

export function useFieldRouteExecutionState(route: DeliveryRoute | null | undefined) {
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [focusedStopId, setFocusedStopId] = useState<number | string | null>(null);
  const lastHydrationKeyRef = useRef('');
  const lastEnrichedStopsRef = useRef<RouteStop[]>([]);

  useEffect(() => {
    let cancelled = false;
    if (!route?.stops) return;
    const hydrationKey = buildStopsHydrationKey(route.stops);

    if (hydrationKey === lastHydrationKeyRef.current && lastEnrichedStopsRef.current.length > 0) {
      setStops(lastEnrichedStopsRef.current);
      return;
    }

    enrichStopsWithCoordinates(route.stops).then((enrichedStops) => {
      if (!cancelled) {
        lastHydrationKeyRef.current = hydrationKey;
        lastEnrichedStopsRef.current = enrichedStops;
        setStops(enrichedStops);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [route]);

  const nextStop = useMemo(() => getNextPendingStop(stops), [stops]);

  useEffect(() => {
    if (!stops.length) {
      setFocusedStopId(null);
      return;
    }

    if (focusedStopId != null) {
      const exists = stops.some((stop) => String(stop.id) === String(focusedStopId));
      if (exists) return;
    }

    setFocusedStopId((nextStop ?? stops[0] ?? null)?.id ?? null);
  }, [stops, focusedStopId, nextStop]);

  const focusedStop = useMemo(
    () =>
      stops.find((stop) => String(stop.id) === String(focusedStopId)) ??
      nextStop ??
      stops[0] ??
      null,
    [stops, focusedStopId, nextStop]
  );

  const mapStops = useMemo(
    () =>
      (stops ?? []).map((stop) => ({
        ...stop,
        isActive: focusedStop?.id === stop.id,
      })),
    [stops, focusedStop]
  );

  const refreshStopsFromRoute = async (
    updatedRoute: DeliveryRoute | null | undefined,
    preferredStopId: number | string | null = null
  ) => {
    const sourceStops = updatedRoute?.stops ?? [];
    const hydrationKey = buildStopsHydrationKey(sourceStops);
    const enrichedStops =
      hydrationKey === lastHydrationKeyRef.current
        ? lastEnrichedStopsRef.current
        : await enrichStopsWithCoordinates(sourceStops);
    lastHydrationKeyRef.current = hydrationKey;
    lastEnrichedStopsRef.current = enrichedStops;
    setStops(enrichedStops);

    const nextFocusedId =
      preferredStopId != null &&
      enrichedStops.some((stop) => String(stop.id) === String(preferredStopId))
        ? preferredStopId
        : ((getNextPendingStop(enrichedStops) ?? enrichedStops[0] ?? null)?.id ?? null);

    setFocusedStopId(nextFocusedId);
  };

  return {
    stops,
    setStops,
    focusedStopId,
    setFocusedStopId,
    nextStop,
    focusedStop,
    mapStops,
    refreshStopsFromRoute,
  };
}
