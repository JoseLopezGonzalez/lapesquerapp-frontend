import React from 'react'
import { CalendarIcon, FileText, Package, Truck, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOrderContext } from '@/context/OrderContext';
import { formatInteger, formatDecimalWeight, formatDecimalCurrency } from '@/helpers/formats/numbers/formatNumbers';
import { formatDate } from '@/helpers/formats/dates/formatDates';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

const OrderDetails = () => {
    const { order } = useOrderContext();

    const encodedAddress = encodeURIComponent(order.shippingAddress);
    const googleApiKey = 'AIzaSyBh1lKDP8noxYHU6dXDs3Yjqyg_PpC5Ks4';

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        <div>
                            <div className="text-sm font-medium mb-1.5">Observaciones</div>
                            <div className="text-sm text-muted-foreground">
                                {order.transportationNotes}
                            </div>
                        </div>

                        {/* Matrículas de camión y remolque */}
                        <div>
                            <div className="text-sm font-medium mb-1.5">Matrículas</div>
                            <div className=" grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {/* Matrícula del Camión */}

                                <div>
                                    {/* <div className="text-xs font-medium text-muted-foreground mb-1">Camión</div> */}
                                    <div className=" w-full flex items-center rounded overflow-hidden shadow-md border border-white h-[40px] bg-blue-700">
                                        <div className=" text-white flex items-center justify-center px-1 h-full">
                                            <div className="flex flex-col items-center text-xs leading-none gap-0.5">
                                                <span className=" ">
                                                    <Image src="/images/transports/eu-stars.svg" width={15} height={15} alt="Spain Flag" />
                                                </span>
                                                <span className="text-[11px] font-semibold">EU</span>
                                            </div>
                                        </div>
                                        <div style={{fontFamily: 'OCR A Std, monospace', fontWeight:600}} className="flex items-center justify-center bg-white text-black h-full py-0.5 text-[26px]   lining-nums flex-1 text-center">
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
                                    <div className="w-full flex items-center rounded overflow-hidden shadow-md h-[40px] border-2 border-red-800 bg-red-600">
                                        <div style={{fontFamily: 'OCR A Std, monospace', fontWeight:600}} className=" flex items-center justify-center  text-white h-full py-0.5 text-[26px] lining-nums flex-1 text-center">
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
                            src={`https://www.google.com/maps/embed/v1/place?key=${googleApiKey}&q=${encodedAddress}`}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default OrderDetails