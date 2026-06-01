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
    <div className="w-full space-y-4 rounded-lg border p-4">
      <div className="grid gap-2 text-sm">
        <p>
          <strong>Fecha:</strong> {entryDate}
        </p>
        <p>
          <strong>Cliente:</strong> {customerName}
        </p>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead className="w-24 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, idx) => (
              <TableRow key={idx} className="align-top">
                {/* Keep this summary layout aligned with the printed ticket (AutoventaTicketPrint). */}
                <TableCell className="py-2 break-words whitespace-normal">
                  {item.productName ?? item.productId}
                </TableCell>
                <TableCell className="py-2 text-right text-sm whitespace-pre-line">
                  {`${item.boxesCount ?? 0} /c\n${Number(item.totalWeight).toFixed(2)} kg\n${Number(item.unitPrice).toFixed(2)} €/kg\n${Number(item.subtotal ?? 0).toFixed(2)} €`}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-end text-lg font-semibold">
        Total: {Number(totalAmount ?? 0).toFixed(2)} €
      </div>
    </div>
  );
}
