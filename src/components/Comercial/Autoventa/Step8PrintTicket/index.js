'use client';

import { Button } from '@/components/ui/button';
import { usePrintElement } from '@/hooks/usePrintElement';
import AutoventaTicketPrint from '../AutoventaTicketPrint';

export default function Step8PrintTicket({ state, onFinish, onNew }) {
  const { onPrint } = usePrintElement({ id: 'autoventa-ticket-print', freeSize: true });
  const order = state.createdOrder;
  const customerName = state.customerName;
  const entryDate = state.entryDate;
  const loadDate = state.loadDate;
  const invoiceRequired = state.invoiceRequired;
  const observations = state.observations;
  const items = state.items ?? [];
  const total = items.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);

  const ticketData = order
    ? {
        entryDate: order.entryDate ?? entryDate,
        loadDate: order.loadDate ?? loadDate,
        customerName: order.customer?.name ?? customerName,
        invoiceRequired: order.invoiceRequired ?? invoiceRequired,
        observations: order.observations ?? observations,
        items: order.items ?? items,
      }
    : {
        entryDate,
        loadDate,
        customerName,
        invoiceRequired,
        observations,
        items,
      };

  return (
    <div className="space-y-6">
      <p className="text-green-600 font-medium">Autoventa creada correctamente.</p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={onPrint}>Imprimir ticket</Button>
        {onFinish && (
          <Button variant="outline" onClick={onFinish}>
            Finalizar (ir a Inicio)
          </Button>
        )}
        {onNew && (
          <Button variant="secondary" onClick={onNew}>
            Nueva autoventa
          </Button>
        )}
      </div>
      <AutoventaTicketPrint order={ticketData} state={{ ...state, ...ticketData }} />
    </div>
  );
}
