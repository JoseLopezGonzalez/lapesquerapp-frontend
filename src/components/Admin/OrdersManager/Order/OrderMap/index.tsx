'use client';

import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { COMPANY_NAME } from '@/configs/config';
import { useOrderContext } from '@/context/OrderContext';
import { useSettings } from '@/context/SettingsContext';
import { useIsMobileSafe } from '@/hooks/use-mobile';
import { EmptyState } from '@/components/Utilities/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const OrderMap = () => {
  const { order } = useOrderContext();
  const { settings, loading } = useSettings();
  const { isMobile, mounted } = useIsMobileSafe();
  const [loadedMapSrc, setLoadedMapSrc] = useState<string | null>(null);

  const origin = !loading && settings?.['company.name'] ? settings['company.name'] : COMPANY_NAME;
  const shippingAddress = order?.shippingAddress as string | undefined;
  const hasShippingAddress = Boolean(shippingAddress);
  const mapSrc =
    hasShippingAddress && GOOGLE_API_KEY
      ? `https://www.google.com/maps/embed/v1/directions?key=${GOOGLE_API_KEY}&origin=${encodeURIComponent(
          origin
        )}&destination=${encodeURIComponent(shippingAddress as string)}&mode=driving`
      : null;

  const mapContent = mapSrc ? (
    <div className="relative h-full w-full">
      {loadedMapSrc !== mapSrc && (
        <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
      )}
      <iframe
        className={loadedMapSrc === mapSrc ? 'block' : 'invisible'}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
        src={mapSrc}
        onLoad={() => setLoadedMapSrc(mapSrc)}
      />
    </div>
  ) : (
    <EmptyState
      className="h-full bg-muted/30"
      icon={<MapPin />}
      title={hasShippingAddress ? 'Mapa no disponible' : 'Sin dirección de envío'}
      description={
        hasShippingAddress
          ? 'No se puede mostrar el mapa porque falta la configuración de Google Maps.'
          : 'Añade una dirección de envío al pedido para mostrar la ruta en el mapa.'
      }
    />
  );

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
