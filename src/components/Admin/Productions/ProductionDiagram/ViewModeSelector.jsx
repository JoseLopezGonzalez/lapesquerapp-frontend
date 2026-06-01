'use client';

import { Calculator, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export const VIEW_MODES_CONFIG = {
  simple: {
    id: 'simple',
    label: 'Simple',
    icon: EyeOff,
    description: 'Informacion basica del proceso',
    enabled: true,
  },
  detailed: {
    id: 'detailed',
    label: 'Detallada',
    icon: Eye,
    description: 'Incluye productos y detalles',
    enabled: true,
  },
  accounting: {
    id: 'accounting',
    label: 'Contabilidad',
    icon: Calculator,
    description: 'Informacion contable y costos',
    enabled: true,
  },
};

export function ViewModeSelector({ viewMode, onViewModeChange }) {
  return (
    <div className="bg-muted inline-flex h-9 items-center justify-center gap-1 rounded-lg p-1">
      {Object.values(VIEW_MODES_CONFIG).map((mode) => {
        const Icon = mode.icon;
        const isActive = viewMode === mode.id;
        const isDisabled = !mode.enabled;

        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => {
              if (!isDisabled && mode.enabled) {
                onViewModeChange(mode.id);
              }
            }}
            disabled={isDisabled}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 px-3 py-1 text-sm font-medium',
              'rounded-md transition-all duration-200',
              'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
              isDisabled && 'cursor-not-allowed opacity-50',
              !isDisabled && 'hover:bg-muted/80 cursor-pointer',
              isActive && 'bg-background text-foreground shadow-sm',
              !isActive && !isDisabled && 'text-muted-foreground'
            )}
            title={isDisabled ? 'Proximamente' : mode.description}
          >
            <Icon className={cn('h-3.5 w-3.5', isActive && 'text-primary')} />
            <span className="text-xs">{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
}
