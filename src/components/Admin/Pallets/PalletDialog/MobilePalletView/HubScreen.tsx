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
  fullWidth?: boolean;
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
      sublabel: hasTara ? `${temporalPallet.palletTareWeightKg} kg` : '— kg',
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
          },
          {
            id: 'historial' as PalletScreen,
            icon: History,
            label: 'Historial',
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
            fullWidth: true,
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

  const mainCards = cards.filter((c) => !c.fullWidth);
  const fullWidthCards = cards.filter((c) => c.fullWidth);

  return (
    <div className="flex flex-col gap-3 overflow-auto px-3 py-4">
      {/* 2-column grid */}
      <div className="grid grid-cols-2 gap-3">
        {mainCards.map((card) => (
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
              <span className="absolute right-3 top-3 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                {card.badge}
              </span>
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

      {/* Full-width cards (Eliminar) */}
      {fullWidthCards.map((card) => (
        <button
          key={card.id}
          type="button"
          onClick={() => handleCardClick(card)}
          className={cn(
            'flex h-14 w-full items-center gap-3 rounded-2xl border px-4 text-left transition-all active:scale-[0.98]',
            card.variant === 'destructive' &&
              'border-destructive/25 bg-destructive/5 hover:bg-destructive/10'
          )}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
            <card.icon className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-destructive">{card.label}</p>
            {card.sublabel && (
              <p className="text-xs text-muted-foreground">{card.sublabel}</p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
