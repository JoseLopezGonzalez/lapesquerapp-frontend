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
  const loadDate = state.loadDate ?? '';
  const customerName = state.customerName ?? '';
  const invoiceRequired = Boolean(state.invoiceRequired);

  return (
    <div className="space-y-4">
      <div className="grid gap-2 text-sm">
        <p><strong>Fecha entrada:</strong> {entryDate}</p>
        <p><strong>Fecha carga:</strong> {loadDate}</p>
        <p><strong>Cliente:</strong> {customerName}</p>
        <p><strong>Factura:</strong> {invoiceRequired ? 'Sí' : 'No'}</p>
      </div>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead className="text-right">Cajas</TableHead>
              <TableHead className="text-right">Peso (kg)</TableHead>
              <TableHead className="text-right">Precio (€/kg)</TableHead>
              <TableHead className="text-right">Subtotal (€)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, idx) => (
              <TableRow key={idx}>
                <TableCell>{item.productName ?? item.productId}</TableCell>
                <TableCell className="text-right">{item.boxesCount ?? 0}</TableCell>
                <TableCell className="text-right">
                  {Number(item.totalWeight).toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  {Number(item.unitPrice).toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  {Number(item.subtotal ?? 0).toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-end font-semibold">
        Total: {Number(totalAmount ?? 0).toFixed(2)} €
      </div>
    </div>
  );
}
