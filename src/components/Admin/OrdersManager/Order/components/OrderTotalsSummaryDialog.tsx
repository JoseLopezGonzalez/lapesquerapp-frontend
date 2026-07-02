'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface OrderTotalsSummaryItem {
  /** Clave estable para el key de React (p.ej. 'boxes', 'subtotal') */
  key: string;
  /** Label mostrado en mayúsculas — p.ej. "Cajas", "Precio promedio" */
  label: string;
  /** Valor ya formateado como string — p.ej. formatInteger, formatDecimalCurrency */
  value: string;
}

interface OrderTotalsSummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Se renderiza en DialogTitle — siempre "Totales" en los usos actuales */
  title: string;
  /** Se renderiza en DialogDescription */
  description: string;
  /** Filas de estadística, en el orden en que deben mostrarse */
  items: OrderTotalsSummaryItem[];
  /** Controla el layout fullscreen en mobile vs Dialog centrado en desktop */
  isMobile: boolean;
}

/**
 * Diálogo compartido de "Totales" usado en las tabs móviles de pedidos
 * (previsión de productos, detalle de productos, líneas auxiliares).
 * Renderiza una fila por item: label en mayúsculas + valor destacado,
 * separadas por un borde superior salvo la primera.
 */
export function OrderTotalsSummaryDialog({
  open,
  onOpenChange,
  title,
  description,
  items,
  isMobile,
}: OrderTotalsSummaryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`${isMobile ? 'm-0 flex h-full max-h-full w-full max-w-full flex-col rounded-none' : ''}`}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div
          className={`${isMobile ? 'flex flex-1 flex-col items-center justify-center px-4' : ''}`}
        >
          <div className={`space-y-6 ${isMobile ? 'w-full max-w-md' : ''}`}>
            <div className="flex flex-col space-y-6">
              {items.map((item, index) => (
                <div
                  key={item.key}
                  className={`space-y-2 text-center ${index > 0 ? 'border-t pt-4' : ''}`}
                >
                  <p className="text-muted-foreground text-xs font-normal tracking-wide uppercase">
                    {item.label}
                  </p>
                  <p className="text-foreground text-xl font-medium">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
