'use client';

import Link from 'next/link';
import { ArrowLeft, MoreVertical, Printer, Pencil, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { SECTIONS_CONFIG, PRIMARY_SECTION_IDS_MOBILE } from '../config/sectionsConfig';
import { getBlockedOrderSectionsForReadOnly } from '@/lib/orders/orderReadOnlyPermissions';
import type { Order } from '@/services/orderService';

interface OrderHeaderMobileProps {
  order: Order;
  onClose?: () => void;
  onNavigateSection: (sectionId: string) => void;
  onEdit: () => void;
  onPrint: () => void;
  readOnly?: boolean;
}

/**
 * Header móvil: botón back + título (#orderId) + menú ⋮ (secciones overflow, Editar, Imprimir)
 * Solo se muestra cuando existe onClose (contexto sheet/drawer)
 */
export default function OrderHeaderMobile({
  order,
  onClose,
  onNavigateSection,
  onEdit,
  onPrint,
  readOnly = false,
}: OrderHeaderMobileProps) {
  if (!onClose) return null;

  const commercialInProgressBlockedTabIds = getBlockedOrderSectionsForReadOnly({
    readOnly,
    status: order?.status as string | undefined,
  });

  const overflowSections = SECTIONS_CONFIG.filter(
    (s) => !PRIMARY_SECTION_IDS_MOBILE.includes(s.id)
  );
  const visibleOverflowSections = overflowSections.filter(
    (s) => !commercialInProgressBlockedTabIds.includes(s.id)
  );

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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-muted absolute right-4 h-12 min-h-[44px] w-12 min-w-[44px] rounded-full"
              aria-label="Más opciones"
            >
              <MoreVertical className="h-6 w-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {visibleOverflowSections.map((section) => {
              const Icon = section.icon;
              return (
                <DropdownMenuItem key={section.id} onClick={() => onNavigateSection(section.id)}>
                  <Icon className="mr-2 h-4 w-4" />
                  {section.title}
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            {!readOnly && (
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar pedido
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onPrint}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
