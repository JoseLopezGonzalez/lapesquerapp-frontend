'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

export default function Step3Pricing({ state, setItemPrice }) {
  const items = state.items ?? [];

  return (
    <div className="w-full flex flex-col items-center mx-auto max-w-[420px]">
      <div className="w-full space-y-3">
        {items.map((item, idx) => (
          <Card key={idx} className="overflow-hidden">
            <CardContent className="p-4 space-y-3">
              <p className="font-medium text-foreground">
                {item.productName ?? item.productId}
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Cajas</span>
                  <p className="font-medium">{item.boxesCount ?? 0}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Peso total (kg)</span>
                  <p className="font-medium">{Number(item.totalWeight).toFixed(2)}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`price-${idx}`} className="text-muted-foreground">
                  Precio unit. (€/kg)
                </Label>
                <Input
                  id={`price-${idx}`}
                  type="number"
                  min={0}
                  step={0.01}
                  value={item.unitPrice === 0 || item.unitPrice == null ? '' : item.unitPrice}
                  onChange={(e) => {
                    const v = e.target.value;
                    setItemPrice(item.productId, v === '' ? 0 : parseFloat(v) || 0);
                  }}
                  className="h-10 touch-manipulation"
                  inputMode="decimal"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
