'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ChevronDown, Pencil, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MobileOptionSheet } from '@/components/Shadcn/MobileOptionSheet';
import { cn } from '@/lib/utils';
import StatusBadge from '../../StatusBadge';
import type { Order, OrderStatus } from '@/services/orderService';

const STATUS_COLORS: Record<OrderStatus, 'orange' | 'green' | 'red'> = {
  pending: 'orange',
  finished: 'green',
  incident: 'red',
};
const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'En producción',
  finished: 'Terminado',
  incident: 'Incidencia',
};
const STATUS_OPTIONS: OrderStatus[] = ['pending', 'finished', 'incident'];

// Fondo del bloque hero, tintado con el color de estado — misma opacidad que StatusBadge (15%)
const STATUS_HERO_BG: Record<OrderStatus, string> = {
  pending: 'bg-orange-500/15',
  finished: 'bg-green-500/15',
  incident: 'bg-red-500/15',
};

interface OrderHeaderMobileProps {
  order: Order;
  transportImage: string;
  onClose?: () => void;
  onEdit: () => void;
  onStatusChange: (status: OrderStatus) => void;
  readOnly?: boolean;
}

/**
 * Bloque hero móvil: barra de navegación (back + título + editar) + identidad del pedido
 * (cliente + estado + transporte), sobre un fondo tintado con el color del estado. Borde
 * inferior ovalado (elipse ancha vía border-radius de dos ejes) — edge-to-edge, sin margen
 * lateral ni superior.
 * Solo se muestra cuando existe onClose (contexto sheet/drawer).
 */
export default function OrderHeaderMobile({
  order,
  transportImage,
  onClose,
  onEdit,
  onStatusChange,
  readOnly = false,
}: OrderHeaderMobileProps) {
  const [statusSheetOpen, setStatusSheetOpen] = useState(false);

  if (!onClose) return null;

  const status = order.status as OrderStatus;
  const customer = order.customer as { id?: number | string; name?: string } | undefined;
  const transport = order.transport as { name?: string } | undefined;

  return (
    <div
      className={cn(
        'relative flex-shrink-0 overflow-hidden rounded-bl-[50%_40px] rounded-br-[50%_40px] pt-8 pb-12',
        STATUS_HERO_BG[status]
      )}
    >
      <div className="relative flex items-center justify-center px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="hover:bg-background/60 absolute left-4 h-12 min-h-[44px] w-12 min-w-[44px] rounded-full"
          aria-label="Volver"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div className="flex flex-col items-center gap-1">
          <h2 className="text-center text-xl font-normal">#{order.id}</h2>
          {(order?.orderType ?? order?.order_type) === 'autoventa' && (
            <span
              className="border-border bg-background/60 text-muted-foreground inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium"
              aria-label="Tipo de pedido: Autoventa"
            >
              <ShoppingBag className="h-3 w-3" aria-hidden />
              Autoventa
            </span>
          )}
          {order?.offerId ? (
            <Link
              href={`/comercial/ofertas/${order.offerId}`}
              className="text-primary text-xs hover:underline"
            >
              Ver oferta #{order.offerId as string | number}
            </Link>
          ) : null}
        </div>
        {!readOnly ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="hover:bg-background/60 absolute right-4 h-12 min-h-[44px] w-12 min-w-[44px] rounded-full"
            aria-label="Editar pedido"
          >
            <Pencil className="h-6 w-6" />
          </Button>
        ) : (
          <div className="absolute right-4 h-12 w-12" aria-hidden="true" />
        )}
      </div>

      <div className="mt-5 flex flex-col items-center gap-2 px-4 text-center">
        <div>
          <p className="text-xl font-medium">{customer?.name ?? '—'}</p>
          <p className="text-muted-foreground mt-1 text-base">Cliente Nº {customer?.id ?? '—'}</p>
          {order?.buyerReference ? (
            <p className="text-muted-foreground mt-1 text-sm">
              Ref. cliente: {order.buyerReference as string}
            </p>
          ) : null}
        </div>

        <div className="flex justify-center">
          {readOnly ? (
            <StatusBadge color={STATUS_COLORS[status]} label={STATUS_LABELS[status]} />
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStatusSheetOpen(true)}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-1 focus:outline-none"
              >
                <StatusBadge color={STATUS_COLORS[status]} label={STATUS_LABELS[status]} />
                <ChevronDown className="text-muted-foreground h-3.5 w-3.5" aria-hidden />
              </button>
              <MobileOptionSheet
                open={statusSheetOpen}
                onOpenChange={setStatusSheetOpen}
                title="Estado del pedido"
                value={status}
                onSelect={onStatusChange}
                options={STATUS_OPTIONS.map((option) => ({
                  value: option,
                  label: (
                    <StatusBadge color={STATUS_COLORS[option]} label={STATUS_LABELS[option]} />
                  ),
                }))}
              />
            </>
          )}
        </div>

        <div className="mt-3 flex flex-col items-center justify-center gap-2">
          <Image
            className="h-auto max-w-[170px]"
            src={transportImage}
            width={170}
            height={96}
            alt={`Transporte ${transport?.name || ''}`}
          />
          <p className="text-lg font-medium">{transport?.name || '-'}</p>
        </div>
      </div>
    </div>
  );
}
