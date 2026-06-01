'use client';

import { Card, CardContent } from '@/components/ui/card';
import { WizardEmptyStep } from './WizardEmptyStep';
import { formatDate } from './utils';

export function OrderSummaryStep({ order, items, totalAmount }) {
  if (items.length === 0) {
    return (
      <WizardEmptyStep
        title="Sin contenido real todavía"
        description="Cuando registres cajas en el lector verás aquí el resumen del contenido real del pedido."
      />
    );
  }

  const totalBoxes = items.reduce((sum, item) => sum + (Number(item.boxesCount) || 0), 0);
  const totalWeight = items.reduce((sum, item) => sum + (Number(item.totalWeight) || 0), 0);

  return (
    <div className="w-full max-w-[min(800px,95vw)] space-y-4">
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="grid gap-2 text-sm">
            <p>
              <strong>Cliente:</strong> {order.customer?.name || 'Sin cliente'}
            </p>
            <p>
              <strong>Fecha de carga:</strong> {formatDate(order.loadDate)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-4">
          {items.map((item, idx) => (
            <div
              key={`${item.productId}-${idx}`}
              className="grid gap-1 border-b pb-3 last:border-b-0 last:pb-0"
            >
              <p className="font-medium">{item.productName ?? item.productId}</p>
              <p className="text-muted-foreground text-sm">
                {item.boxesCount ?? 0} cajas · {Number(item.totalWeight ?? 0).toFixed(2)} kg ·{' '}
                {Number(item.unitPrice ?? 0).toFixed(2)} €/kg
              </p>
              <p className="text-sm font-medium">{Number(item.subtotal ?? 0).toFixed(2)} €</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-3 p-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground">Cajas</p>
            <p className="text-lg font-semibold">{totalBoxes}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Peso neto</p>
            <p className="text-lg font-semibold">{totalWeight.toFixed(2)} kg</p>
          </div>
          <div>
            <p className="text-muted-foreground">Total estimado</p>
            <p className="text-lg font-semibold">{Number(totalAmount ?? 0).toFixed(2)} €</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
