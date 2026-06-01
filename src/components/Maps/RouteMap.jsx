'use client';

import Map, { Layer, Marker, Source } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { EmptyState } from '@/components/Utilities/EmptyState';
import { cn } from '@/lib/utils';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

function runResizeBurst(getMap) {
  const resize = () => {
    try {
      const map = getMap();
      map?.resize();
      map?.triggerRepaint?.();
    } catch {
      /* ignore */
    }
  };
  resize();
  const delays = [32, 120, 280, 600];
  return delays.map((delay) => window.setTimeout(resize, delay));
}

const routeLineLayer = {
  id: 'route-line',
  type: 'line',
  paint: {
    'line-color': '#0f766e',
    'line-width': 4,
    'line-opacity': 0.65,
  },
};

function getStopColor(stop) {
  if (stop?.isActive) return '#2563eb';
  if (stop?.status === 'completed') return '#16a34a';
  if (stop?.status === 'skipped') return '#f59e0b';
  return '#6b7280';
}

function RouteMapComponent({
  stops = [],
  routeGeometry = null,
  disableFallbackLine = false,
  mapKey = 'default',
  children,
  initialViewState = { longitude: -3.7038, latitude: 40.4168, zoom: 5.5 },
  onClick,
  onStopClick,
  interactive = true,
  className,
}) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const burstTimersRef = useRef([]);
  const [mapLoadError, setMapLoadError] = useState('');

  const surfaceClassName = cn(
    'relative h-full min-h-0 w-full overflow-hidden rounded-xl border bg-muted/30',
    className
  );

  const fallbackLineData = useMemo(() => {
    const coordinates = stops
      .filter((stop) => stop?.lng != null && stop?.lat != null)
      .sort((a, b) => Number(a.position ?? 0) - Number(b.position ?? 0))
      .map((stop) => [Number(stop.lng), Number(stop.lat)]);

    return {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates,
      },
    };
  }, [stops]);
  const lineData = routeGeometry ?? (disableFallbackLine ? null : fallbackLineData);

  const positionedStops = useMemo(
    () => stops.filter((stop) => stop?.lng != null && stop?.lat != null),
    [stops]
  );

  const clearBurstTimers = useCallback(() => {
    burstTimersRef.current.forEach((id) => window.clearTimeout(id));
    burstTimersRef.current = [];
  }, []);

  const scheduleBurst = useCallback(() => {
    clearBurstTimers();
    burstTimersRef.current = runResizeBurst(() => mapRef.current?.getMap?.());
  }, [clearBurstTimers]);

  useLayoutEffect(() => {
    if (!MAPBOX_TOKEN) return;
    const root = containerRef.current;
    if (!root) return;

    let roRaf = 0;
    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            cancelAnimationFrame(roRaf);
            roRaf = requestAnimationFrame(() => {
              scheduleBurst();
            });
          })
        : null;
    ro?.observe(root);

    const onWin = () => scheduleBurst();
    window.addEventListener('resize', onWin);
    scheduleBurst();

    return () => {
      cancelAnimationFrame(roRaf);
      ro?.disconnect();
      window.removeEventListener('resize', onWin);
      clearBurstTimers();
    };
  }, [MAPBOX_TOKEN, mapKey, scheduleBurst, clearBurstTimers]);

  useEffect(() => {
    const map = mapRef.current?.getMap?.();
    if (!map || positionedStops.length === 0) return;

    if (positionedStops.length === 1) {
      const stop = positionedStops[0];
      map.easeTo({
        center: [Number(stop.lng), Number(stop.lat)],
        zoom: 12,
        duration: 600,
      });
      return;
    }

    const bounds = positionedStops.reduce(
      (acc, stop) => {
        acc.minLng = Math.min(acc.minLng, Number(stop.lng));
        acc.maxLng = Math.max(acc.maxLng, Number(stop.lng));
        acc.minLat = Math.min(acc.minLat, Number(stop.lat));
        acc.maxLat = Math.max(acc.maxLat, Number(stop.lat));
        return acc;
      },
      { minLng: Infinity, maxLng: -Infinity, minLat: Infinity, maxLat: -Infinity }
    );

    map.fitBounds(
      [
        [bounds.minLng, bounds.minLat],
        [bounds.maxLng, bounds.maxLat],
      ],
      { padding: 72, duration: 600 }
    );
  }, [positionedStops]);

  const handleMapLoad = useCallback(() => {
    setMapLoadError('');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        clearBurstTimers();
        burstTimersRef.current = runResizeBurst(() => mapRef.current?.getMap?.());
      });
    });
  }, [clearBurstTimers]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className={surfaceClassName}>
        <EmptyState
          icon={<MapPin className="text-primary h-10 w-10" />}
          title="Mapa no disponible"
          description="Falta configurar NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN para mostrar el planner y las rutas."
          className="h-full bg-transparent"
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className={surfaceClassName}>
      {mapLoadError ? (
        <div className="border-destructive/30 bg-background/95 text-destructive pointer-events-none absolute inset-x-4 top-4 z-20 rounded-xl border px-3 py-2 text-sm shadow-sm backdrop-blur">
          No se pudo cargar el mapa base. {mapLoadError}
        </div>
      ) : null}
      <Map
        key={mapKey}
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        initialViewState={initialViewState}
        style={{ width: '100%', height: '100%' }}
        onLoad={handleMapLoad}
        onError={(event) => {
          const message =
            event?.error?.message ||
            event?.error?.error?.message ||
            'Revisa el token, permisos del style o la carga de tiles de Mapbox.';
          console.error('Mapbox map load error:', event?.error ?? event);
          setMapLoadError(message);
        }}
        onClick={onClick}
        interactive={interactive}
      >
        {lineData?.geometry?.coordinates?.length >= 2 && (
          <Source id="route-line-source" type="geojson" data={lineData}>
            <Layer {...routeLineLayer} />
          </Source>
        )}

        {stops.map((stop) => {
          if (stop?.lng == null || stop?.lat == null) return null;
          return (
            <Marker
              key={String(stop.id)}
              longitude={Number(stop.lng)}
              latitude={Number(stop.lat)}
              anchor="bottom"
            >
              <button
                type="button"
                className="flex flex-col items-center gap-1"
                onClick={(event) => {
                  event.stopPropagation();
                  onStopClick?.(stop);
                }}
              >
                <div
                  className="border-background rounded-full border-2 p-1 text-white shadow-lg"
                  style={{ backgroundColor: getStopColor(stop) }}
                >
                  <MapPin className="h-4 w-4" />
                </div>
                <span className="bg-background/90 rounded px-1.5 py-0.5 text-[10px] font-medium shadow-sm">
                  {stop.position}
                </span>
              </button>
            </Marker>
          );
        })}
        {children}
      </Map>
    </div>
  );
}

export const RouteMap = memo(RouteMapComponent);
