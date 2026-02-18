'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function Step3Pricing({ state, setItemPrice, totalAmount }) {
  const items = state.items ?? [];

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead className="text-right">Cajas</TableHead>
              <TableHead className="text-right">Peso total (kg)</TableHead>
              <TableHead className="text-right">Precio unit. (€/kg)</TableHead>
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
                <TableCell className="text-right w-28">
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={item.unitPrice ?? ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      setItemPrice(item.productId, v === '' ? 0 : parseFloat(v) || 0);
                    }}
                    className="text-right h-8"
                  />
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
