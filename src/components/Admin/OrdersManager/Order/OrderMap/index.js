'use client'

import React, { useState } from "react";

import {
    Card,
    CardContent,
} from "@/components/ui/card";

import { useOrderContext } from "@/context/OrderContext";

// Eliminamos tipos TypeScript y usamos solo JavaScript
// (Antes teníamos DocumentStatus, Document, Recipient, etc.)

const OrderMap = () => {
    const { order } = useOrderContext();

    const googleApiKey = 'AIzaSyBh1lKDP8noxYHU6dXDs3Yjqyg_PpC5Ks4';

    const origin = 'Congelados Brisamar S.L. '



    return (
        <div className='h-full pb-2'>
            <Card className='h-full overflow-hidden'>
                {/*  <CardHeader>
                    <CardTitle className="text-lg font-medium">Documentación</CardTitle>
                    <CardDescription>Envía los documentos a los diferentes destinatarios</CardDescription>
                </CardHeader> */}
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
