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

  const cards: HubCard[] = [
    {
      id: 'scanner',
      icon: Scan,
      label: 'Escanear',
      sublabel: 'Añadir con cámara',
      variant: 'primary',
    },
    {
      id: 'add-manual',
      icon: Plus,
      label: 'Añadir manual',
      sublabel: 'Sin escáner',
      variant: 'default',
    },
    {
      id: 'cajas',
      icon: Package,
      label: 'Cajas',
      sublabel: boxes.length > 0 ? `${boxes.length} · ${totalWeight} kg` : 'Sin cajas',
      badge: boxes.length > 0 ? boxes.length : undefined,
    },
    {
      id: 'resumen',
      icon: BarChart2,
      label: 'Resumen',
      sublabel: boxes.length > 0 ? `${totalWeight} kg neto` : 'Sin datos aún',
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

  const handleCardClick = (card: HubCard) => {
    if (card.id === 'scanner') {
      onOpenScanner();
    } else {
      onNavigate(card.id as PalletScreen);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto px-3 py-4 pb-6">
      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => handleCardClick(card)}
            className={cn(
              'relative flex min-h-[112px] flex-col items-start justify-between rounded-2xl border p-4 text-left transition-all active:scale-[0.97]',
              card.variant === 'primary' &&
                'border-primary/30 bg-primary/8 hover:bg-primary/12',
              card.variant === 'destructive' &&
                'border-destructive/25 bg-destructive/5 hover:bg-destructive/10',
              card.variant === 'default' &&
                'border-border bg-card hover:bg-accent/50',
              (!card.variant || card.variant === undefined) &&
                'border-border bg-card hover:bg-accent/50'
            )}
          >
            {/* Badge */}
            {card.badge !== undefined && (
              <Badge
                className="absolute top-3 right-3 min-w-7 px-2 text-xs font-semibold tabular-nums shadow-sm"
              >
                {card.badge}
              </Badge>
            )}

            {/* Icon */}
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl',
                card.variant === 'primary' && 'bg-primary/15 text-primary',
                card.variant === 'destructive' && 'bg-destructive/10 text-destructive',
                (!card.variant || card.variant === 'default') &&
                  'bg-muted text-foreground'
              )}
            >
              <card.icon className="h-5 w-5" />
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
  );
}
