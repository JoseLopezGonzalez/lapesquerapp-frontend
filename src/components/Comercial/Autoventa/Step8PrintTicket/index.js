'use client';

import { motion } from 'framer-motion';
import { CircleCheck, Printer, LogOut, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
    <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-8 px-4 py-6">
      <motion.div
        className="flex w-full max-w-md flex-col items-center gap-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <motion.div
          className="flex justify-center"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 20,
            delay: 0.1,
          }}
        >
          <motion.div
            className="rounded-full bg-green-500/10 p-4 ring-4 ring-green-500/20"
            animate={{
              scale: [1, 1.03, 1],
              opacity: 1,
            }}
            transition={{
              scale: {
                duration: 2,
                repeat: Infinity,
                repeatDelay: 2,
              },
            }}
          >
            <CircleCheck className="h-16 w-16 text-green-600 dark:text-green-400" strokeWidth={2} />
          </motion.div>
        </motion.div>
        <motion.p
          className="text-center text-xl font-semibold text-green-700 dark:text-green-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          Autoventa registrada correctamente
        </motion.p>
      </motion.div>

      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut', delay: 0.15 }}
      >
        <Card className="w-full">
          <CardContent className="px-6 pt-6 pb-6">
            <div className="flex flex-row flex-wrap justify-center gap-4">
              <Button
                variant="default"
                size="lg"
                className="min-h-[64px] max-w-[260px] min-w-[160px] flex-1 touch-manipulation gap-3 py-4 text-xl transition-transform active:scale-[0.98]"
                onClick={onPrint}
              >
                <Printer className="h-6 w-6 shrink-0" />
                Imprimir ticket
              </Button>
              {onFinish && (
                <Button
                  variant="outline"
                  size="lg"
                  className="min-h-[64px] max-w-[260px] min-w-[160px] flex-1 touch-manipulation gap-3 py-4 text-xl transition-transform active:scale-[0.98]"
                  onClick={onFinish}
                >
                  <LogOut className="h-6 w-6 shrink-0" />
                  Finalizar
                </Button>
              )}
              {onNew && (
                <Button
                  variant="ghost"
                  size="lg"
                  className="min-h-[64px] max-w-[260px] min-w-[160px] flex-1 touch-manipulation gap-3 py-4 text-xl transition-transform active:scale-[0.98]"
                  onClick={onNew}
                >
                  <PlusCircle className="h-6 w-6 shrink-0" />
                  Nueva autoventa
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <AutoventaTicketPrint
        order={ticketData}
        state={{ ...state, ...ticketData }}
        printId="autoventa-ticket-print"
        title="Autoventa"
      />
    </div>
  );
}
