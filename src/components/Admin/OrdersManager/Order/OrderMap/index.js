'use client'

import { Card, CardContent } from "@/components/ui/card";
import { COMPANY_NAME } from "@/configs/config";
import { useOrderContext } from "@/context/OrderContext";
import { useSettings } from "@/context/SettingsContext";
import { useIsMobile } from "@/hooks/use-mobile";

const OrderMap = () => {
    const { order } = useOrderContext();
    const { settings, loading } = useSettings();
    const isMobile = useIsMobile();

    const googleApiKey = 'AIzaSyBh1lKDP8noxYHU6dXDs3Yjqyg_PpC5Ks4';
    const origin = !loading && settings?.["company.name"] ? settings["company.name"] : COMPANY_NAME;
    const hasShippingAddress = Boolean(order?.shippingAddress);

    const mapContent = hasShippingAddress ? (
        <iframe
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            src={`https://www.google.com/maps/embed/v1/directions?key=${googleApiKey}&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(order.shippingAddress)}&mode=driving`}
        />
    ) : (
        <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm p-4">
            Sin dirección de envío
        </div>
    );

    return (
        <div className={isMobile ? 'h-full w-full flex flex-col min-h-0' : 'h-full pb-2'}>
            <Card className='h-full overflow-hidden'>
                <CardContent className="h-full w-full p-0">
                    {mapContent}
                </CardContent>
            </Card>
        </div>
    );
};

export default OrderMap;
