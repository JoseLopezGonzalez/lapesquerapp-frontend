'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Printer, Tag, PlusCircle, LogOut, CircleCheck } from 'lucide-react';
import { usePrintElement } from '@/hooks/usePrintElement';
import { notify } from '@/lib/notifications';
import ReceptionReciboPrintContent from '@/components/Admin/RawMaterialReceptions/ReceptionPrintDialog/ReceptionReciboPrintContent';

/**
 * Pantalla de éxito tras crear una recepción (rol operario).
 * Ofrece: Imprimir recibo (directo), Imprimir letreros (nombre producto), Ir a salida de cebo (mismo proveedor), Volver al inicio.
 */
const LABELS_PRINT_ID = 'product-labels-print-content';
const RECIBO_PRINT_ID = 'reception-recibo-print-content';

export default function ReceptionSuccessActions({ reception, onExit, createCeboHref }) {
  const router = useRouter();
  const [reciboPrintData, setReciboPrintData] = useState(null);
  const [labelsToPrint, setLabelsToPrint] = useState(null);

  const { onPrint: onPrintLabels } = usePrintElement({
    id: LABELS_PRINT_ID,
    freeSize: true,
  });
  const { onPrint: onPrintRecibo } = usePrintElement({
    id: RECIBO_PRINT_ID,
    freeSize: true,
  });

  const receptionId = reception?.id;
  const supplierId = reception?.supplier?.id ?? reception?.supplier;

  const handlePrintRecibo = () => {
    if (!reception) return;
    const details = (reception.details || []).map((d) => ({
      ...d,
      productName: d.productName ?? d.product?.name ?? d.product?.alias,
      product: d.product,
      netWeight: d.netWeight,
    }));
    setReciboPrintData({
      receptionId: reception.id,
      supplier: reception.supplier,
      date: reception.date,
      notes: reception.notes ?? '',
      details,
      pallets: (reception.pallets || []).map((p) => (p && typeof p === 'object' && 'pallet' in p ? p : { pallet: p })),
      creationMode: reception.creationMode || 'lines',
    });
  };

  const handlePrintLabels = () => {
    if (!reception) return;
    const names = (reception.details || [])
      .filter((d) => d.product)
      .map((d) => d.product?.name ?? d.product?.alias ?? d.productName ?? 'Producto');
    if (names.length === 0) {
      notify.error({
        title: 'Sin productos',
        description: 'No hay productos en esta recepción para imprimir letreros.',
      });
      return;
    }
    setLabelsToPrint(names);
  };

  useEffect(() => {
    if (!labelsToPrint?.length) return;
    const t = setTimeout(() => {
      onPrintLabels();
      setLabelsToPrint(null);
    }, 200);
    return () => clearTimeout(t);
  }, [labelsToPrint, onPrintLabels]);

  useEffect(() => {
    if (!reciboPrintData) return;
    const t = setTimeout(() => {
      onPrintRecibo();
      setReciboPrintData(null);
    }, 200);
    return () => clearTimeout(t);
  }, [reciboPrintData, onPrintRecibo]);

  const handleSalidaCebo = () => {
    const base = createCeboHref ?? '/admin/cebo-dispatches/create';
    const url = supplierId != null ? `${base}?supplierId=${supplierId}` : base;
    router.push(url);
  };

  return (
    <div className="w-full flex flex-col items-center justify-center flex-1 min-h-0 py-6 px-4 gap-8">
      {/* Icono y título fuera del card */}
      <motion.div
        className="flex flex-col items-center gap-4 w-full max-w-md"
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
          Recepción registrada correctamente
        </motion.p>
      </motion.div>

      {/* Card solo con los botones */}
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut', delay: 0.15 }}
      >
        <Card className="w-full">
          <CardContent className="pt-6 pb-6 px-6">
            <div className="flex flex-row flex-wrap justify-center gap-4">
              <Button
                variant="default"
                size="lg"
                className="flex-1 min-w-[160px] max-w-[260px] gap-3 min-h-[64px] py-4 text-xl touch-manipulation active:scale-[0.98] transition-transform"
                onClick={handlePrintRecibo}
              >
                <Printer className="h-6 w-6 shrink-0" />
                Recibo
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="flex-1 min-w-[160px] max-w-[260px] gap-3 min-h-[64px] py-4 text-xl touch-manipulation active:scale-[0.98] transition-transform"
                onClick={handlePrintLabels}
              >
                <Tag className="h-6 w-6 shrink-0" />
                Letreros
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="flex-1 min-w-[160px] max-w-[260px] gap-3 min-h-[64px] py-4 text-xl touch-manipulation active:scale-[0.98] transition-transform"
                onClick={handleSalidaCebo}
              >
                <PlusCircle className="h-6 w-6 shrink-0" />
                Salida de cebo
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="flex-1 min-w-[160px] max-w-[260px] gap-3 min-h-[64px] py-4 text-xl touch-manipulation active:scale-[0.98] transition-transform"
                onClick={onExit}
              >
                <LogOut className="h-6 w-6 shrink-0" />
                Volver al inicio
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Contenido oculto para impresión directa del recibo (sin diálogo) */}
      {reciboPrintData && (
        <div id={RECIBO_PRINT_ID} className="hidden print:block">
          <ReceptionReciboPrintContent
            receptionId={reciboPrintData.receptionId}
            supplier={reciboPrintData.supplier}
            date={reciboPrintData.date}
            notes={reciboPrintData.notes}
            details={reciboPrintData.details}
            pallets={reciboPrintData.pallets}
            creationMode={reciboPrintData.creationMode}
          />
        </div>
      )}

      {/* Contenido oculto para impresión de letreros: se monta al pulsar Letreros y se imprime directamente */}
      {labelsToPrint?.length > 0 && (
        <div id={LABELS_PRINT_ID} className="hidden print:block">
          <div className="p-4 space-y-4">
            {labelsToPrint.map((name, i) => (
              <div
                key={`${name}-${i}`}
                className="border border-black rounded-lg p-6 flex items-center justify-center min-h-[80px]"
                style={{ pageBreakAfter: i < labelsToPrint.length - 1 ? 'always' : 'auto' }}
              >
                <span className="text-3xl font-bold text-center break-words">{name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
