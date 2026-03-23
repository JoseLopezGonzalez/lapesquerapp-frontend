'use client';

import { useEffect, useMemo, useState } from 'react';
import { getRouteDirections } from '@/lib/maps/directions';
import { buildStopsCoordinateSignature, normalizeStops } from '@/lib/routes/routeStops';
import type { RouteStop } from '@/types/field';

export function useRouteGeometry(stops: Partial<RouteStop>[] = []) {
  const [routeGeometry, setRouteGeometry] = useState(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [directionsError, setDirectionsError] = useState('');

  const coordinateSignature = useMemo(() => buildStopsCoordinateSignature(stops), [stops]);
  const geometryStops = useMemo(() => normalizeStops(stops), [coordinateSignature]);

  useEffect(() => {
    let cancelled = false;
    setDirectionsError('');

    const stopsWithCoordinates = geometryStops.filter((stop) => stop?.lat != null && stop?.lng != null);
    if (stopsWithCoordinates.length < 2) {
      setRouteGeometry(null);
      setIsCalculatingRoute(false);
      return () => {
        cancelled = true;
      };
    }

    async function loadDirections() {
      setIsCalculatingRoute(true);
      try {
        const geometry = await getRouteDirections(geometryStops);
        if (!cancelled) {
          setRouteGeometry(geometry);
          setIsCalculatingRoute(false);
        }
      } catch (error) {
        if (!cancelled) {
          setRouteGeometry(null);
          setDirectionsError(error?.message ?? 'No se pudo calcular la ruta por carretera.');
          setIsCalculatingRoute(false);
        }
      }
    }

    loadDirections();

    return () => {
      cancelled = true;
    };
  }, [coordinateSignature]);

  return {
    routeGeometry,
    isCalculatingRoute,
    directionsError,
  };
}
