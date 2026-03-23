'use client';

import { Card, CardContent } from '@/components/ui/card';

export function ForecastStep({ items }) {
  const totalBoxes = items.reduce((sum, item) => sum + (Number(item.boxesCount) || 0), 0);
  const totalWeight = items.reduce((sum, item) => sum + (Number(item.totalWeight) || 0), 0);
  const totalAmount = items.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);

  return (
    <div className="w-full max-w-[min(800px,95vw)] space-y-4">
      <Card>
        <CardContent className="space-y-3 p-4">
          {items.map((item, idx) => (
            <div key={`${item.productId}-${idx}`} className="grid gap-1 border-b pb-3 last:border-b-0 last:pb-0">
              <p className="font-medium">{item.productName ?? item.productId}</p>
              <p className="text-sm text-muted-foreground">
                {item.boxesCount ?? 0} cajas · {Number(item.totalWeight ?? 0).toFixed(2)} kg · {Number(item.unitPrice ?? 0).toFixed(2)} €/kg
              </p>
              <p className="text-sm font-medium">{Number(item.subtotal ?? 0).toFixed(2)} €</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-3 p-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground">Cajas previstas</p>
            <p className="text-lg font-semibold">{totalBoxes}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Peso previsto</p>
            <p className="text-lg font-semibold">{totalWeight.toFixed(2)} kg</p>
          </div>
          <div>
            <p className="text-muted-foreground">Total previsto</p>
            <p className="text-lg font-semibold">{Number(totalAmount ?? 0).toFixed(2)} €</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
