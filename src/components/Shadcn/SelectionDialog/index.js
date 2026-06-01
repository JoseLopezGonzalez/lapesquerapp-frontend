'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

/**
 * Diálogo de selección con tarjetas grandes, estilo táctil.
 * Título, lista scrollable de cards, borde naranja/primary al seleccionar,
 * botones Cancelar y Siguiente.
 *
 * @param {Object} props
 * @param {boolean} props.open
 * @param {(open: boolean) => void} props.onOpenChange
 * @param {string} props.title - Ej: "Selecciona la especie"
 * @param {Array<{value: any, label: string, secondaryLabel?: string}>} props.options
 * @param {any} props.value - valor seleccionado (debe coincidir con option.value)
 * @param {(value: any) => void} props.onSelect
 * @param {() => void} props.onCancel - Al pulsar Cancelar
 * @param {() => void} props.onNext - Al pulsar Siguiente
 * @param {boolean} [props.nextDisabled] - Deshabilitar Siguiente (ej. sin selección)
 * @param {boolean} [props.loading] - Mostrar estado de carga
 */
export function SelectionDialog({
  open,
  onOpenChange,
  title,
  options = [],
  value,
  onSelect,
  onCancel,
  onNext,
  nextDisabled = false,
  loading = false,
}) {
  const handleCancel = () => {
    onCancel?.();
    onOpenChange?.(false);
  };

  const handleNext = () => {
    onNext?.();
    // No cerrar aquí: el padre avanza de paso y el diálogo se desmonta
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[85vh] w-[min(420px,92vw)] flex-col gap-0 overflow-hidden p-0"
        hideClose={false}
      >
        <DialogHeader className="shrink-0 border-b px-6 pt-6 pb-4">
          <DialogTitle className="text-left text-base font-semibold">{title}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="min-h-0 flex-1 px-4 py-4">
          <div className="flex flex-col gap-2 pr-4">
            {loading ? (
              <p className="text-muted-foreground py-8 text-center text-sm">Cargando...</p>
            ) : (
              options.map((opt, idx) => {
                const optVal = opt.value;
                const isSelected =
                  value != null &&
                  (typeof optVal === 'object'
                    ? optVal?.id === value?.id || optVal?.value === value
                    : String(optVal) === String(value));
                return (
                  <button
                    key={optVal?.id ?? optVal ?? idx}
                    type="button"
                    onClick={() => onSelect?.(isSelected ? null : opt.value)}
                    className={cn(
                      'min-h-[56px] w-full touch-manipulation rounded-lg border-2 px-4 py-3 text-left transition-colors',
                      'flex flex-col justify-center gap-0.5',
                      isSelected
                        ? 'border-primary bg-primary/5 border-l-4'
                        : 'border-border hover:border-primary/40 hover:bg-muted/50'
                    )}
                  >
                    <span className="text-foreground font-medium">{opt.label}</span>
                    {opt.secondaryLabel && (
                      <span className="text-muted-foreground text-sm">{opt.secondaryLabel}</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>

        <div className="bg-muted/30 flex shrink-0 gap-3 border-t px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="min-h-[48px] flex-1 touch-manipulation"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleNext}
            disabled={nextDisabled}
            className="min-h-[48px] flex-1 touch-manipulation"
          >
            Siguiente
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
