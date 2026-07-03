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
  tier: 1 | 2;
  variant?: 'destructive';
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
 * Grid de acciones/secciones móvil (patrón HubScreen del editor de palet):
 * cards grandes con icono + título + sublabel, jerarquía por frecuencia de uso.
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
      tier: 2,
      variant: 'destructive',
      fullWidth: true,
    });
  }

  const rest = visibleSections.filter((s) => s.id !== 'incident');
  const tier1 = rest.filter((s) => s.mobileTier === 1);
  const tier2 = rest.filter((s) => s.mobileTier !== 1);

  for (const section of [...tier1, ...tier2]) {
    cards.push({
      id: section.id,
      icon: section.icon,
      label: section.title,
      sublabel:
        getDynamicSublabel(section.id, { order, productDetailsCount, pendingProductionCount }) ??
        section.mobileDefaultSublabel,
      tier: section.mobileTier === 1 ? 1 : 2,
    });
  }

  cards.push({
    id: 'print',
    icon: Printer,
    label: 'Imprimir',
    sublabel: 'Hoja de pedido',
    tier: 2,
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
    <div className="relative min-h-0 w-full flex-1 overflow-hidden">
      <div
        className={cn(
          'h-full overflow-y-auto px-4 pt-6',
          hasSafeAreaPadding ? 'pb-8' : 'pb-2'
        )}
        style={hasSafeAreaPadding ? { paddingBottom: 'env(safe-area-inset-bottom)' } : {}}
      >
        <div className="grid grid-cols-2 gap-3">
          {cards.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => handleCardClick(card)}
              className={cn(
                'relative flex flex-col items-start justify-between rounded-2xl border p-4 text-left transition-all active:scale-[0.97]',
                card.fullWidth && 'col-span-2',
                card.variant === 'destructive'
                  ? 'min-h-[96px] border-destructive/25 bg-destructive/5 hover:bg-destructive/10'
                  : card.tier === 1
                    ? 'min-h-[124px] border-border bg-card shadow-sm hover:bg-accent/50'
                    : 'min-h-[104px] border-border bg-card hover:bg-accent/50'
              )}
            >
              <div
                className={cn(
                  'flex items-center justify-center rounded-xl',
                  card.variant === 'destructive'
                    ? 'h-10 w-10 bg-destructive/10 text-destructive'
                    : card.tier === 1
                      ? 'h-11 w-11 bg-muted text-foreground'
                      : 'h-9 w-9 bg-muted text-foreground'
                )}
              >
                <card.icon className={cn(card.tier === 1 ? 'h-5.5 w-5.5' : 'h-5 w-5')} />
              </div>

              <div className="mt-3 space-y-0.5">
                <p
                  className={cn(
                    'text-sm font-semibold leading-tight',
                    card.variant === 'destructive' && 'text-destructive'
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
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}
