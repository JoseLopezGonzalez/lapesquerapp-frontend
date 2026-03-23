'use client';

import { useEffect, useMemo, useState } from 'react';
import { enrichStopsWithCoordinates } from '@/lib/routes/routeStops';

function getNextPendingStop(stops) {
  return (stops ?? []).find((stop) => stop.status === 'pending') ?? null;
}

export function useFieldRouteExecutionState(route) {
  const [stops, setStops] = useState([]);
  const [focusedStopId, setFocusedStopId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!route?.stops) return;

    enrichStopsWithCoordinates(route.stops).then((enrichedStops) => {
      if (!cancelled) setStops(enrichedStops);
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
    () => stops.find((stop) => String(stop.id) === String(focusedStopId)) ?? nextStop ?? stops[0] ?? null,
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

  const refreshStopsFromRoute = async (updatedRoute, preferredStopId = null) => {
    const enrichedStops = await enrichStopsWithCoordinates(updatedRoute?.stops ?? []);
    setStops(enrichedStops);

    const nextFocusedId =
      preferredStopId != null && enrichedStops.some((stop) => String(stop.id) === String(preferredStopId))
        ? preferredStopId
        : (getNextPendingStop(enrichedStops) ?? enrichedStops[0] ?? null)?.id ?? null;

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
