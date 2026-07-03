'use client';

import Link from 'next/link';
import { ArrowLeft, Pencil, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Order } from '@/services/orderService';

interface OrderHeaderMobileProps {
  order: Order;
  onClose?: () => void;
  onEdit: () => void;
  readOnly?: boolean;
}

/**
 * Header móvil: botón back + título (#orderId) + botón Editar.
 * Solo se muestra cuando existe onClose (contexto sheet/drawer).
 * El resto de acciones (secciones, imprimir) viven en la grid de acciones (OrderSectionGrid).
 */
export default function OrderHeaderMobile({
  order,
  onClose,
  onEdit,
  readOnly = false,
}: OrderHeaderMobileProps) {
  if (!onClose) return null;

  return (
    <div className="bg-background flex-shrink-0 px-0 pt-8 pb-3">
      <div className="relative flex items-center justify-center px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="hover:bg-muted absolute left-4 h-12 min-h-[44px] w-12 min-w-[44px] rounded-full"
          aria-label="Volver"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div className="flex flex-col items-center gap-1">
          <h2 className="text-center text-xl font-normal">#{order.id}</h2>
          {(order?.orderType ?? order?.order_type) === 'autoventa' && (
            <span
              className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
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
            className="hover:bg-muted absolute right-4 h-12 min-h-[44px] w-12 min-w-[44px] rounded-full"
            aria-label="Editar pedido"
          >
            <Pencil className="h-6 w-6" />
          </Button>
        ) : (
          <div className="absolute right-4 h-12 w-12" aria-hidden="true" />
        )}
      </div>
    </div>
  );
}
