'use client';

import { Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatInteger } from '@/helpers/formats/numbers/formatNumbers';
import { SECTIONS_CONFIG, type OrderSectionConfig } from '../config/sectionsConfig';
import type { Order, OrderStatus } from '@/services/orderService';

interface OrderSectionGridProps {
  order: Order;
  onSelectSection: (sectionId: string) => void;
  onPrint: () => void;
  hasSafeAreaPadding: boolean;
  blockedTabIds?: string[];
  productDetailsCount: number;
  pendingProductionCount: number;
}

interface GridCard {
  id: string;
  icon: OrderSectionConfig['icon'];
  label: string;
  sublabel?: string;
  variant?: 'destructive' | 'attention';
  fullWidth?: boolean;
  actionOnly?: boolean;
}

function getDynamicSublabel(
  id: string,
  { order, productDetailsCount, pendingProductionCount }: Pick<
    OrderSectionGridProps,
    'order' | 'productDetailsCount' | 'pendingProductionCount'
  >
): string | undefined {
  switch (id) {
    case 'productDetails':
      return `${productDetailsCount} línea${productDetailsCount === 1 ? '' : 's'}`;
    case 'production':
      return pendingProductionCount > 0
        ? `${pendingProductionCount} pendiente${pendingProductionCount === 1 ? '' : 's'}`
        : 'Completo';
    case 'pallets':
      return order.numberOfPallets ? `${formatInteger(order.numberOfPallets)} palets` : 'Sin palets';
    case 'incident':
      return (order.status as OrderStatus) === 'incident' ? 'Incidencia activa' : 'Sin incidencias';
    default:
      return undefined;
  }
}

/**
 * Grid de acciones/secciones móvil (patrón HubScreen del editor de palet).
 * La jerarquía la marca el orden (secciones de uso frecuente primero, vía
 * mobileTier en sectionsConfig) — no el tamaño de la card. El tinte "attention"
 * (igual que el primary del Hub de palets) se reserva para estados que
 * requieren acción real, no para marcar frecuencia de uso de forma estática.
 */
export default function OrderSectionGrid({
  order,
  onSelectSection,
  onPrint,
  hasSafeAreaPadding,
  blockedTabIds = [],
  productDetailsCount,
  pendingProductionCount,
}: OrderSectionGridProps) {
  const visibleSections = SECTIONS_CONFIG.filter((s) => !blockedTabIds.includes(s.id));
  const isIncidentActive = (order.status as OrderStatus) === 'incident';

  const cards: GridCard[] = [];

  const incidentSection = visibleSections.find((s) => s.id === 'incident');
  if (incidentSection && isIncidentActive) {
    cards.push({
      id: incidentSection.id,
      icon: incidentSection.icon,
      label: incidentSection.title,
      sublabel: 'Incidencia activa',
      variant: 'destructive',
      fullWidth: true,
    });
  }

  const rest = visibleSections.filter((s) => s.id !== 'incident');
  const tier1 = rest.filter((s) => s.mobileTier === 1);
  const tier2 = rest.filter((s) => s.mobileTier !== 1);

  for (const section of [...tier1, ...tier2]) {
    const isAttention = section.id === 'production' && pendingProductionCount > 0;
    cards.push({
      id: section.id,
      icon: section.icon,
      label: section.title,
      sublabel:
        getDynamicSublabel(section.id, { order, productDetailsCount, pendingProductionCount }) ??
        section.mobileDefaultSublabel,
      variant: isAttention ? 'attention' : undefined,
    });
  }

  cards.push({
    id: 'print',
    icon: Printer,
    label: 'Imprimir',
    sublabel: 'Hoja de pedido',
    actionOnly: true,
  });

  const handleCardClick = (card: GridCard) => {
    if (card.actionOnly) {
      onPrint();
    } else {
      onSelectSection(card.id);
    }
  };

  return (
    <div
      className={cn('grid grid-cols-2 gap-3 px-4 pt-6', hasSafeAreaPadding ? 'pb-8' : 'pb-2')}
      style={
        hasSafeAreaPadding
          ? { paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }
          : undefined
      }
    >
      {cards.map((card) => (
        <button
          key={card.id}
          type="button"
          onClick={() => handleCardClick(card)}
          className={cn(
            'relative flex min-h-[104px] flex-col items-start justify-between rounded-2xl border p-4 text-left transition-all active:scale-[0.97]',
            card.fullWidth && 'col-span-2',
            card.variant === 'destructive' && 'border-destructive/25 bg-destructive/5 hover:bg-destructive/10',
            card.variant === 'attention' &&
              'border-primary/40 bg-primary/8 shadow-sm shadow-primary/10 ring-1 ring-primary/20 ring-inset hover:bg-primary/12',
            !card.variant && 'border-border bg-card hover:bg-accent/50'
          )}
        >
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-xl',
              card.variant === 'destructive' && 'bg-destructive/10 text-destructive',
              card.variant === 'attention' && 'bg-primary/15 text-primary',
              !card.variant && 'bg-muted text-foreground'
            )}
          >
            <card.icon className="h-5 w-5" />
          </div>

          <div className="mt-3 space-y-0.5">
            <p
              className={cn(
                'text-sm font-semibold leading-tight',
                card.variant === 'destructive' && 'text-destructive',
                card.variant === 'attention' && 'text-primary'
              )}
            >
              {card.label}
            </p>
            {card.sublabel && (
              <p className="line-clamp-1 text-xs text-muted-foreground">{card.sublabel}</p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
