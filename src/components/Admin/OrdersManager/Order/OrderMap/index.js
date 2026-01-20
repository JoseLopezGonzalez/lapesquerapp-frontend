'use client'

import { Card, CardContent } from "@/components/ui/card";
import { COMPANY_NAME } from "@/configs/config";
import { useOrderContext } from "@/context/OrderContext";
import { useSettings } from "@/context/SettingsContext";

const OrderMap = () => {
    const { order } = useOrderContext();
    const { settings, loading } = useSettings();

    const googleApiKey = 'AIzaSyBh1lKDP8noxYHU6dXDs3Yjqyg_PpC5Ks4';
    const origin = !loading && settings?.["company.name"] ? settings["company.name"] : COMPANY_NAME;

    return (
        <div className='h-full pb-2'>
            <Card className='h-full overflow-hidden'>
                <CardContent className="h-full w-full p-0">
                    <iframe
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        src={`https://www.google.com/maps/embed/v1/directions?key=${googleApiKey}&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(order.shippingAddress)}&mode=driving`}
                    />
                </CardContent>
            </Card>
        </div>
    );
};

export default OrderMap;
