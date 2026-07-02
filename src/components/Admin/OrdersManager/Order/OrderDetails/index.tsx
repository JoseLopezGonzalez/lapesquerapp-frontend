'use client';

import React, { useMemo } from 'react';
import { FileText, Package, Truck, Wallet, MapPinOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { EmptyState } from '@/components/Utilities/EmptyState';
import { useOrderContext } from '@/context/OrderContext';
import {
  formatInteger,
  formatDecimal,
  formatDecimalWeight,
  formatDecimalCurrency,
} from '@/helpers/formats/numbers/formatNumbers';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { useIsMobileSafe } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ExternalProcessor {
  id?: number | string;
  name?: string;
  vatNumber?: string;
  sanitaryRegistrationNumber?: string | null;
  contactPerson?: string | null;
  phone?: string | null;
  emails?: string[];
  ccEmails?: string[];
  address?: string | null;
  city?: string | null;
  province?: string | null;
  [key: string]: unknown;
}

interface OrderIncoterm {
  code?: string;
  description?: string;
  [key: string]: unknown;
}

interface OrderTransport {
  name?: string;
  emails?: string[];
  ccEmails?: string[];
  [key: string]: unknown;
}

interface Order {
  salesperson?: { name?: string } | null;
  fieldOperator?: { name?: string } | null;
  paymentTerm?: { name?: string } | null;
  incoterm?: OrderIncoterm | null;
  externalProcessor?: ExternalProcessor | null;
  maquiladorDestination?: string | null;
  loadingAddress?: string | null;
  totalCost?: number | null;
  costPerKg?: number | null;
  grossMargin?: number | null;
  marginPerKg?: number | null;
  marginPercentage?: number | null;
  totalNetWeight?: number | null;
  totalBoxes?: number | null;
  numberOfPallets?: number | null;
  totalAmount?: number | null;
  revenuePerKg?: number | null;
  auxiliarySubtotal?: number | null;
  auxiliaryTotal?: number | null;
  shippingAddress?: string | null;
  transport?: OrderTransport | null;
  transportationNotes?: string | null;
  truckPlate?: string | null;
  trailerPlate?: string | null;
  [key: string]: unknown;
}

const getNullableCurrency = (value: number | null | undefined) =>
  value == null ? '—' : formatDecimalCurrency(value);
const getNullablePercentage = (value: number | null | undefined) =>
  value == null ? '—' : `${formatDecimal(value)}%`;
const getNullableCurrencyPerKg = (value: number | null | undefined) =>
  value == null ? '—' : `${formatDecimal(value)} €/kg`;

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

interface OrderDetailsProps {
  canViewCostData?: boolean;
}

const OrderDetails = ({ canViewCostData = true }: OrderDetailsProps) => {
  const { order } = useOrderContext() as { order: Order };
  const { isMobile, mounted } = useIsMobileSafe();

  const encodedAddress = useMemo(() => {
    return order?.shippingAddress ? encodeURIComponent(order.shippingAddress) : '';
  }, [order?.shippingAddress]);

  const mapUrl = useMemo(() => {
    if (!encodedAddress || !GOOGLE_API_KEY) return '';
    return `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_API_KEY}&q=${encodedAddress}`;
  }, [encodedAddress]);

  if (!mounted) return null;

  if (isMobile) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-6 pb-4">
            {/* Comercial */}
            <div className="space-y-3">
              <div className="flex flex-col items-center justify-center gap-2">
                <FileText className="text-primary h-5 w-5" />
                <h3 className="text-lg font-medium">Comercial</h3>
              </div>
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-muted-foreground text-sm">Vendedor</div>
                  <div className="font-medium">{order.salesperson?.name ?? '—'}</div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground text-sm">Repartidor</div>
                  <div className="font-medium">{order.fieldOperator?.name ?? 'Sin repartidor'}</div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground text-sm">Forma de pago</div>
                  <div className="font-medium">{order.paymentTerm?.name ?? '—'}</div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground text-sm">Incoterm</div>
                  <div className="font-medium">
                    {order.incoterm
                      ? `${order.incoterm.code} - ${order.incoterm.description}`
                      : '—'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground text-sm">Maquilador</div>
                  {order.externalProcessor ? (
                    <div className="font-medium">
                      <div>{order.externalProcessor.name}</div>
                      {order.externalProcessor.vatNumber && (
                        <div className="text-muted-foreground text-xs">
                          {order.externalProcessor.vatNumber}
                        </div>
                      )}
                      {order.externalProcessor.sanitaryRegistrationNumber && (
                        <div className="text-muted-foreground text-xs">
                          Reg. san.: {order.externalProcessor.sanitaryRegistrationNumber}
                        </div>
                      )}
                      {order.externalProcessor.contactPerson && (
                        <div className="text-muted-foreground text-xs">
                          {order.externalProcessor.contactPerson}
                          {order.externalProcessor.phone
                            ? ` · ${order.externalProcessor.phone}`
                            : ''}
                        </div>
                      )}
                      <div className="mt-2 space-y-1 border-t pt-2 text-left">
                        <div>
                          <div className="text-muted-foreground text-xs font-medium">
                            Destino en sus docs
                          </div>
                          <div className="text-xs">
                            {order.maquiladorDestination ?? (
                              <span className="text-muted-foreground italic">No configurado</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs font-medium">
                            Lugar de carga
                          </div>
                          <div className="text-xs">
                            {order.loadingAddress ?? (
                              <span className="text-muted-foreground italic">No configurado</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted-foreground font-medium">Sin maquilador</div>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {canViewCostData && (
              <>
                {/* Rentabilidad */}
                <div className="space-y-3">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Wallet className="text-primary h-5 w-5" />
                    <h3 className="text-lg font-medium">Rentabilidad</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="text-center">
                      <div className="text-muted-foreground text-sm">Coste total</div>
                      <div className="font-medium">{getNullableCurrency(order.totalCost)}</div>
                      <div className="text-muted-foreground mt-1 text-xs">
                        {getNullableCurrencyPerKg(order.costPerKg)}
                      </div>
                      {order.totalCost == null ? (
                        <div className="text-muted-foreground mt-1 text-xs">
                          Sin coste calculable
                        </div>
                      ) : null}
                    </div>
                    <div className="text-center">
                      <div className="text-muted-foreground text-sm">Margen bruto</div>
                      <div className="font-medium">{getNullableCurrency(order.grossMargin)}</div>
                      <div className="text-muted-foreground mt-1 text-xs">
                        {getNullableCurrencyPerKg(order.marginPerKg)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-muted-foreground text-sm">Margen %</div>
                      <div className="font-medium">
                        {getNullablePercentage(order.marginPercentage)}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />
              </>
            )}

            {/* Resumen */}
            <div className="space-y-3">
              <div className="flex flex-col items-center justify-center gap-2">
                <Package className="text-primary h-5 w-5" />
                <h3 className="text-lg font-medium">Resumen</h3>
              </div>
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-muted-foreground text-sm">Total productos</div>
                  <div className="font-medium">
                    {order.totalNetWeight ? formatDecimalWeight(order.totalNetWeight) : '-'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground text-sm">Unidades de envasado</div>
                  <div className="font-medium">
                    {order.totalBoxes
                      ? `${formatInteger(order.totalBoxes)} cajas (${order.numberOfPallets} palets)`
                      : '-'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground text-sm">Importe</div>
                  <div className="font-medium">{getNullableCurrency(order.totalAmount)}</div>
                  <div className="text-muted-foreground mt-1 text-xs">
                    {getNullableCurrencyPerKg(order.revenuePerKg)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground text-sm">Otros artículos (subtotal)</div>
                  <div className="font-medium">{getNullableCurrency(order.auxiliarySubtotal)}</div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground text-sm">Otros artículos (total)</div>
                  <div className="font-medium">{getNullableCurrency(order.auxiliaryTotal)}</div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Envío */}
            <div className="space-y-3">
              <div className="flex flex-col items-center justify-center gap-2">
                <Truck className="text-primary h-5 w-5" />
                <h3 className="text-lg font-medium">Envío</h3>
              </div>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="mb-1.5 text-base font-medium">Dirección de entrega</div>
                  <p className="text-sm font-light whitespace-pre-line">
                    {order.shippingAddress ?? '—'}
                  </p>
                </div>
                <div className="text-center">
                  <div className="mb-1.5 text-base font-medium">Transporte</div>
                  <div className="mb-2 text-sm font-medium">{order.transport?.name ?? '—'}</div>
                  <div className="text-muted-foreground mt-2 text-sm whitespace-pre-line">
                    <ul className="flex list-none flex-col items-center gap-1">
                      {(order.transport?.emails ?? []).map((email) => (
                        <li key={email} className="text-xs font-medium">
                          <a href={`mailto:${email}`} className="hover:underline">
                            {email}
                          </a>
                        </li>
                      ))}
                      {(order.transport?.ccEmails ?? []).map((copyEmail) => (
                        <li key={copyEmail} className="text-xs font-medium">
                          <div className="flex items-center justify-center gap-1">
                            <Badge variant="outline" className="px-1">
                              CC
                            </Badge>
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
                  <div className="mb-1.5 text-base font-medium">Observaciones</div>
                  <div className="text-muted-foreground text-sm">
                    {order.transportationNotes ?? '—'}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Mapa */}
            <div className="space-y-3">
              <div className="map-container overflow-hidden rounded-lg">
                {mapUrl ? (
                  <iframe
                    width="100%"
                    height="270"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    src={mapUrl}
                  />
                ) : (
                  <EmptyState
                    title="Sin dirección de envío"
                    description="No hay dirección configurada para mostrar en el mapa."
                    icon={<MapPinOff />}
                    className="bg-muted/30 h-[270px] rounded-lg"
                  />
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-1 gap-4 ${canViewCostData ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-4" />
            Comercial
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div>
            <div className="text-muted-foreground text-sm">Vendedor</div>
            <div className="text-sm font-medium">{order.salesperson?.name ?? '—'}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-sm">Repartidor</div>
            <div className="text-sm font-medium">
              {order.fieldOperator?.name ?? 'Sin repartidor'}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-sm">Forma de pago</div>
            <div className="text-sm font-medium">{order.paymentTerm?.name ?? '—'}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-sm">Incoterm</div>
            <div className="text-sm font-medium">
              {order.incoterm ? `${order.incoterm.code} - ${order.incoterm.description}` : '—'}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-sm">Maquilador</div>
            {order.externalProcessor ? (
              <div className="text-sm font-medium">
                <div>{order.externalProcessor.name}</div>
                {order.externalProcessor.vatNumber && (
                  <div className="text-muted-foreground text-xs">
                    {order.externalProcessor.vatNumber}
                  </div>
                )}
                {order.externalProcessor.sanitaryRegistrationNumber && (
                  <div className="text-muted-foreground text-xs">
                    Reg. san.: {order.externalProcessor.sanitaryRegistrationNumber}
                  </div>
                )}
                {order.externalProcessor.contactPerson && (
                  <div className="text-muted-foreground text-xs">
                    {order.externalProcessor.contactPerson}
                    {order.externalProcessor.phone ? ` · ${order.externalProcessor.phone}` : ''}
                  </div>
                )}
                <div className="mt-2 space-y-1 border-t pt-2">
                  <div>
                    <div className="text-muted-foreground text-xs font-medium">
                      Destino en sus docs
                    </div>
                    <div className="text-xs font-normal">
                      {order.maquiladorDestination ?? (
                        <span className="text-muted-foreground italic">
                          No configurado — se usará &apos;Cliente #ID&apos;
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs font-medium">Lugar de carga</div>
                    <div className="text-xs font-normal">
                      {order.loadingAddress ?? (
                        <span className="text-muted-foreground italic">
                          No configurado — dirección del maquilador o empresa
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">Sin maquilador</div>
            )}
          </div>
        </CardContent>
      </Card>
      {canViewCostData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="size-4" />
              Rentabilidad
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div>
              <div className="text-muted-foreground text-sm">Coste total</div>
              <div className="text-sm font-medium">{getNullableCurrency(order.totalCost)}</div>
              <div className="text-muted-foreground mt-1 text-xs">
                {getNullableCurrencyPerKg(order.costPerKg)}
              </div>
              {order.totalCost == null ? (
                <div className="text-muted-foreground mt-1 text-xs">Sin coste calculable</div>
              ) : null}
            </div>
            <div>
              <div className="text-muted-foreground text-sm">Margen bruto</div>
              <div className="text-sm font-medium">{getNullableCurrency(order.grossMargin)}</div>
              <div className="text-muted-foreground mt-1 text-xs">
                {getNullableCurrencyPerKg(order.marginPerKg)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground text-sm">Margen %</div>
              <div className="text-sm font-medium">
                {getNullablePercentage(order.marginPercentage)}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="size-4" />
            Resumen
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div>
            <div className="text-muted-foreground text-sm">Total productos</div>
            <div className="text-sm font-medium">
              {order.totalNetWeight ? formatDecimalWeight(order.totalNetWeight) : '-'}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-sm">Unidades de envasado</div>
            <div className="text-sm font-medium">
              {order.totalBoxes
                ? `${formatInteger(order.totalBoxes)} cajas (${order.numberOfPallets} palets)`
                : '-'}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-sm">Importe</div>
            <div className="text-sm font-medium">{getNullableCurrency(order.totalAmount)}</div>
            <div className="text-muted-foreground mt-1 text-xs">
              {getNullableCurrencyPerKg(order.revenuePerKg)}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-sm">Otros artículos (subtotal)</div>
            <div className="text-sm font-medium">
              {getNullableCurrency(order.auxiliarySubtotal)}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-sm">Otros artículos (total)</div>
            <div className="text-sm font-medium">{getNullableCurrency(order.auxiliaryTotal)}</div>
          </div>
        </CardContent>
      </Card>
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="size-4" />
            Envío
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-muted-foreground text-sm">Dirección de entrega</div>
              <p className="text-sm font-medium whitespace-pre-line">
                {order.shippingAddress ?? '—'}
              </p>
            </div>
            <div>
              <div className="text-muted-foreground text-sm">Transporte</div>
              <div className="text-sm font-medium">{order.transport?.name ?? '—'}</div>
              <div className="text-muted-foreground text-sm whitespace-pre-line">
                <ul className="list-disc px-5 pl-8">
                  {(order.transport?.emails ?? []).map((email) => (
                    <li key={email}>
                      <a href={`mailto:${email}`} className="hover:underline">
                        {email}
                      </a>
                    </li>
                  ))}
                  {(order.transport?.ccEmails ?? []).map((copyEmail) => (
                    <li key={copyEmail}>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="px-1">
                          CC
                        </Badge>
                        <a href={`mailto:${copyEmail}`} className="hover:underline">
                          {copyEmail}
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div>
              <div className="text-muted-foreground text-sm">Observaciones</div>
              <div className="text-sm font-medium">{order.transportationNotes ?? '—'}</div>
            </div>

            {/* Matrículas de camión y remolque */}
            <div>
              <div className="text-muted-foreground text-sm">Matrículas</div>
              <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-2">
                <div>
                  <div className="flex h-[32px] w-full items-center overflow-hidden rounded border border-black bg-blue-700 shadow-md dark:border-white">
                    <div className="flex h-full items-center justify-center px-1 text-white">
                      <div className="flex flex-col items-center gap-0.5 text-xs leading-none">
                        <span>
                          <Image
                            src="/images/transports/eu-stars.svg"
                            width={13}
                            height={13}
                            alt="Spain Flag"
                          />
                        </span>
                        <span className="text-xs font-medium">EU</span>
                      </div>
                    </div>
                    <div
                      style={{ fontFamily: 'OCR A Std, monospace', fontWeight: 600 }}
                      className="flex h-full flex-1 items-center justify-center bg-white py-0.5 text-center text-[22px] text-black lining-nums"
                    >
                      {order.truckPlate ? (
                        order.truckPlate
                      ) : (
                        <span className="animate-pulse">0000 AAA</span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex h-[34px] w-full items-center overflow-hidden rounded border-2 border-red-800 bg-red-600 shadow-md">
                    <div
                      style={{ fontFamily: 'OCR A Std, monospace', fontWeight: 600 }}
                      className="flex h-full flex-1 items-center justify-center py-0.5 text-center text-[22px] text-white lining-nums"
                    >
                      {order.trailerPlate ? (
                        order.trailerPlate
                      ) : (
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

      <Card className="overflow-hidden">
        <CardContent className="grid p-0">
          <div className="map-container">
            {mapUrl ? (
              <iframe
                width="100%"
                height="270"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                src={mapUrl}
              />
            ) : (
              <EmptyState
                title="Sin dirección de envío"
                description="No hay dirección configurada para mostrar en el mapa."
                icon={<MapPinOff />}
                className="bg-muted/30 h-[270px]"
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderDetails;
