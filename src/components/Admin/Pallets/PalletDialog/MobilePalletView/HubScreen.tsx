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
        <div className="shrink-0 border-b bg-muted/40 px-4 py-2">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{boxes.length}</span>{' '}
            {boxes.length === 1 ? 'caja' : 'cajas'} ·{' '}
            <span className="font-medium text-foreground">{totalWeight} kg</span> neto
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
                    'min-h-[124px] border-primary/40 bg-primary/8 shadow-sm shadow-primary/10 ring-1 ring-primary/20 ring-inset hover:bg-primary/12',
                  card.variant === 'destructive' &&
                    'min-h-[112px] border-destructive/25 bg-destructive/5 hover:bg-destructive/10',
                  card.variant === 'default' &&
                    'min-h-[120px] border-border bg-card shadow-sm hover:bg-accent/50',
                  (!card.variant || card.variant === undefined) &&
                    'min-h-[112px] border-border bg-card hover:bg-accent/50'
                )}
              >
                {/* Badge */}
                {card.badge !== undefined && (
                  <Badge className="absolute top-3 right-3 min-w-7 px-2 text-xs font-semibold tabular-nums shadow-sm">
                    {card.badge}
                  </Badge>
                )}

                {/* Icon */}
                <div
                  className={cn(
                    'flex items-center justify-center rounded-xl',
                    card.variant === 'primary' && 'h-11 w-11 bg-primary/15 text-primary',
                    card.variant === 'destructive' && 'h-10 w-10 bg-destructive/10 text-destructive',
                    (!card.variant || card.variant === 'default') && 'h-10 w-10 bg-muted text-foreground'
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
                      'text-sm font-semibold leading-tight',
                      card.variant === 'primary' && 'text-primary',
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

        {/* Bottom fade overflow indicator */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-background to-transparent" />
      </div>
    </div>
  );
}
