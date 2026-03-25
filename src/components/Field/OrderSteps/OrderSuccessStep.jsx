'use client';

import { ArrowRight, CircleCheck, Printer, Route } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePrintElement } from '@/hooks/usePrintElement';
import AutoventaTicketPrint from '@/components/Comercial/Autoventa/AutoventaTicketPrint';
import { mapPlannedProductDetailsToTicketItems } from '@/lib/field/fieldOrderTicket';

export function OrderSuccessStep({ order, onBackToOrders, onBackToRoute }) {
  const printId = `field-order-ticket-print-${order?.id ?? 'unknown'}`;
  const { onPrint } = usePrintElement({ id: printId, freeSize: true });
  const items = mapPlannedProductDetailsToTicketItems(order);
  const ticketData = {
    entryDate: order?.entryDate ?? '',
    customerName: order?.customer?.name ?? '',
    invoiceRequired: Boolean(order?.invoiceRequired ?? false),
    observations: order?.observations ?? '',
    items,
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="rounded-full bg-green-500/10 p-4 ring-4 ring-green-500/20">
          <CircleCheck className="h-16 w-16 text-green-600 dark:text-green-400" strokeWidth={2} />
        </div>
        <p className="text-xl font-semibold text-green-700 dark:text-green-400">
          Pedido operativo actualizado
        </p>
        <p className="max-w-md text-sm text-muted-foreground">
          El pedido #{order.id} se ha guardado con el contenido servido actualizado.
        </p>
      </div>

      <Card className="w-full max-w-md">
        <CardContent className="pt-6 pb-6 px-6">
          <div className="flex flex-row flex-wrap justify-center gap-4">
            <Button
              variant="default"
              size="sm"
              className="flex-1 min-w-[160px] max-w-[260px] gap-2 min-h-[40px] touch-manipulation active:scale-[0.98] transition-transform text-sm"
              onClick={onPrint}
            >
              <Printer className="h-4 w-4 shrink-0" />
              Imprimir ticket
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="flex-1 min-w-[160px] max-w-[260px] gap-2 min-h-[40px] touch-manipulation active:scale-[0.98] transition-transform text-sm"
              onClick={onBackToOrders}
            >
              <ArrowRight className="h-4 w-4 shrink-0" />
              Volver a pedidos
            </Button>

            {order.routeId ? (
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 min-w-[160px] max-w-[260px] gap-2 min-h-[40px] touch-manipulation active:scale-[0.98] transition-transform text-sm"
                onClick={onBackToRoute}
              >
                <Route className="h-4 w-4 shrink-0" />
                Volver a la ruta
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <AutoventaTicketPrint
        order={ticketData}
        state={ticketData}
        printId={printId}
        title="Ticket"
      />
    </div>
  );
}
