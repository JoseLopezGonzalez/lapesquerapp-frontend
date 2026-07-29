'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Pencil, ShoppingBag, Ship } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

// Fondo del bloque hero: mismo tono que StatusBadge (orange/green/red-500), a saturación
// completa — el badge se queda con su tinte suave (15%), aquí buscamos presencia real.
const STATUS_HERO_BG: Record<OrderStatus, string> = {
  pending: 'bg-orange-500',
  finished: 'bg-green-500',
  incident: 'bg-red-500',
};

interface OrderHeaderMobileProps {
  order: Order;
  transportImage: string;
  onClose?: () => void;
  onEdit: () => void;
  readOnly?: boolean;
}

/**
 * Bloque hero móvil: barra de navegación (back + título + editar) + identidad del pedido
 * (cliente + estado + transporte), sobre un fondo sólido tintado con el color del estado.
 * Borde inferior ovalado (elipse ancha vía border-radius de dos ejes) — edge-to-edge, sin
 * margen lateral ni superior. Fondo sólido → todo el texto encima usa blanco/blanco-translúcido
 * en vez de los tokens muted-foreground/foreground (que asumen fondo neutro del tema).
 *
 * La visibilidad del transporte depende del scroll del overview móvil. Se anima con CSS
 * por estado para evitar recalcular height en cada frame de scroll en dispositivos móviles.
 *
 * Solo se muestra cuando existe onClose (contexto sheet/drawer).
 */
export default function OrderHeaderMobile({
  order,
  transportImage,
  onClose,
  onEdit,
  readOnly = false,
}: OrderHeaderMobileProps) {
  if (!onClose) return null;

  const status = order.status as OrderStatus;
  const customer = order.customer as { id?: number | string; name?: string } | undefined;
  const transport = order.transport as { name?: string } | undefined;

  return (
    <div className="order-mobile-hero relative isolate flex-shrink-0 overflow-hidden pt-8 pb-12">
      <div
        className={cn(
          'order-mobile-hero-bg pointer-events-none absolute inset-0 z-0 rounded-br-[50%_40px] rounded-bl-[50%_40px]',
          STATUS_HERO_BG[status]
        )}
        aria-hidden="true"
      />
      <div className="relative z-10 flex items-center justify-center px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute left-4 h-12 min-h-[44px] w-12 min-w-[44px] rounded-full text-white hover:bg-white/15 hover:text-white"
          aria-label="Volver"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div className="flex flex-col items-center gap-1">
          <h2 className="text-center text-xl font-normal text-white">#{order.id}</h2>
          {(order?.orderType ?? order?.order_type) === 'autoventa' && (
            <span
              className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/15 px-2 py-0.5 text-[10px] font-medium text-white"
              aria-label="Tipo de pedido: Autoventa"
            >
              <ShoppingBag className="h-3 w-3" aria-hidden />
              Autoventa
            </span>
          )}
          {(order?.orderType ?? order?.order_type) === 'maritime_export' && (
            <span
              className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/15 px-2 py-0.5 text-[10px] font-medium text-white"
              aria-label="Tipo de pedido: Exportación marítima"
            >
              <Ship className="h-3 w-3" aria-hidden />
              Marítimo
            </span>
          )}
          {order?.offerId ? (
            <Link
              href={`/comercial/ofertas/${order.offerId}`}
              className="text-xs text-white underline decoration-white/50 hover:decoration-white"
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
            className="absolute right-4 h-12 min-h-[44px] w-12 min-w-[44px] rounded-full text-white hover:bg-white/15 hover:text-white"
            aria-label="Editar pedido"
          >
            <Pencil className="h-6 w-6" />
          </Button>
        ) : (
          <div className="absolute right-4 h-12 w-12" aria-hidden="true" />
        )}
      </div>

      <div className="relative z-10 mt-5 flex flex-col items-center gap-2 px-4 text-center">
        <div>
          <p className="text-xl font-medium text-white">{customer?.name ?? '—'}</p>
          <p className="mt-1 text-base text-white/80">Cliente Nº {customer?.id ?? '—'}</p>
          {order?.buyerReference ? (
            <p className="mt-1 text-sm text-white/80">
              Ref. cliente: {order.buyerReference as string}
            </p>
          ) : null}
        </div>

        <div className="order-mobile-transport overflow-hidden will-change-[opacity,transform]">
          <div className="mt-3 flex flex-col items-center justify-center gap-2">
            <Image
              className="h-auto max-w-[170px]"
              src={transportImage}
              width={170}
              height={96}
              alt={`Transporte ${transport?.name || ''}`}
            />
            <p className="text-lg font-medium text-white">{transport?.name || '-'}</p>
          </div>
        </div>
        <div className="order-mobile-status flex justify-center will-change-transform">
          <div className="inline-flex items-center justify-center rounded-full border border-white/35 bg-white/90 p-1 shadow-sm shadow-black/15 backdrop-blur-sm">
            <StatusBadge color={STATUS_COLORS[status]} label={STATUS_LABELS[status]} />
          </div>
        </div>
      </div>
    </div>
  );
}
