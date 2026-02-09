import React, { useMemo } from 'react'
import { CalendarIcon, FileText, Package, Truck, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useOrderContext } from '@/context/OrderContext';
import { formatInteger, formatDecimalWeight, formatDecimalCurrency } from '@/helpers/formats/numbers/formatNumbers';
import { formatDate } from '@/helpers/formats/dates/formatDates';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';

// Mover API key a constante fuera del componente
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyBh1lKDP8noxYHU6dXDs3Yjqyg_PpC5Ks4';

const OrderDetails = () => {
    const { order } = useOrderContext();
    const isMobile = useIsMobile();

    // Memoizar encodedAddress para evitar recálculos innecesarios
    const encodedAddress = useMemo(() => {
        return order?.shippingAddress ? encodeURIComponent(order.shippingAddress) : '';
    }, [order?.shippingAddress]);

    // Memoizar URL del mapa
    const mapUrl = useMemo(() => {
        if (!encodedAddress) return '';
        return `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_API_KEY}&q=${encodedAddress}`;
    }, [encodedAddress]);

    if (isMobile) {
        return (
            <div className="flex-1 flex flex-col min-h-0">
                <ScrollArea className="flex-1 min-h-0">
                    <div className="space-y-6 pb-4">
                {/* Comercial */}
                <div className="space-y-3">
                    <div className="flex flex-col items-center justify-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">Comercial</h3>
                    </div>
                    <div className="space-y-3">
                        <div className="text-center">
                            <div className="text-sm font-medium text-muted-foreground">Vendedor</div>
                            <div className="font-medium">{order.salesperson.name}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-sm font-medium text-muted-foreground">Forma de pago</div>
                            <div className="font-medium">{order.paymentTerm.name}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-sm font-medium text-muted-foreground">Incoterm</div>
                            <div className="font-medium">{`${order.incoterm.code} - ${order.incoterm.description}`}</div>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Fechas */}
                <div className="space-y-3">
                    <div className="flex flex-col items-center justify-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">Fechas</h3>
                    </div>
                    <div className="space-y-3">
                        <div className="text-center">
                            <div className="text-sm font-medium text-muted-foreground">Entrada</div>
                            <div className="font-medium">{formatDate(order.entryDate)}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-sm font-medium text-muted-foreground">Carga prevista</div>
                            <div className="font-medium">{formatDate(order.loadDate)}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-sm font-medium text-muted-foreground">Referencia Cliente</div>
                            <div className="font-medium">{order.buyerReference}</div>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Resumen */}
                <div className="space-y-3">
                    <div className="flex flex-col items-center justify-center gap-2">
                        <Package className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">Resumen</h3>
                    </div>
                    <div className="space-y-3">
                        <div className="text-center">
                            <div className="text-sm font-medium text-muted-foreground">Total productos</div>
                            <div className="font-medium">
                                {order.totalNetWeight ? formatDecimalWeight(order.totalNetWeight) : '-'}
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-sm font-medium text-muted-foreground">Unidades de envasado</div>
                            <div className="font-medium">
                                {order.totalBoxes ? `${formatInteger(order.totalBoxes)} cajas (${order.numberOfPallets} palets)` : '-'}
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-sm font-medium text-muted-foreground">Importe</div>
                            <div className="font-medium">{formatDecimalCurrency(order.totalAmount)}</div>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Envío */}
                <div className="space-y-3">
                    <div className="flex flex-col items-center justify-center gap-2">
                        <Truck className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">Envío</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="text-center">
                            <div className="text-base font-semibold mb-1.5">Dirección de entrega</div>
                            <p className="text-sm font-light whitespace-pre-line">{order.shippingAddress}</p>
                        </div>
                        <div className="text-center">
                            <div className="text-base font-semibold mb-1.5">Transporte</div>
                            <div className="text-sm font-medium mb-2">{order.transport.name}</div>
                            <div className="text-sm text-muted-foreground whitespace-pre-line mt-2">
                                <ul className="list-none flex flex-col items-center gap-1">
                                    {order.transport.emails.map((email) => (
                                        <li key={email} className="text-xs font-medium">
                                            <a href={`mailto:${email}`} className="hover:underline">
                                                {email}
                                            </a>
                                        </li>
                                    ))}
                                    {order.transport.ccEmails.map((copyEmail) => (
                                        <li key={copyEmail} className="text-xs font-medium">
                                            <div className="flex gap-1 items-center justify-center">
                                                <Badge variant="outline" className="px-1">CC</Badge>
                                                <a href={`mailto:${copyEmail}`} className="hover:underline">
                                                    {copyEmail}
                                                </a>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-base font-semibold mb-1.5">Observaciones</div>
                            <div className="text-sm text-muted-foreground">
                                {order.transportationNotes}
                            </div>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Mapa */}
                <div className="space-y-3">
                    <div className="map-container rounded-lg overflow-hidden">
                        <iframe
                            width="100%"
                            height="270"
                            style={{ border: 0 }}
                            loading="lazy"
                            allowFullScreen
                            src={mapUrl}
                        />
                    </div>
                </div>
                    </div>
                </ScrollArea>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ">
            <Card className='bg-transparent'>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Comercial
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3">
                    <div>
                        <div className="text-sm text-muted-foreground">Vendedor</div>
                        <div className="font-medium">{order.salesperson.name}</div>
                    </div>
                    <div>
                        <div className="text-sm text-muted-foreground">Forma de pago</div>
                        <div className="font-medium">{order.paymentTerm.name}</div>
                    </div>
                    <div>
                        <div className="text-sm text-muted-foreground">Incoterm</div>
                        <div className="font-medium">{`${order.incoterm.code} - ${order.incoterm.description}`}</div>
                    </div>
                </CardContent>
            </Card>
            <Card className='bg-transparent'>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        Fechas
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3">
                    <div>
                        <div className="text-sm text-muted-foreground">Entrada</div>
                        <div className="font-medium">{formatDate(order.entryDate)}</div>
                    </div>
                    <div>
                        <div className="text-sm text-muted-foreground">Carga prevista</div>
                        <div className="font-medium">{formatDate(order.loadDate)}</div>
                    </div>
                    <div>
                        <div className="text-sm text-muted-foreground">Referencia Cliente</div>
                        <div className="font-medium">{order.buyerReference}</div>
                    </div>
                </CardContent>
            </Card>
            <Card className='bg-transparent'>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Resumen
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3">
                    <div>
                        <div className="text-sm text-muted-foreground">Total productos</div>
                        <div className="font-medium">
                            {order.totalNetWeight ? formatDecimalWeight(order.totalNetWeight) : '-'}
                        </div>
                    </div>
                    <div>
                        <div className="text-sm text-muted-foreground">Unidades de envasado</div>
                        <div className="font-medium">
                            {order.totalBoxes ? `${formatInteger(order.totalBoxes)} cajas (${order.numberOfPallets} palets)` : '-'}
                        </div>
                    </div>
                    <div>
                        <div className="text-sm text-muted-foreground">Importe</div>
                        <div className="font-medium">{formatDecimalCurrency(order.totalAmount)}</div>
                    </div>
                </CardContent>
            </Card>
            {/* <Card className="md:col-span-2 bg-transparent">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Envío
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 ">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <div className="text-sm font-medium mb-1.5">Dirección de entrega</div>
                            <p className="text-sm font-light whitespace-pre-line">{order.shippingAddress}</p>
                        </div>
                        <div>
                            <div className="text-sm font-medium mb-1.5">Transporte</div>
                            <div className="text-sm">{order.transport.name}</div>
                            <div className="text-sm text-muted-foreground whitespace-pre-line">
                                <ul className="list-disc px-5 pl-8">
                                    {order.transport.emailsArray.map((email) => (
                                        <li key={email} className="text-xs font-medium">
                                            <a href={`mailto:${email}`} className=" hover:underline">
                                                {email}
                                            </a>
                                        </li>
                                    ))}
                                    {order.transport.ccEmailsArray.map((copyEmail) => (
                                        <li key={copyEmail} className="text-xs font-medium">
                                            <div className="flex gap-1 items-center">
                                                <Badge variant="outline" className="px-1">CC</Badge>
                                                <a href={`mailto:${copyEmail}`} className=" hover:underline">
                                                    {copyEmail}
                                                </a>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className="text-sm font-medium mb-1.5">Observaciones</div>
                        <div className="text-sm text-muted-foreground">
                            Temperatura controlada requerida durante el transporte
                        </div>
                    </div>
                </CardContent>
            </Card> */}
            <Card className="md:col-span-2 bg-transparent">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Envío
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 ">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <div className="text-sm font-medium mb-1.5">Dirección de entrega</div>
                            <p className="text-sm font-light whitespace-pre-line">{order.shippingAddress}</p>
                        </div>
                        <div>
                            <div className="text-sm font-medium mb-1.5">Transporte</div>
                            <div className="text-sm">{order.transport.name}</div>
                            <div className="text-sm text-muted-foreground whitespace-pre-line">
                                <ul className="list-disc px-5 pl-8">
                                    {order.transport.emails.map((email) => (
                                        <li key={email} className="text-xs font-medium">
                                            <a href={`mailto:${email}`} className=" hover:underline">
                                                {email}
                                            </a>
                                        </li>
                                    ))}
                                    {order.transport.ccEmails.map((copyEmail) => (
                                        <li key={copyEmail} className="text-xs font-medium">
                                            <div className="flex gap-1 items-center">
                                                <Badge variant="outline" className="px-1">CC</Badge>
                                                <a href={`mailto:${copyEmail}`} className=" hover:underline">
                                                    {copyEmail}
                                                </a>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>



                        </div>
                        <div>
                            <div className="text-sm font-medium mb-1.5">Observaciones</div>
                            <div className="text-sm text-muted-foreground">
                                {order.transportationNotes}
                            </div>
                        </div>

                        {/* Matrículas de camión y remolque */}
                        <div>
                            <div className="text-sm font-medium mb-1.5">Matrículas</div>
                            <div className=" grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
                                {/* Matrícula del Camión */}

                                <div>
                                    {/* <div className="text-xs font-medium text-muted-foreground mb-1">Camión</div> */}
                                    <div className=" w-full flex items-center rounded overflow-hidden shadow-md border border-black dark:border-white h-[32px] bg-blue-700">
                                        <div className=" text-white flex items-center justify-center px-1 h-full ">
                                            <div className="flex flex-col items-center text-xs leading-none gap-0.5">
                                                <span className=" ">
                                                    <Image src="/images/transports/eu-stars.svg" width={13} height={13} alt="Spain Flag" />
                                                </span>
                                                <span className="text-[9px] font-semibold">EU</span>
                                            </div>
                                        </div>
                                        <div style={{fontFamily: 'OCR A Std, monospace', fontWeight:600}} className="flex items-center justify-center bg-white text-black h-full py-0.5 text-[22px]   lining-nums flex-1 text-center">
                                            {order.truckPlate ? order.truckPlate
                                                : (
                                                    <span className="animate-pulse">0000 AAA</span>
                                                )}

                                        </div>
                                    </div>
                                </div>

                                {/* Matrícula del Remolque */}
                                <div>
                                    {/* <div className="text-xs font-medium text-muted-foreground mb-1">Remolque</div> */}
                                    <div className="w-full flex items-center rounded overflow-hidden shadow-md h-[34px] border-2 border-red-800 bg-red-600">
                                        <div style={{fontFamily: 'OCR A Std, monospace', fontWeight:600}} className=" flex items-center justify-center  text-white h-full py-0.5 text-[22px] lining-nums flex-1 text-center">
                                            {order.trailerPlate ? order.trailerPlate
                                                : (
                                                    <span className="animate-pulse">R-0000 AAA</span>
                                                )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </CardContent>
            </Card>

            <Card className='overflow-hidden bg-transparent'>
                <CardContent className="grid p-0 ">
                    <div className="map-container">
                        <iframe
                            width="100%"
                            height="270"
                            style={{ border: 0 }}
                            loading="lazy"
                            allowFullScreen
                            src={mapUrl}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default OrderDetails