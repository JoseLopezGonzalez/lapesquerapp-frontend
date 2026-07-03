'use client';

import { useEffect, useMemo, useState, type ComponentType } from 'react';
import { MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { COMPANY_NAME } from '@/configs/config';
import { useOrderContext } from '@/context/OrderContext';
import { useSettings } from '@/context/SettingsContext';
import { useIsMobileSafe } from '@/hooks/use-mobile';
import { EmptyState } from '@/components/Utilities/EmptyState';
import { RouteMap } from '@/components/Maps/RouteMap';
import { geocodeAddress, hasMapboxToken } from '@/lib/maps/geocoding';
import { getRouteDirections } from '@/lib/maps/directions';

type RouteStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error';

type RouteStop = {
  id: string;
  lng: number;
  lat: number;
  position: number;
  isActive?: boolean;
};

// RouteMap.jsx no está tipado (JS legacy compartido con el planner de rutas) — se tipa
// aquí el contrato de props que este componente consume, sin tocar el archivo compartido.
interface RouteMapProps {
  stops?: RouteStop[];
  routeGeometry?: Awaited<ReturnType<typeof getRouteDirections>> | null;
  className?: string;
}
const TypedRouteMap = RouteMap as unknown as ComponentType<RouteMapProps>;

const buildCompanyAddress = (settings: Record<string, unknown> | undefined): string => {
  if (!settings) return '';
  return [
    settings['company.address.street'],
    settings['company.address.postal_code'],
    settings['company.address.city'],
    settings['company.address.province'],
    settings['company.address.country'],
  ]
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .join(', ');
};

const OrderMap = () => {
  const { order } = useOrderContext();
  const { settings, loading } = useSettings();
  const { isMobile, mounted } = useIsMobileSafe();
  const [status, setStatus] = useState<RouteStatus>('idle');
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [routeGeometry, setRouteGeometry] = useState<Awaited<
    ReturnType<typeof getRouteDirections>
  > | null>(null);
  const [error, setError] = useState('');

  const shippingAddress = order?.shippingAddress as string | undefined;
  const hasShippingAddress = Boolean(shippingAddress);
  const hasToken = hasMapboxToken();

  const originAddress = useMemo(() => {
    if (loading) return '';
    const companyAddress = buildCompanyAddress(settings as Record<string, unknown> | undefined);
    if (companyAddress) return companyAddress;
    return (settings?.['company.name'] as string | undefined) || COMPANY_NAME;
  }, [settings, loading]);

  useEffect(() => {
    let cancelled = false;

    if (!hasToken || !hasShippingAddress || !originAddress) {
      setStops([]);
      setRouteGeometry(null);
      setStatus('idle');
      return () => {
        cancelled = true;
      };
    }

    async function loadRoute() {
      setStatus('loading');
      setError('');

      try {
        const [originFeatures, destinationFeatures] = await Promise.all([
          geocodeAddress(originAddress),
          geocodeAddress(shippingAddress as string),
        ]);
        if (cancelled) return;

        const originCenter = originFeatures?.[0]?.center;
        const destinationCenter = destinationFeatures?.[0]?.center;
        if (!Array.isArray(originCenter) || !Array.isArray(destinationCenter)) {
          setStops([]);
          setRouteGeometry(null);
          setStatus('empty');
          return;
        }

        const nextStops: RouteStop[] = [
          {
            id: 'origin',
            lng: Number(originCenter[0]),
            lat: Number(originCenter[1]),
            position: 1,
          },
          {
            id: 'destination',
            lng: Number(destinationCenter[0]),
            lat: Number(destinationCenter[1]),
            position: 2,
            isActive: true,
          },
        ];

        const route = await getRouteDirections(nextStops);
        if (cancelled) return;

        setStops(nextStops);
        setRouteGeometry(route);
        setStatus('ready');
      } catch (err) {
        if (cancelled) return;
        setStops([]);
        setRouteGeometry(null);
        setStatus('error');
        setError(err instanceof Error ? err.message : 'No se pudo calcular la ruta.');
      }
    }

    loadRoute();

    return () => {
      cancelled = true;
    };
  }, [hasToken, hasShippingAddress, originAddress, shippingAddress]);

  const mapContent = useMemo(() => {
    if (!hasShippingAddress) {
      return (
        <EmptyState
          className="bg-muted/30 h-full"
          icon={<MapPin />}
          title="Sin dirección de envío"
          description="Añade una dirección de envío al pedido para mostrar la ruta en el mapa."
        />
      );
    }

    if (!hasToken) {
      return (
        <EmptyState
          className="bg-muted/30 h-full"
          icon={<MapPin />}
          title="Mapa no disponible"
          description="Falta configurar NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN para mostrar la ruta."
        />
      );
    }

    if (status === 'error') {
      return (
        <EmptyState
          className="bg-muted/30 h-full"
          icon={<MapPin />}
          title="No se pudo calcular la ruta"
          description={error || 'Inténtalo de nuevo más tarde.'}
        />
      );
    }

    if (status === 'empty') {
      return (
        <EmptyState
          className="bg-muted/30 h-full"
          icon={<MapPin />}
          title="Ruta no disponible"
          description="No se ha podido ubicar el origen o el destino en el mapa."
        />
      );
    }

    if (status !== 'ready') {
      return (
        <EmptyState
          className="bg-muted/30 h-full"
          icon={<MapPin />}
          title="Calculando ruta..."
          description="Localizando origen y destino."
        />
      );
    }

    return (
      <TypedRouteMap
        stops={stops}
        routeGeometry={routeGeometry}
        className="h-full rounded-none border-0"
      />
    );
  }, [hasShippingAddress, hasToken, status, error, stops, routeGeometry]);

  if (!mounted) return null;

  return (
    <div className={isMobile ? 'flex h-full min-h-0 w-full flex-col' : 'h-full pb-2'}>
      <Card className="h-full overflow-hidden">
        <CardContent className="h-full w-full p-0">{mapContent}</CardContent>
      </Card>
    </div>
  );
};

export default OrderMap;
