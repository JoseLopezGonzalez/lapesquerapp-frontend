'use client';

import {
  BarChart2,
  FileText,
  History,
  ImageIcon,
  Package,
  Plus,
  Scan,
  Scale,
  ShoppingCart,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { PalletState } from '@/hooks/pallets/palletHelpers';
import type { PalletScreen } from './types';

interface HubScreenProps {
  temporalPallet: PalletState;
  isNew: boolean;
  isReadOnly: boolean;
  externalActor: boolean;
  showHistorial: boolean;
  onNavigate: (screen: PalletScreen) => void;
  onOpenScanner: () => void;
}

interface HubCard {
  id: PalletScreen | 'scanner';
  icon: React.ElementType;
  label: string;
  sublabel?: string;
  variant?: 'primary' | 'destructive' | 'default';
  badge?: number;
  actionOnly?: boolean;
}

export default function HubScreen({
  temporalPallet,
  isNew,
  isReadOnly,
  externalActor,
  showHistorial,
  onNavigate,
  onOpenScanner,
}: HubScreenProps) {
  const boxes = temporalPallet.boxes ?? [];
  const totalWeight = boxes
    .reduce((sum, box) => sum + parseFloat(String(box.netWeight ?? 0)), 0)
    .toFixed(1);

  const hasTara =
    temporalPallet.palletTareWeightKg !== null &&
    temporalPallet.palletTareWeightKg !== undefined &&
    temporalPallet.palletTareWeightKg !== '';

  const obsPreview = temporalPallet.observations
    ? String(temporalPallet.observations).slice(0, 28) +
      (String(temporalPallet.observations).length > 28 ? '…' : '')
    : undefined;

  const orderLabel = temporalPallet.orderId ? `#${temporalPallet.orderId}` : undefined;

  const allCards: HubCard[] = [
    {
      id: 'scanner',
      icon: Scan,
      label: 'Escanear',
      sublabel: 'Añadir con cámara',
      variant: 'primary',
      actionOnly: true,
    },
    {
      id: 'add-manual',
      icon: Plus,
      label: 'Añadir manual',
      sublabel: 'Sin escáner',
      variant: 'default',
      actionOnly: true,
    },
    {
      id: 'cajas',
      icon: Package,
      label: 'Cajas',
      sublabel: boxes.length > 0 ? `${totalWeight} kg` : 'Sin cajas',
      badge: boxes.length > 0 ? boxes.length : undefined,
    },
    {
      id: 'resumen',
      icon: BarChart2,
      label: 'Resumen',
      sublabel: 'Ver métricas',
    },
    {
      id: 'tara',
      icon: Scale,
      label: 'Tara palet',
      sublabel: hasTara ? `${temporalPallet.palletTareWeightKg} kg` : 'Sin establecer',
    },
    ...(!externalActor
      ? [
          {
            id: 'pedido' as PalletScreen,
            icon: ShoppingCart,
            label: 'Pedido',
            sublabel: orderLabel ?? 'Sin asignar',
          },
        ]
      : []),
    {
      id: 'observaciones',
      icon: FileText,
      label: 'Notas',
      sublabel: obsPreview ?? 'Sin notas',
    },
    ...(showHistorial
      ? [
          {
            id: 'imagenes' as PalletScreen,
            icon: ImageIcon,
            label: 'Imágenes',
            sublabel: 'Fotos del palet',
          },
          {
            id: 'historial' as PalletScreen,
            icon: History,
            label: 'Historial',
            sublabel: 'Ver actividad',
          },
        ]
      : []),
    ...(!isReadOnly && !isNew
      ? [
          {
            id: 'eliminar' as PalletScreen,
            icon: Trash2,
            label: 'Eliminar cajas',
            sublabel: boxes.length > 0 ? `${boxes.length} cajas` : 'Sin cajas',
            variant: 'destructive' as const,
          },
        ]
      : []),
  ];

  // En solo lectura, ocultar las cards de acción de escritura
  const cards = isReadOnly ? allCards.filter((c) => !c.actionOnly) : allCards;

  const handleCardClick = (card: HubCard) => {
    if (card.id === 'scanner') {
      onOpenScanner();
    } else {
      onNavigate(card.id as PalletScreen);
    }
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      {/* Summary strip — only when there are boxes */}
      {boxes.length > 0 && (
        <div className="bg-muted/40 shrink-0 border-b px-4 py-2">
          <p className="text-muted-foreground text-xs">
            <span className="text-foreground font-medium">{boxes.length}</span>{' '}
            {boxes.length === 1 ? 'caja' : 'cajas'} ·{' '}
            <span className="text-foreground font-medium">{totalWeight} kg</span> neto
          </p>
        </div>
      )}

      {/* Scrollable grid with bottom fade */}
      <div className="relative min-h-0 flex-1">
        <div className="h-full overflow-y-auto px-3 py-4 pb-10">
          <div className="grid grid-cols-2 gap-3">
            {cards.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => handleCardClick(card)}
                className={cn(
                  'relative flex flex-col items-start justify-between rounded-2xl border p-4 text-left transition-all active:scale-[0.97]',
                  // Primary action cards: slightly taller + subtle ring for emphasis
                  card.variant === 'primary' &&
                    'border-primary/40 bg-primary/8 shadow-primary/10 ring-primary/20 hover:bg-primary/12 min-h-[124px] shadow-sm ring-1 ring-inset',
                  card.variant === 'destructive' &&
                    'border-destructive/25 bg-destructive/5 hover:bg-destructive/10 min-h-[112px]',
                  card.variant === 'default' &&
                    'border-border bg-card hover:bg-accent/50 min-h-[120px] shadow-sm',
                  (!card.variant || card.variant === undefined) &&
                    'border-border bg-card hover:bg-accent/50 min-h-[112px]'
                )}
              >
                {/* Badge */}
                {card.badge !== undefined && (
                  <Badge className="absolute top-3 right-3 min-w-7 px-2 text-xs font-medium tabular-nums shadow-sm">
                    {card.badge}
                  </Badge>
                )}

                {/* Icon */}
                <div
                  className={cn(
                    'flex items-center justify-center rounded-xl',
                    card.variant === 'primary' && 'bg-primary/15 text-primary h-11 w-11',
                    card.variant === 'destructive' &&
                      'bg-destructive/10 text-destructive h-10 w-10',
                    (!card.variant || card.variant === 'default') &&
                      'bg-muted text-foreground h-10 w-10'
                  )}
                >
                  <card.icon
                    className={cn(card.variant === 'primary' ? 'h-5.5 w-5.5' : 'h-5 w-5')}
                  />
                </div>

                {/* Labels */}
                <div className="mt-3 space-y-0.5">
                  <p
                    className={cn(
                      'text-sm leading-tight font-medium',
                      card.variant === 'primary' && 'text-primary',
                      card.variant === 'destructive' && 'text-destructive'
                    )}
                  >
                    {card.label}
                  </p>
                  {card.sublabel && (
                    <p className="text-muted-foreground line-clamp-1 text-xs">{card.sublabel}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom fade overflow indicator */}
        <div className="from-background pointer-events-none absolute right-0 bottom-0 left-0 h-10 bg-gradient-to-t to-transparent" />
      </div>
    </div>
  );
}
