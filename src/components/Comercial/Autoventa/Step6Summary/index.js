'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function Step6Summary({ state, totalAmount }) {
  const items = state.items ?? [];
  const entryDate = state.entryDate ?? '';
  const customerName = state.customerName ?? '';

  return (
    <div className="space-y-4 w-full rounded-lg border p-4">
      <div className="grid gap-2 text-sm">
        <p><strong>Fecha:</strong> {entryDate}</p>
        <p><strong>Cliente:</strong> {customerName}</p>
      </div>
      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead className="text-right w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, idx) => (
              <TableRow key={idx} className="align-top">
                <TableCell className="py-2">{item.productName ?? item.productId}</TableCell>
                <TableCell className="text-right py-2 text-sm whitespace-pre-line">
                  {`${item.boxesCount ?? 0} /c\n${Number(item.totalWeight).toFixed(2)} kg\n${Number(item.unitPrice).toFixed(2)} €/kg\n${Number(item.subtotal ?? 0).toFixed(2)} €`}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-end font-semibold text-lg">
        Total: {Number(totalAmount ?? 0).toFixed(2)} €
      </div>
    </div>
  );
}
