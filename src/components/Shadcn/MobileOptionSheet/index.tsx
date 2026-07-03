'use client';

import type { ReactNode } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export interface MobileOptionSheetOption<T extends string | number> {
  value: T;
  label: ReactNode;
}

interface MobileOptionSheetProps<T extends string | number> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  options: MobileOptionSheetOption<T>[];
  value: T;
  onSelect: (value: T) => void;
}

/**
 * Bottom sheet de selección única para mobile — mismo lenguaje visual que
 * MobileCombobox (lista con Check, active:bg-accent), sin buscador porque
 * está pensado para conjuntos pequeños de opciones (estado, temperatura...).
 */
export function MobileOptionSheet<T extends string | number>({
  open,
  onOpenChange,
  title,
  options,
  value,
  onSelect,
}: MobileOptionSheetProps<T>) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="flex max-h-[70dvh] flex-col gap-0 rounded-t-2xl p-0"
      >
        <SheetHeader className="shrink-0 border-b px-4 pb-3 pt-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base">{title}</SheetTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 shrink-0"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <ul className="min-h-0 flex-1 divide-y overflow-y-auto">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <li key={option.value}>
                <button
                  type="button"
                  className={cn(
                    'flex min-h-[52px] w-full items-center gap-3 px-4 py-3 text-left transition-colors active:bg-accent',
                    isSelected && 'bg-primary/5'
                  )}
                  onClick={() => {
                    onSelect(option.value);
                    onOpenChange(false);
                  }}
                >
                  <Check
                    className={cn(
                      'h-4 w-4 shrink-0 text-primary',
                      isSelected ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span className="flex-1">{option.label}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="shrink-0" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} />
      </SheetContent>
    </Sheet>
  );
}
