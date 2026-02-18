'use client';

import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

export default function Step7Confirmation({
  state,
  totalAmount,
  setInvoiceRequired,
  onCancel,
  error,
  isSubmitting,
}) {
  const checked = Boolean(state?.invoiceRequired);

  return (
    <div className="space-y-6 w-full rounded-lg border p-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="invoice-required"
          checked={checked}
          onCheckedChange={(value) => setInvoiceRequired?.(value === true)}
        />
        <Label htmlFor="invoice-required" className="cursor-pointer">
          Con factura
        </Label>
      </div>
      <p className="text-sm text-muted-foreground">
        {checked ? 'Se emitirá factura para esta autoventa.' : 'Solo recibo (sin factura).'}
      </p>
      <p>
        Has completado todos los datos para generar una autoventa.
      </p>
      <p className="text-lg font-semibold">
        Total: {Number(totalAmount ?? 0).toFixed(2)} €
      </p>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
