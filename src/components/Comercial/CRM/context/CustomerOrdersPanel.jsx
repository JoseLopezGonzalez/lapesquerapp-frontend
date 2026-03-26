'use client';

import { EmptyState } from '@/components/Utilities/EmptyState';
import Loader from '@/components/Utilities/Loader';
import StatusBadge from '@/components/Admin/OrdersManager/StatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDecimalCurrency, formatDecimalWeight, formatInteger } from '@/helpers/formats/numbers/formatNumbers';
import { formatDateValue } from '../utils';

function resolveOrderStatusBadge(status) {
  if (status === 'finished') return { color: 'green', label: 'Finalizado' };
  if (status === 'incident') return { color: 'red', label: 'Incidencia' };
  return { color: 'orange', label: 'Pendiente' };
}

export default function CustomerOrdersPanel({
  orders = [],
  isLoading = false,
  errorMessage = '',
}) {
  if (isLoading) {
    return (
      <div className="flex min-h-[220px] items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <EmptyState
        title="Error cargando pedidos"
        description={errorMessage}
        className="h-full w-full border bg-muted/20 !min-h-[220px]"
      />
    );
  }

  if (!orders.length) {
    return (
      <EmptyState
        title="Sin pedidos"
        description="Este cliente no tiene pedidos."
        className="h-full w-full border bg-muted/20 !min-h-[220px]"
      />
    );
  }

  return (
    <div className="overflow-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Fecha salida</TableHead>
            <TableHead>Referencia</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Peso total</TableHead>
            <TableHead className="text-right">Cajas</TableHead>
            <TableHead className="text-right">Palets</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const statusBadge = resolveOrderStatusBadge(order.status);
            return (
              <TableRow key={order.id}>
                <TableCell className="font-medium">#{order.id}</TableCell>
                <TableCell>{formatDateValue(order.loadDate)}</TableCell>
                <TableCell>{order.buyerReference || '-'}</TableCell>
                <TableCell>
                  <StatusBadge color={statusBadge.color} label={statusBadge.label} />
                </TableCell>
                <TableCell>{order.orderType === 'autoventa' ? 'Autoventa' : 'Estándar'}</TableCell>
                <TableCell className="text-right">{formatDecimalWeight(order.totalNetWeight ?? 0)}</TableCell>
                <TableCell className="text-right">{formatInteger(order.totalBoxes ?? 0)}</TableCell>
                <TableCell className="text-right">{formatInteger(order.pallets ?? 0)}</TableCell>
                <TableCell className="text-right">{formatDecimalCurrency(order.totalAmount ?? 0)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
