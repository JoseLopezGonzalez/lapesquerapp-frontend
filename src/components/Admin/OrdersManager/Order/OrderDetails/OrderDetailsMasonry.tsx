'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useOrderContext } from '@/context/OrderContext';
import ProspectLocationMap from '@/components/Comercial/CRM/ProspectLocationMap';
import {
  formatInteger,
  formatDecimal,
  formatDecimalWeight,
  formatDecimalCurrency,
} from '@/helpers/formats/numbers/formatNumbers';
import Image from 'next/image';
import type { OrderDetailsData } from './index';

/**
 * Rediseño experimental de la pestaña "Información" — layout masonry (CSS columns)
 * + filas compactas clave/valor, en vez de la grid fija de 2/3 columnas del
 * componente original. Tab momentánea de comparación (GAP pendiente): no
 * sustituye a OrderDetails/index.tsx.
 *
 * Cabeceras de card alineadas al patrón nativo ya usado en OrderAuxiliaryLines/
 * OrderProduction: CardTitle (sub-escala text-lg, ver design-context.md §
 * Typography) + descripción muted debajo, sin iconos ni separadores forzados.
 */

const getNullableCurrency = (value: number | null | undefined) =>
  value == null ? '—' : formatDecimalCurrency(value);
const getNullablePercentage = (value: number | null | undefined) =>
  value == null ? '—' : `${formatDecimal(value)}%`;
const getNullableCurrencyPerKg = (value: number | null | undefined) =>
  value == null ? '—' : `${formatDecimal(value)} €/kg`;

interface MasonryCardProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

function MasonryCard({ title, description, action, children, className }: MasonryCardProps) {
  return (
    <Card className={cn('mb-4 break-inside-avoid', className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          {/* text-lg: sub-escala intencional para CardTitle de tarjeta dentro de un tab,
              un escalón por debajo de text-xl (título de página/sección). Ver design-context.md § Typography */}
          <CardTitle className="text-lg font-medium">{title}</CardTitle>
          {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
        </div>
        {action}
      </CardHeader>
      <CardContent className="divide-border/60 divide-y">{children}</CardContent>
    </Card>
  );
}

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
}

function InfoRow({ label, value, sub }: InfoRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2 first:pt-0 last:pb-0">
      <span className="text-muted-foreground shrink-0 text-sm">{label}</span>
      <span className="flex min-w-0 items-baseline gap-2 text-right">
        <span className="truncate text-sm font-semibold">{value}</span>
        {sub && <span className="text-muted-foreground shrink-0 text-xs">{sub}</span>}
      </span>
    </div>
  );
}

interface OrderDetailsMasonryProps {
  canViewCostData?: boolean;
}

const OrderDetailsMasonry = ({ canViewCostData = true }: OrderDetailsMasonryProps) => {
  const { order } = useOrderContext() as { order: OrderDetailsData };

  return (
    <div className="columns-1 gap-4 sm:columns-2 xl:columns-3">
      {/* Comercial */}
      <MasonryCard title="Comercial" description="Vendedor, pago, incoterm y maquilador">
        <InfoRow label="Vendedor" value={order.salesperson?.name ?? '—'} />
        <InfoRow label="Repartidor" value={order.fieldOperator?.name ?? 'Sin repartidor'} />
        <InfoRow label="Forma de pago" value={order.paymentTerm?.name ?? '—'} />
        <InfoRow
          label="Incoterm"
          value={order.incoterm ? `${order.incoterm.code} - ${order.incoterm.description}` : '—'}
        />
        <InfoRow label="Maquilador" value={order.externalProcessor?.name ?? 'Sin maquilador'} />
      </MasonryCard>

      {/* Rentabilidad — dato restringido por rol */}
      {canViewCostData && (
        <MasonryCard
          title="Rentabilidad"
          description="Coste y margen calculados del pedido"
          action={
            <Badge variant="outline" className="text-muted-foreground">
              Solo tu rol
            </Badge>
          }
        >
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
        <InfoRow
          label="Otros artículos (subtotal)"
          value={getNullableCurrency(order.auxiliarySubtotal)}
        />
        <InfoRow
          label="Otros artículos (total)"
          value={getNullableCurrency(order.auxiliaryTotal)}
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

      {/* Dirección y transporte */}
      <MasonryCard title="Dirección de entrega" description="Destino y transporte asignado">
        <p className="py-2 text-sm font-medium whitespace-pre-line first:pt-0">
          {order.shippingAddress ?? '—'}
        </p>
        <InfoRow label="Transporte" value={order.transport?.name ?? '—'} />
        {((order.transport?.emails?.length ?? 0) > 0 ||
          (order.transport?.ccEmails?.length ?? 0) > 0) && (
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
    </div>
  );
};

export default OrderDetailsMasonry;
