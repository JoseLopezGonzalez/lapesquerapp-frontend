'use client';

import { useState } from 'react';
import { ThermometerSnowflake, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { MobileOptionSheet } from '@/components/Shadcn/MobileOptionSheet';
import { formatDate } from '@/helpers/formats/dates/formatDates';
import { formatInteger, formatDecimalCurrency } from '@/helpers/formats/numbers/formatNumbers';
import type { Order } from '@/services/orderService';

const TEMPERATURE_OPTIONS = [0, 4, -18, -23];

interface OrderSummaryMobileProps {
  order: Order;
  transportImage: string;
  onTemperatureChange: (temperature: number) => void;
  readOnly?: boolean;
}

/**
 * Resumen secundario móvil: transporte, fecha de carga, temperatura, palets, importe.
 * Cliente y estado viven en el bloque hero de OrderHeaderMobile.
 */
export default function OrderSummaryMobile({
  order,
  transportImage,
  onTemperatureChange,
  readOnly = false,
}: OrderSummaryMobileProps) {
  const [temperatureSheetOpen, setTemperatureSheetOpen] = useState(false);

  const transport = order.transport as { name?: string } | undefined;
  const temperature = Number((order.temperature as number | string | undefined) ?? 0);

  return (
    <div className="flex-shrink-0 space-y-4 px-4 pt-5 text-center">
      <div className="flex flex-col items-center justify-center gap-2">
        <Image
          className="h-auto max-w-[170px]"
          src={transportImage}
          width={170}
          height={96}
          alt={`Transporte ${transport?.name || ''}`}
        />
        <p className="text-lg font-medium">{transport?.name || '-'}</p>
      </div>

      <div className="flex flex-wrap items-start justify-center gap-6">
        <div>
          <p className="text-muted-foreground mb-1 text-sm">Fecha de Carga</p>
          <p className="text-lg font-medium">{formatDate(order.loadDate)}</p>
        </div>
        <div>
          <p className="text-muted-foreground mb-1 text-sm">Temperatura</p>
          {readOnly ? (
            <span className="flex items-center justify-center gap-1.5 text-lg font-medium">
              <ThermometerSnowflake className="h-5 w-5" />
              {temperature} ºC
            </span>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setTemperatureSheetOpen(true)}
                className="flex min-h-[44px] min-w-[44px] items-start justify-center focus:outline-none"
              >
                <span className="hover:text-muted-foreground flex items-center justify-center gap-1.5 text-lg font-medium transition-colors">
                  <ThermometerSnowflake className="h-5 w-5" />
                  {temperature} ºC
                  <ChevronDown className="text-muted-foreground h-3.5 w-3.5" aria-hidden />
                </span>
              </button>
              <MobileOptionSheet
                open={temperatureSheetOpen}
                onOpenChange={setTemperatureSheetOpen}
                title="Temperatura del pedido"
                value={temperature}
                onSelect={onTemperatureChange}
                options={TEMPERATURE_OPTIONS.map((temp) => ({
                  value: temp,
                  label: `${temp} ºC`,
                }))}
              />
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-6">
        <div>
          <p className="text-muted-foreground mb-1 text-sm">Palets</p>
          <p className="text-lg font-medium">
            {order.numberOfPallets ? formatInteger(order.numberOfPallets) : '-'}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground mb-1 text-sm">Importe</p>
          <p className="text-lg font-medium">
            {order.totalAmount ? formatDecimalCurrency(order.totalAmount) : '-'}
          </p>
        </div>
      </div>
    </div>
  );
}
