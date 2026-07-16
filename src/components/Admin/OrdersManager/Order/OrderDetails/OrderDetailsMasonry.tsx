'use client';

import React from 'react';
import {
  Banknote,
  Car,
  Factory,
  MapPinned,
  MessageSquareText,
  Package,
  ScrollText,
  Ship,
  TrendingUp,
  Truck,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
 * en vez de la grid fija de 2/3 columnas del componente original. Tab momentánea
 * de comparación (GAP pendiente): no sustituye a OrderDetails/index.tsx.
 */

const getNullableCurrency = (value: number | null | undefined) =>
  value == null ? '—' : formatDecimalCurrency(value);
const getNullablePercentage = (value: number | null | undefined) =>
  value == null ? '—' : `${formatDecimal(value)}%`;
const getNullableCurrencyPerKg = (value: number | null | undefined) =>
  value == null ? '—' : `${formatDecimal(value)} €/kg`;

interface MasonryCardProps {
  icon: LucideIcon;
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

function MasonryCard({
  icon: Icon,
  title,
  badge,
  children,
  className,
  contentClassName,
}: MasonryCardProps) {
  return (
    <Card className={`mb-4 break-inside-avoid ${className ?? ''}`}>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-lg font-medium">
          <div className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-lg">
            <Icon className="text-muted-foreground size-4" />
          </div>
          {title}
        </CardTitle>
        {badge}
      </CardHeader>
      <CardContent className={`grid gap-3 ${contentClassName ?? ''}`}>{children}</CardContent>
    </Card>
  );
}

interface InfoRowProps {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
}

function InfoRow({ icon: Icon, label, value, hint }: InfoRowProps) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="text-muted-foreground text-xs">{label}</div>
        <div className="truncate text-sm font-medium">{value}</div>
        {hint && <div className="text-muted-foreground mt-0.5 text-xs">{hint}</div>}
      </div>
    </div>
  );
}

interface StatTileProps {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
}

function StatTile({ label, value, sub }: StatTileProps) {
  return (
    <div className="bg-muted/40 rounded-lg border p-3">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="mt-1 text-base font-semibold tabular-nums">{value}</div>
      {sub && <div className="text-muted-foreground mt-0.5 text-xs">{sub}</div>}
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
      {/* Vendedor y repartidor */}
      <MasonryCard icon={UserRound} title="Vendedor y reparto">
        <InfoRow icon={UserRound} label="Vendedor" value={order.salesperson?.name ?? '—'} />
        <Separator />
        <InfoRow
          icon={Truck}
          label="Repartidor"
          value={order.fieldOperator?.name ?? 'Sin repartidor'}
        />
      </MasonryCard>

      {/* Condiciones comerciales */}
      <MasonryCard icon={Banknote} title="Condiciones comerciales">
        <InfoRow icon={Banknote} label="Forma de pago" value={order.paymentTerm?.name ?? '—'} />
        <Separator />
        <InfoRow
          icon={Ship}
          label="Incoterm"
          value={
            order.incoterm ? (
              <span className="flex items-center gap-2">
                <Badge variant="outline">{order.incoterm.code}</Badge>
                <span className="text-muted-foreground truncate text-xs font-normal">
                  {order.incoterm.description}
                </span>
              </span>
            ) : (
              '—'
            )
          }
        />
      </MasonryCard>

      {/* Maquilador */}
      {order.externalProcessor && (
        <MasonryCard icon={Factory} title="Maquilador">
          <InfoRow
            icon={Factory}
            label="Nombre"
            value={order.externalProcessor.name}
            hint={order.externalProcessor.vatNumber}
          />
          {order.externalProcessor.sanitaryRegistrationNumber && (
            <InfoRow
              icon={ScrollText}
              label="Registro sanitario"
              value={order.externalProcessor.sanitaryRegistrationNumber}
            />
          )}
          {order.externalProcessor.contactPerson && (
            <InfoRow
              icon={UserRound}
              label="Contacto"
              value={order.externalProcessor.contactPerson}
              hint={order.externalProcessor.phone}
            />
          )}
          <Separator />
          <InfoRow
            icon={MapPinned}
            label="Destino en sus docs"
            value={
              order.maquiladorDestination ?? (
                <span className="text-muted-foreground text-xs font-normal italic">
                  No configurado
                </span>
              )
            }
          />
          <InfoRow
            icon={MapPinned}
            label="Lugar de carga"
            value={
              order.loadingAddress ?? (
                <span className="text-muted-foreground text-xs font-normal italic">
                  No configurado
                </span>
              )
            }
          />
        </MasonryCard>
      )}

      {/* Rentabilidad — dato restringido por rol */}
      {canViewCostData && (
        <MasonryCard
          icon={TrendingUp}
          title="Rentabilidad"
          badge={
            <Badge variant="outline" className="text-muted-foreground">
              Solo tu rol
            </Badge>
          }
          contentClassName="grid-cols-2"
        >
          <StatTile
            label="Coste total"
            value={getNullableCurrency(order.totalCost)}
            sub={
              order.totalCost == null
                ? 'Sin coste calculable'
                : getNullableCurrencyPerKg(order.costPerKg)
            }
          />
          <StatTile
            label="Margen bruto"
            value={getNullableCurrency(order.grossMargin)}
            sub={getNullableCurrencyPerKg(order.marginPerKg)}
          />
          <StatTile label="Margen %" value={getNullablePercentage(order.marginPercentage)} />
        </MasonryCard>
      )}

      {/* Resumen del pedido */}
      <MasonryCard icon={Package} title="Resumen del pedido" contentClassName="grid-cols-2">
        <StatTile
          label="Total producto"
          value={order.totalNetWeight ? formatDecimalWeight(order.totalNetWeight) : '—'}
        />
        <StatTile
          label="Envasado"
          value={order.totalBoxes ? `${formatInteger(order.totalBoxes)} cajas` : '—'}
          sub={order.totalBoxes ? `${order.numberOfPallets} palets` : undefined}
        />
        <StatTile
          label="Importe"
          value={getNullableCurrency(order.totalAmount)}
          sub={getNullableCurrencyPerKg(order.revenuePerKg)}
        />
        <StatTile
          label="Otros artículos"
          value={getNullableCurrency(order.auxiliaryTotal)}
          sub={
            order.auxiliarySubtotal != null
              ? `Subtotal ${getNullableCurrency(order.auxiliarySubtotal)}`
              : undefined
          }
        />
      </MasonryCard>

      {/* Dirección y transporte */}
      <MasonryCard icon={MapPinned} title="Dirección de entrega">
        <p className="text-sm font-medium whitespace-pre-line">{order.shippingAddress ?? '—'}</p>
        <Separator />
        <InfoRow icon={Truck} label="Transporte" value={order.transport?.name ?? '—'} />
        {((order.transport?.emails?.length ?? 0) > 0 ||
          (order.transport?.ccEmails?.length ?? 0) > 0) && (
          <ul className="ml-7 flex list-none flex-col gap-1">
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
        <MasonryCard icon={MessageSquareText} title="Observaciones">
          <p className="text-muted-foreground text-sm whitespace-pre-line">
            {order.transportationNotes}
          </p>
        </MasonryCard>
      )}

      {/* Matrículas */}
      <MasonryCard icon={Car} title="Matrículas">
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
      </MasonryCard>

      {/* Mapa */}
      <Card className="mb-4 break-inside-avoid overflow-hidden">
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
