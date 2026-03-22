'use client';

import Map, { Layer, Marker, Source } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useMemo, useRef } from 'react';
import { MapPin } from 'lucide-react';
import { EmptyState } from '@/components/Utilities/EmptyState';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

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

export function RouteMap({
  stops = [],
  routeGeometry = null,
  children,
  initialViewState = { longitude: -3.7038, latitude: 40.4168, zoom: 5.5 },
  onClick,
  interactive = true,
  className,
}) {
  const mapRef = useRef(null);
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
  const lineData = routeGeometry ?? fallbackLineData;

  const positionedStops = useMemo(
    () => stops.filter((stop) => stop?.lng != null && stop?.lat != null),
    [stops]
  );

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

  if (!MAPBOX_TOKEN) {
    return (
      <div className={className ?? 'h-full w-full rounded-xl overflow-hidden border bg-muted/30'}>
        <EmptyState
          icon={<MapPin className="h-10 w-10 text-primary" />}
          title="Mapa no disponible"
          description="Falta configurar NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN para mostrar el planner y las rutas."
          className="h-full bg-transparent"
        />
      </div>
    );
  }

  return (
    <div className={className ?? 'h-full w-full rounded-xl overflow-hidden border bg-muted/30'}>
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        initialViewState={initialViewState}
        style={{ width: '100%', height: '100%' }}
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
              <div className="flex flex-col items-center gap-1">
                <div
                  className="rounded-full border-2 border-background p-1 text-white shadow-lg"
                  style={{ backgroundColor: getStopColor(stop) }}
                >
                  <MapPin className="h-4 w-4" />
                </div>
                <span className="rounded bg-background/90 px-1.5 py-0.5 text-[10px] font-medium shadow-sm">
                  {stop.position}
                </span>
              </div>
            </Marker>
          );
        })}
        {children}
      </Map>
    </div>
  );
}
