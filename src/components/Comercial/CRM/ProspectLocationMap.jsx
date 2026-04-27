'use client';

import Map, { Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, MapPin } from 'lucide-react';
import { EmptyState } from '@/components/Utilities/EmptyState';
import { geocodeAddress, hasMapboxToken } from '@/lib/maps/geocoding';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
const DEFAULT_VIEW = { longitude: -3.7038, latitude: 40.4168, zoom: 5.5 };

export default function ProspectLocationMap({ address, companyName }) {
  const mapRef = useRef(null);
  const [status, setStatus] = useState('idle');
  const [coords, setCoords] = useState(null);
  const [error, setError] = useState('');
  const [mapReady, setMapReady] = useState(false);

  const trimmedAddress = address?.trim() ?? '';
  const hasToken = hasMapboxToken();
  const googleMapsHref = useMemo(() => {
    if (!trimmedAddress) return '';
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmedAddress)}`;
  }, [trimmedAddress]);

  useEffect(() => {
    let cancelled = false;
    setMapReady((ready) => (ready ? false : ready));

    if (!trimmedAddress || !hasToken) {
      setCoords(null);
      setError('');
      setStatus('idle');
      return () => {
        cancelled = true;
      };
    }

    async function loadLocation() {
      setStatus('loading');
      setError('');

      try {
        const features = await geocodeAddress(trimmedAddress);
        if (cancelled) return;

        const first = features?.[0];
        const center = first?.center;
        if (!Array.isArray(center) || center.length < 2) {
          setCoords(null);
          setStatus('empty');
          return;
        }

        setCoords({ lng: Number(center[0]), lat: Number(center[1]) });
        setStatus('ready');
      } catch (err) {
        if (cancelled) return;
        setCoords(null);
        setStatus('error');
        setError(err?.message || 'No se pudo localizar la dirección.');
      }
    }

    loadLocation();

    return () => {
      cancelled = true;
    };
  }, [trimmedAddress, hasToken]);

  useEffect(() => {
    if (!coords || !mapReady) return;
    const map = mapRef.current?.getMap?.();
    if (!map) return;

    map.easeTo({
      center: [coords.lng, coords.lat],
      zoom: 13.5,
      duration: 600,
    });
  }, [coords, mapReady]);

  const initialViewState = useMemo(() => {
    if (!coords) return DEFAULT_VIEW;
    return {
      longitude: coords.lng,
      latitude: coords.lat,
      zoom: 13.5,
    };
  }, [coords]);

  if (!hasToken) {
    return (
      <div className="flex min-h-[320px] items-center justify-center bg-muted/10">
        <EmptyState
          icon={<MapPin className="h-10 w-10 text-primary" />}
          title="Mapa no disponible"
          description="Falta configurar NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN para mostrar la ubicación."
          className="h-full border-0 bg-transparent"
        />
      </div>
    );
  }

  if (!trimmedAddress) {
    return (
      <div className="flex min-h-[320px] items-center justify-center px-6 text-center text-sm text-muted-foreground">
        Añade una dirección para mostrar la ubicación del prospecto.
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-[320px] items-center justify-center px-6 text-center text-sm text-muted-foreground">
        {error || 'No se pudo localizar la dirección del prospecto.'}
      </div>
    );
  }

  if (status === 'loading' || (status === 'idle' && !coords)) {
    return (
      <div className="flex min-h-[320px] items-center justify-center px-6 text-center text-sm text-muted-foreground">
        Localizando dirección...
      </div>
    );
  }

  if (!coords) {
    return (
      <div className="flex min-h-[320px] items-center justify-center px-6 text-center text-sm text-muted-foreground">
        No se ha podido ubicar esta dirección en el mapa.
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-[320px] w-full">
      {googleMapsHref ? (
        <a
          href={googleMapsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-lg border bg-background/95 px-2.5 py-1.5 text-xs font-medium text-foreground shadow-sm backdrop-blur transition-colors hover:bg-accent"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Google Maps
        </a>
      ) : null}
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={initialViewState}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
        dragRotate={false}
        touchZoomRotate={false}
        pitchWithRotate={false}
        onLoad={() => setMapReady((ready) => (ready ? ready : true))}
        onError={(event) => {
          const message =
            event?.error?.message ||
            event?.error?.error?.message ||
            'No se pudo cargar el mapa.';
          setStatus((current) => (current === 'error' ? current : 'error'));
          setError((current) => (current === message ? current : message));
        }}
      >
        {mapReady ? (
          <Marker longitude={coords.lng} latitude={coords.lat} anchor="bottom">
            <div className="rounded-full border-2 border-background bg-primary p-1 text-primary-foreground shadow-lg">
              <MapPin className="h-4 w-4" />
            </div>
          </Marker>
        ) : null}
      </Map>
      <span className="sr-only">Mapa de ubicacion para {companyName || 'el prospecto'}</span>
    </div>
  );
}
