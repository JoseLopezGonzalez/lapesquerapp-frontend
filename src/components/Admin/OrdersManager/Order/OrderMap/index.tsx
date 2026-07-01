'use client';

import { Card, CardContent } from '@/components/ui/card';
import { COMPANY_NAME } from '@/configs/config';
import { useOrderContext } from '@/context/OrderContext';
import { useSettings } from '@/context/SettingsContext';
import { useIsMobile } from '@/hooks/use-mobile';

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const OrderMap = () => {
  const { order } = useOrderContext();
  const { settings, loading } = useSettings();
  const isMobile = useIsMobile();

  const origin = !loading && settings?.['company.name'] ? settings['company.name'] : COMPANY_NAME;
  const hasShippingAddress = Boolean(order?.shippingAddress);

  const mapContent =
    hasShippingAddress && GOOGLE_API_KEY ? (
      <iframe
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
        src={`https://www.google.com/maps/embed/v1/directions?key=${GOOGLE_API_KEY}&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(order.shippingAddress)}&mode=driving`}
      />
    ) : (
      <div className="text-muted-foreground flex h-full w-full items-center justify-center p-4 text-sm">
        Sin dirección de envío
      </div>
    );

  return (
    <div className={isMobile ? 'flex h-full min-h-0 w-full flex-col' : 'h-full pb-2'}>
      <Card className="h-full overflow-hidden">
        <CardContent className="h-full w-full p-0">{mapContent}</CardContent>
      </Card>
    </div>
  );
};

export default OrderMap;
