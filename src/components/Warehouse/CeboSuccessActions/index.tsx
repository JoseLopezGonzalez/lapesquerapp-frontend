'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CircleCheck, LogOut, Printer, PlusCircle } from 'lucide-react';
import { usePrintElement } from '@/hooks/usePrintElement';
import CeboDispatchReciboPrintContent from './CeboDispatchReciboPrintContent';

const CEBO_RECIBO_PRINT_ID = 'cebo-recibo-print-content';

interface DispatchDetail {
  product?: { id?: number | string; name?: string; alias?: string } | null;
  netWeight?: number | string | null;
}

interface CeboDispatch {
  id?: number | string;
  supplier?: { id?: number | string; name?: string; label?: string; alias?: string } | string | null;
  date?: string | null;
  notes?: string | null;
  details?: DispatchDetail[];
  [key: string]: unknown;
}

interface PrintData {
  dispatchId?: number | string;
  supplier?: CeboDispatch['supplier'];
  date?: string | null;
  notes?: string;
  details?: DispatchDetail[];
}

interface CeboSuccessActionsProps {
  dispatch: CeboDispatch;
  onExit: () => void;
  onNew?: () => void;
}

export default function CeboSuccessActions({ dispatch, onExit, onNew }: CeboSuccessActionsProps) {
  const router = useRouter();
  const [printData, setPrintData] = useState<PrintData | null>(null);

  const { onPrint: onPrintRecibo } = usePrintElement({
    id: CEBO_RECIBO_PRINT_ID,
    freeSize: true,
  });

  const buildPrintData = (): PrintData => ({
    dispatchId: dispatch.id,
    supplier: dispatch.supplier,
    date: dispatch.date,
    notes: dispatch.notes ?? '',
    details: dispatch.details ?? [],
  });

  const handlePrintRecibo = () => {
    if (!dispatch) return;
    setPrintData(buildPrintData());
  };

  useEffect(() => {
    if (!printData) return;
    const t = setTimeout(() => {
      onPrintRecibo();
      setPrintData(null);
    }, 200);
    return () => clearTimeout(t);
  }, [printData, onPrintRecibo]);

  // Auto-print ticket on mount
  const autoTriggered = useRef(false);
  useEffect(() => {
    if (autoTriggered.current || !dispatch) return;
    autoTriggered.current = true;
    setPrintData({
      dispatchId: dispatch.id,
      supplier: dispatch.supplier,
      date: dispatch.date,
      notes: dispatch.notes ?? '',
      details: dispatch.details ?? [],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNewDispatch = () => {
    if (onNew) {
      onNew();
    } else {
      router.push('/admin/cebo-dispatches/create');
    }
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
            <CircleCheck className="h-16 w-16 text-green-600" strokeWidth={2} />
          </motion.div>
        </motion.div>
        <motion.p
          className="text-center text-xl font-semibold text-green-700 dark:text-green-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          Salida de cebo registrada correctamente
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
                onClick={handlePrintRecibo}
              >
                <Printer className="h-6 w-6 shrink-0" />
                Recibo
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="min-h-[64px] max-w-[260px] min-w-[160px] flex-1 touch-manipulation gap-3 py-4 text-xl transition-transform active:scale-[0.98]"
                onClick={handleNewDispatch}
              >
                <PlusCircle className="h-6 w-6 shrink-0" />
                Nueva salida de cebo
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="min-h-[64px] max-w-[260px] min-w-[160px] flex-1 touch-manipulation gap-3 py-4 text-xl transition-transform active:scale-[0.98]"
                onClick={onExit}
              >
                <LogOut className="h-6 w-6 shrink-0" />
                Volver al inicio
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {printData && (
        <div id={CEBO_RECIBO_PRINT_ID} className="hidden print:block">
          <CeboDispatchReciboPrintContent
            dispatchId={printData.dispatchId}
            supplier={printData.supplier}
            date={printData.date}
            notes={printData.notes}
            details={printData.details}
          />
        </div>
      )}
    </div>
  );
}
