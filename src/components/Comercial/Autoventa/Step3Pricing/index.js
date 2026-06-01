'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Step3Pricing({
  state,
  setItemPrice,
  taxOptions = null,
  setItemTax = null,
}) {
  const items = state.items ?? [];
  const showTaxSelect =
    Array.isArray(taxOptions) && taxOptions.length > 0 && typeof setItemTax === 'function';

  return (
    <div className="mx-auto flex w-full max-w-[420px] flex-col items-center">
      <div className="w-full space-y-3">
        {items.map((item, idx) => (
          <Card key={idx} className="overflow-hidden">
            <CardContent className="space-y-3 p-4">
              <p className="text-foreground font-medium">{item.productName ?? item.productId}</p>
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

              {showTaxSelect && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">IVA</Label>
                  <Select
                    value={item.taxId == null ? '' : String(item.taxId)}
                    onValueChange={(value) => {
                      setItemTax(item.productId, value === '' ? null : Number(value));
                    }}
                  >
                    <SelectTrigger className="h-10 touch-manipulation">
                      <SelectValue placeholder="Selecciona IVA" />
                    </SelectTrigger>
                    <SelectContent>
                      {taxOptions.map((tax) => (
                        <SelectItem key={String(tax.id)} value={String(tax.id)}>
                          {tax.name ?? `IVA ${tax.rate ?? ''}`}
                          {tax.rate != null ? ` (${tax.rate}%)` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
