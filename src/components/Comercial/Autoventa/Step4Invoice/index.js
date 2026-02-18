'use client';

import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

export default function Step4Invoice({ state, setInvoiceRequired }) {
  const checked = Boolean(state.invoiceRequired);

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="invoice-required"
          checked={checked}
          onCheckedChange={(value) => setInvoiceRequired(value === true)}
        />
        <Label htmlFor="invoice-required" className="cursor-pointer">
          Con factura
        </Label>
      </div>
      <p className="text-sm text-muted-foreground">
        {checked ? 'Se emitirá factura para esta autoventa.' : 'Solo recibo (sin factura).'}
      </p>
    </div>
  );
}
