'use client';

import React from 'react';
import { FileText, Package, Truck, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOrderContext } from '@/context/OrderContext';
import ProspectLocationMap from '@/components/Comercial/CRM/ProspectLocationMap';
import {
  formatInteger,
  formatDecimal,
  formatDecimalWeight,
  formatDecimalCurrency,
} from '@/helpers/formats/numbers/formatNumbers';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useIsMobileSafe } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface ExternalProcessor {
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

export interface OrderIncoterm {
  code?: string;
  description?: string;
  [key: string]: unknown;
}

export interface OrderTransport {
  name?: string;
  emails?: string[];
  ccEmails?: string[];
  [key: string]: unknown;
}

export interface OrderDetailsData {
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
  invoiced?: boolean | null;
  [key: string]: unknown;
}

const getNullableCurrency = (value: number | null | undefined) =>
  value == null ? '—' : formatDecimalCurrency(value);
const getNullablePercentage = (value: number | null | undefined) =>
  value == null ? '—' : `${formatDecimal(value)}%`;
const getNullableCurrencyPerKg = (value: number | null | undefined) =>
  value == null ? '—' : `${formatDecimal(value)} €/kg`;

/**
 * Card de la grid masonry desktop. Cabecera alineada al patrón nativo de
 * shadcn: CardTitle sin className de tamaño (hereda el text-base font-medium
 * por defecto del primitivo, sin sobrescribirlo) + descripción muted debajo,
 * sin iconos ni separadores forzados.
 */
interface MasonryCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

function MasonryCard({ title, description, children, className }: MasonryCardProps) {
  return (
    <Card className={cn('mb-4 break-inside-avoid', className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
      </CardHeader>
      <CardContent className="divide-border/60 divide-y">{children}</CardContent>
    </Card>
  );
}

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  valueClassName?: string;
}

function InfoRow({ label, value, sub, valueClassName }: InfoRowProps) {
  const isTextValue = typeof value === 'string' || typeof value === 'number';

  return (
    <div className="flex items-baseline justify-between gap-3 py-2 first:pt-0 last:pb-0">
      <span className="text-muted-foreground shrink-0 text-sm">{label}</span>
      <span className="flex min-w-0 items-baseline gap-2 text-right">
        {isTextValue ? (
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={cn('min-w-0 truncate text-sm font-semibold', valueClassName)}>
                  {value}
                </span>
              </TooltipTrigger>
              <TooltipContent>{value}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className={cn('min-w-0 truncate text-sm font-semibold', valueClassName)}>
            {value}
          </span>
        )}
        {sub && <span className="text-muted-foreground shrink-0 text-xs">{sub}</span>}
      </span>
    </div>
  );
}

interface OrderDetailsProps {
  canViewCostData?: boolean;
}

const OrderDetails = ({ canViewCostData = true }: OrderDetailsProps) => {
  const { order } = useOrderContext() as { order: OrderDetailsData };
  const { isMobile, mounted } = useIsMobileSafe();

  if (!mounted) return null;

  if (isMobile) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <ScrollArea className="min-h-0 flex-1">
          <div className="border-border bg-card mb-4 rounded-lg border">
            <Accordion type="single" collapsible defaultValue="comercial" className="w-full">
              {/* Comercial */}
              <AccordionItem value="comercial" className="">
                <AccordionTrigger className="px-4">
                  <span className="flex items-center gap-2">
                    <FileText className="text-primary h-4 w-4" />
                    Comercial
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4">
                  <div className="space-y-3">
                    <div>
                      <div className="text-muted-foreground text-sm">Vendedor</div>
                      <div className="font-medium">{order.salesperson?.name ?? '—'}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-sm">Repartidor</div>
                      <div className="font-medium">
                        {order.fieldOperator?.name ?? 'Sin repartidor'}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-sm">Forma de pago</div>
                      <div className="font-medium">{order.paymentTerm?.name ?? '—'}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-sm">Incoterm</div>
                      <div className="font-medium">
                        {order.incoterm
                          ? `${order.incoterm.code} - ${order.incoterm.description}`
                          : '—'}
                      </div>
                    </div>
                    <div>
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
                          <div className="mt-2 space-y-1 border-t pt-2">
                            <div>
                              <div className="text-muted-foreground text-xs font-medium">
                                Destino en sus docs
                              </div>
                              <div className="text-xs">
                                {order.maquiladorDestination ?? (
                                  <span className="text-muted-foreground italic">
                                    No configurado
                                  </span>
                                )}
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground text-xs font-medium">
                                Lugar de carga
                              </div>
                              <div className="text-xs">
                                {order.loadingAddress ?? (
                                  <span className="text-muted-foreground italic">
                                    No configurado
                                  </span>
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
                </AccordionContent>
              </AccordionItem>

              {/* Rentabilidad — dato restringido por rol, tratamiento visual diferenciado */}
              {canViewCostData && (
                <AccordionItem value="rentabilidad" className="">
                  <AccordionTrigger className="px-4">
                    <span className="flex items-center gap-2">
                      <Wallet className="text-primary h-4 w-4" />
                      Rentabilidad
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4">
                    <div className="border-primary/40 space-y-3 border-l-2 pl-3">
                      <p className="text-muted-foreground text-[11px]">Visible solo para tu rol</p>
                      <div>
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
                      <div>
                        <div className="text-muted-foreground text-sm">Margen bruto</div>
                        <div className="font-medium">{getNullableCurrency(order.grossMargin)}</div>
                        <div className="text-muted-foreground mt-1 text-xs">
                          {getNullableCurrencyPerKg(order.marginPerKg)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-sm">Margen %</div>
                        <div className="font-medium">
                          {getNullablePercentage(order.marginPercentage)}
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Resumen */}
              <AccordionItem value="resumen" className="">
                <AccordionTrigger className="px-4">
                  <span className="flex items-center gap-2">
                    <Package className="text-primary h-4 w-4" />
                    Resumen
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4">
                  <div className="space-y-3">
                    <div>
                      <div className="text-muted-foreground text-sm">Total productos</div>
                      <div className="font-medium">
                        {order.totalNetWeight ? formatDecimalWeight(order.totalNetWeight) : '-'}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-sm">Unidades de envasado</div>
                      <div className="font-medium">
                        {order.totalBoxes
                          ? `${formatInteger(order.totalBoxes)} cajas (${order.numberOfPallets} palets)`
                          : '-'}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-sm">Importe</div>
                      <div className="font-medium">{getNullableCurrency(order.totalAmount)}</div>
                      <div className="text-muted-foreground mt-1 text-xs">
                        {getNullableCurrencyPerKg(order.revenuePerKg)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-sm">
                        Otros artículos (subtotal)
                      </div>
                      <div className="font-medium">
                        {getNullableCurrency(order.auxiliarySubtotal)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-sm">Otros artículos (total)</div>
                      <div className="font-medium">{getNullableCurrency(order.auxiliaryTotal)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-sm">Facturado</div>
                      <Badge
                        className={cn(
                          order.invoiced
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                            : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                        )}
                      >
                        {order.invoiced ? 'Facturado' : 'Sin facturar'}
                      </Badge>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Envío */}
              <AccordionItem value="envio" className="">
                <AccordionTrigger className="px-4">
                  <span className="flex items-center gap-2">
                    <Truck className="text-primary h-4 w-4" />
                    Envío
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4">
                  <div className="space-y-4">
                    <div>
                      <div className="mb-1.5 text-sm font-medium">Dirección de entrega</div>
                      <p className="text-muted-foreground text-sm whitespace-pre-line">
                        {order.shippingAddress ?? '—'}
                      </p>
                    </div>
                    <div>
                      <div className="mb-1.5 text-sm font-medium">Transporte</div>
                      <div className="mb-2 text-sm">{order.transport?.name ?? '—'}</div>
                      <ul className="flex list-none flex-col gap-1">
                        {(order.transport?.emails ?? []).map((email) => (
                          <li key={email} className="text-xs font-medium">
                            <a href={`mailto:${email}`} className="hover:underline">
                              {email}
                            </a>
                          </li>
                        ))}
                        {(order.transport?.ccEmails ?? []).map((copyEmail) => (
                          <li key={copyEmail} className="text-xs font-medium">
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
                    <div>
                      <div className="mb-1.5 text-sm font-medium">Observaciones</div>
                      <div className="text-muted-foreground text-sm">
                        {order.transportationNotes ?? '—'}
                      </div>
                    </div>
                    <div>
                      <div className="mb-2 text-sm font-medium">Matrículas</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex h-[32px] w-full items-center overflow-hidden rounded border border-black bg-blue-700 shadow-md dark:border-white">
                          <div className="flex h-full items-center justify-center px-1 text-white">
                            <div className="flex flex-col items-center gap-0.5 text-xs leading-none">
                              <Image
                                src="/images/transports/eu-stars.svg"
                                width={13}
                                height={13}
                                alt="Spain Flag"
                              />
                              <span className="text-xs font-medium">EU</span>
                            </div>
                          </div>
                          <div className="flex h-full flex-1 items-center justify-center bg-white py-0.5 text-center font-['OCR_A_Std',monospace] text-base font-semibold text-black lining-nums">
                            {order.truckPlate ? (
                              order.truckPlate
                            ) : (
                              <span className="animate-pulse">0000 AAA</span>
                            )}
                          </div>
                        </div>
                        <div className="flex h-[32px] w-full items-center overflow-hidden rounded border-2 border-red-800 bg-red-600 shadow-md">
                          <div className="flex h-full flex-1 items-center justify-center py-0.5 text-center font-['OCR_A_Std',monospace] text-base font-semibold text-white lining-nums">
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
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </ScrollArea>
      </div>
    );
  }

  const hasAuxiliarySubtotal = !!order.auxiliarySubtotal;
  const hasAuxiliaryTotal = !!order.auxiliaryTotal;
  const hasTransportContacts =
    (order.transport?.emails?.length ?? 0) > 0 || (order.transport?.ccEmails?.length ?? 0) > 0;
  const hasTransportData = !!order.transport?.name || hasTransportContacts;

  return (
    <div className="columns-1 gap-4 sm:columns-2 xl:columns-3">
      {/* Mapa */}
      <Card className="mb-4 break-inside-avoid overflow-hidden py-0">
        <CardContent className="grid p-0">
          <div className="map-container">
            <ProspectLocationMap
              address={order?.shippingAddress ?? ''}
              companyName={(order?.customer as { name?: string } | undefined)?.name}
              minHeightClassName="min-h-[270px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Comercial */}
      <MasonryCard title="Comercial" description="Vendedor, pago, incoterm y maquilador">
        <InfoRow label="Vendedor" value={order.salesperson?.name ?? '—'} />
        {order.fieldOperator && (
          <InfoRow label="Repartidor" value={order.fieldOperator.name ?? '—'} />
        )}
        <InfoRow
          label="Forma de pago"
          value={order.paymentTerm?.name ?? '—'}
          valueClassName="w-24"
        />
        {order.incoterm && (
          <InfoRow
            label="Incoterm"
            value={`${order.incoterm.code} - ${order.incoterm.description}`}
          />
        )}
        {order.externalProcessor && (
          <InfoRow label="Maquilador" value={order.externalProcessor.name ?? '—'} />
        )}
      </MasonryCard>

      {/* Rentabilidad — dato restringido por rol */}
      {canViewCostData && (
        <MasonryCard title="Rentabilidad" description="Coste y margen calculados del pedido">
          <InfoRow
            label="Coste total"
            value={getNullableCurrency(order.totalCost)}
            sub={order.totalCost == null ? 'Sin coste' : getNullableCurrencyPerKg(order.costPerKg)}
          />
          <InfoRow
            label="Margen bruto"
            value={getNullableCurrency(order.grossMargin)}
            sub={getNullableCurrencyPerKg(order.marginPerKg)}
          />
          <InfoRow label="Margen %" value={getNullablePercentage(order.marginPercentage)} />
        </MasonryCard>
      )}

      {/* Resumen del pedido */}
      <MasonryCard title="Resumen" description="Peso, envasado e importe totales">
        <InfoRow
          label="Total productos"
          value={order.totalNetWeight ? formatDecimalWeight(order.totalNetWeight) : '—'}
        />
        <InfoRow
          label="Unidades de envasado"
          value={
            order.totalBoxes
              ? `${formatInteger(order.totalBoxes)} cajas (${order.numberOfPallets} palets)`
              : '—'
          }
        />
        <InfoRow
          label="Importe"
          value={getNullableCurrency(order.totalAmount)}
          sub={getNullableCurrencyPerKg(order.revenuePerKg)}
        />
        {hasAuxiliarySubtotal && (
          <InfoRow
            label="Otros artículos (subtotal)"
            value={getNullableCurrency(order.auxiliarySubtotal)}
          />
        )}
        {hasAuxiliaryTotal && (
          <InfoRow
            label="Otros artículos (total)"
            value={getNullableCurrency(order.auxiliaryTotal)}
          />
        )}
        <InfoRow
          label="Facturado"
          value={
            <Badge
              className={cn(
                order.invoiced
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
              )}
            >
              {order.invoiced ? 'Facturado' : 'Sin facturar'}
            </Badge>
          }
        />
      </MasonryCard>

      {/* Detalle del maquilador */}
      {order.externalProcessor && (
        <MasonryCard title="Detalle del maquilador" description="Datos fiscales y de contacto">
          <InfoRow label="Nombre" value={order.externalProcessor.name ?? '—'} />
          {order.externalProcessor.vatNumber && (
            <InfoRow label="CIF" value={order.externalProcessor.vatNumber} />
          )}
          {order.externalProcessor.sanitaryRegistrationNumber && (
            <InfoRow
              label="Registro sanitario"
              value={order.externalProcessor.sanitaryRegistrationNumber}
            />
          )}
          {order.externalProcessor.contactPerson && (
            <InfoRow
              label="Contacto"
              value={order.externalProcessor.contactPerson}
              sub={order.externalProcessor.phone}
            />
          )}
          <InfoRow
            label="Destino en sus docs"
            value={
              order.maquiladorDestination ?? (
                <span className="text-muted-foreground font-normal italic">No configurado</span>
              )
            }
          />
          <InfoRow
            label="Lugar de carga"
            value={
              order.loadingAddress ?? (
                <span className="text-muted-foreground font-normal italic">No configurado</span>
              )
            }
          />
        </MasonryCard>
      )}

      {/* Dirección de entrega */}
      {order.shippingAddress && (
        <MasonryCard title="Dirección de entrega" description="Destino de la mercancía">
          <p className="py-2 text-sm font-medium whitespace-pre-line first:pt-0 last:pb-0">
            {order.shippingAddress}
          </p>
        </MasonryCard>
      )}

      {/* Transporte */}
      {hasTransportData && (
        <MasonryCard title="Transporte" description="Transportista y contacto asignado">
          <p className="py-2 text-sm font-medium first:pt-0 last:pb-0">
            {order.transport?.name ?? '—'}
          </p>
          {hasTransportContacts && (
            <ul className="flex list-none flex-col gap-1 py-2 last:pb-0">
              {(order.transport?.emails ?? []).map((email) => (
                <li key={email} className="text-xs font-medium">
                  <a href={`mailto:${email}`} className="hover:underline">
                    {email}
                  </a>
                </li>
              ))}
              {(order.transport?.ccEmails ?? []).map((copyEmail) => (
                <li key={copyEmail} className="flex items-center gap-1 text-xs font-medium">
                  <Badge variant="outline" className="px-1">
                    CC
                  </Badge>
                  <a href={`mailto:${copyEmail}`} className="hover:underline">
                    {copyEmail}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </MasonryCard>
      )}

      {/* Observaciones de transporte */}
      {order.transportationNotes && (
        <MasonryCard title="Observaciones">
          <p className="text-muted-foreground py-2 text-sm whitespace-pre-line first:pt-0 last:pb-0">
            {order.transportationNotes}
          </p>
        </MasonryCard>
      )}

      {/* Matrículas */}
      <MasonryCard title="Matrículas" description="Cabeza tractora y remolque">
        <div className="grid grid-cols-2 gap-2 py-2 first:pt-0 last:pb-0">
          <div className="flex h-[32px] w-full items-center overflow-hidden rounded border border-black bg-blue-700 shadow-md dark:border-white">
            <div className="flex h-full items-center justify-center px-1 text-white">
              <div className="flex flex-col items-center gap-0.5 text-xs leading-none">
                <Image
                  src="/images/transports/eu-stars.svg"
                  width={13}
                  height={13}
                  alt="Spain Flag"
                />
                <span className="text-xs font-medium">EU</span>
              </div>
            </div>
            <div className="flex h-full flex-1 items-center justify-center bg-white py-0.5 text-center font-['OCR_A_Std',monospace] text-base font-semibold text-black lining-nums">
              {order.truckPlate ? (
                order.truckPlate
              ) : (
                <span className="animate-pulse">0000 AAA</span>
              )}
            </div>
          </div>
          <div className="flex h-[32px] w-full items-center overflow-hidden rounded border-2 border-red-800 bg-red-600 shadow-md">
            <div className="flex h-full flex-1 items-center justify-center py-0.5 text-center font-['OCR_A_Std',monospace] text-base font-semibold text-white lining-nums">
              {order.trailerPlate ? (
                order.trailerPlate
              ) : (
                <span className="animate-pulse">R-0000 AAA</span>
              )}
            </div>
          </div>
        </div>
      </MasonryCard>
    </div>
  );
};

export default OrderDetails;
