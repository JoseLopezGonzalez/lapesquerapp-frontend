'use client';

import { type ComponentType, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Printer, Tag, Tags, PlusCircle, LogOut, CircleCheck } from 'lucide-react';
import { usePrintElement } from '@/hooks/usePrintElement';
import { notify } from '@/lib/notifications';
import ReceptionReciboPrintContentJS from '@/components/Admin/RawMaterialReceptions/ReceptionPrintDialog/ReceptionReciboPrintContent';

interface ReceptionPrintContentProps {
  receptionId?: number | string;
  supplier?: unknown;
  date?: string | null;
  notes?: string;
  details?: object[];
  pallets?: object[];
  creationMode?: string | null;
  className?: string;
}

// JS source file infers details/pallets as never[] from empty-array defaults.
// This cast declares the actual accepted types without touching the legacy JS file.
const ReceptionReciboPrintContent = ReceptionReciboPrintContentJS as unknown as ComponentType<ReceptionPrintContentProps>;

const LABELS_PRINT_ID = 'product-labels-print-content';
const LOT_LABELS_PRINT_ID = 'lot-labels-print-content';
const RECIBO_PRINT_ID = 'reception-recibo-print-content';

interface ReceptionDetail {
  product?: { id?: number | string; name?: string; alias?: string } | null;
  productName?: string;
  netWeight?: number | string | null;
  lot?: string | null;
  boxes?: number | string | null;
}

interface ReceptionPallet {
  pallet?: unknown;
  [key: string]: unknown;
}

interface Reception {
  id?: number | string;
  supplier?: { id?: number | string; name?: string; label?: string; alias?: string } | string | null;
  date?: string | null;
  notes?: string | null;
  details?: ReceptionDetail[];
  pallets?: (ReceptionPallet | unknown)[];
  creationMode?: string | null;
  [key: string]: unknown;
}

interface ReciboPrintData {
  receptionId?: number | string;
  supplier?: Reception['supplier'];
  date?: string | null;
  notes?: string;
  details?: ReceptionDetail[];
  pallets?: ReceptionPallet[];
  creationMode?: string | null;
}

interface ReceptionSuccessActionsProps {
  reception: Reception;
  onExit: () => void;
  createCeboHref?: string;
}

/**
 * Pantalla de éxito tras crear una recepción (rol operario).
 * Ofrece: Imprimir recibo (directo), Imprimir letreros (nombre producto), Ir a salida de cebo (mismo proveedor), Volver al inicio.
 */
export default function ReceptionSuccessActions({
  reception,
  onExit,
  createCeboHref,
}: ReceptionSuccessActionsProps) {
  const router = useRouter();
  const [reciboPrintData, setReciboPrintData] = useState<ReciboPrintData | null>(null);
  const [labelsToPrint, setLabelsToPrint] = useState<string[] | null>(null);
  const [lotLabelsToPrint, setLotLabelsToPrint] = useState<(string | null)[] | null>(null);

  const { onPrint: onPrintLabels } = usePrintElement({
    id: LABELS_PRINT_ID,
    freeSize: true,
  });
  const { onPrint: onPrintLotLabels } = usePrintElement({
    id: LOT_LABELS_PRINT_ID,
    freeSize: true,
  });
  const { onPrint: onPrintRecibo } = usePrintElement({
    id: RECIBO_PRINT_ID,
    freeSize: true,
  });

  const supplierId = reception?.supplier && typeof reception.supplier === 'object'
    ? (reception.supplier as { id?: number | string }).id
    : reception?.supplier;

  const buildReciboPrintData = (): ReciboPrintData => {
    const details = (reception.details || []).map((d) => ({
      ...d,
      productName: d.productName ?? d.product?.name ?? d.product?.alias,
      product: d.product,
      netWeight: d.netWeight,
    }));
    return {
      receptionId: reception.id,
      supplier: reception.supplier,
      date: reception.date,
      notes: reception.notes ?? '',
      details,
      pallets: (reception.pallets || []).map((p) =>
        p && typeof p === 'object' && 'pallet' in (p as object) ? (p as ReceptionPallet) : { pallet: p }
      ),
      creationMode: reception.creationMode || 'lines',
    };
  };

  const handlePrintRecibo = () => {
    if (!reception) return;
    setReciboPrintData(buildReciboPrintData());
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

  const handlePrintLotLabels = () => {
    if (!reception) return;
    const lots = (reception.details || [])
      .filter((d) => d.lot)
      .flatMap((d) => {
        const count = Math.max(1, parseInt(String(d.boxes ?? 1), 10) || 1);
        return Array.from({ length: count }, () => d.lot ?? null);
      });
    if (lots.length === 0) {
      notify.error({
        title: 'Sin lotes',
        description: 'No hay líneas con lote en esta recepción para imprimir etiquetas.',
      });
      return;
    }
    setLotLabelsToPrint(lots);
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
    if (!lotLabelsToPrint?.length) return;
    const t = setTimeout(() => {
      onPrintLotLabels();
      setLotLabelsToPrint(null);
    }, 200);
    return () => clearTimeout(t);
  }, [lotLabelsToPrint, onPrintLotLabels]);

  useEffect(() => {
    if (!reciboPrintData) return;
    const t = setTimeout(() => {
      onPrintRecibo();
      setReciboPrintData(null);
    }, 200);
    return () => clearTimeout(t);
  }, [reciboPrintData, onPrintRecibo]);

  // Auto-print recibo on mount
  const autoTriggered = useRef(false);
  useEffect(() => {
    if (autoTriggered.current || !reception) return;
    autoTriggered.current = true;
    setReciboPrintData({
      receptionId: reception.id,
      supplier: reception.supplier,
      date: reception.date,
      notes: reception.notes ?? '',
      details: (reception.details || []).map((d) => ({
        ...d,
        productName: d.productName ?? d.product?.name ?? d.product?.alias,
        product: d.product,
        netWeight: d.netWeight,
      })),
      pallets: (reception.pallets || []).map((p) =>
        p && typeof p === 'object' && 'pallet' in (p as object) ? (p as ReceptionPallet) : { pallet: p }
      ),
      creationMode: reception.creationMode || 'lines',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSalidaCebo = () => {
    const base = createCeboHref ?? '/admin/cebo-dispatches/create';
    const url = supplierId != null ? `${base}?supplierId=${supplierId}` : base;
    router.push(url);
  };

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-8 px-4 py-6">
      {/* Icono y título fuera del card */}
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
                onClick={handlePrintLabels}
              >
                <Tag className="h-6 w-6 shrink-0" />
                Letreros
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="min-h-[64px] max-w-[260px] min-w-[160px] flex-1 touch-manipulation gap-3 py-4 text-xl transition-transform active:scale-[0.98]"
                onClick={handlePrintLotLabels}
              >
                <Tags className="h-6 w-6 shrink-0" />
                Etiq. Lote
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="min-h-[64px] max-w-[260px] min-w-[160px] flex-1 touch-manipulation gap-3 py-4 text-xl transition-transform active:scale-[0.98]"
                onClick={handleSalidaCebo}
              >
                <PlusCircle className="h-6 w-6 shrink-0" />
                Salida de cebo
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

      {/* Contenido oculto para impresión de letreros */}
      {labelsToPrint && labelsToPrint.length > 0 && (
        <div id={LABELS_PRINT_ID} className="hidden print:block">
          <div className="space-y-4 p-4">
            {labelsToPrint.map((name, i) => (
              <div
                key={`${name}-${i}`}
                className="flex min-h-[80px] items-center justify-center rounded-lg border border-black p-6"
                style={{ pageBreakAfter: i < labelsToPrint.length - 1 ? 'always' : 'auto' }}
              >
                <span className="text-center text-3xl font-bold break-words">{name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contenido oculto para impresión de etiquetas de lote: una por cada caja */}
      {lotLabelsToPrint && lotLabelsToPrint.length > 0 && (
        <div id={LOT_LABELS_PRINT_ID} className="hidden print:block">
          <div className="space-y-4 p-4">
            {lotLabelsToPrint.map((lot, i) => (
              <div
                key={`lot-${lot}-${i}`}
                className="flex min-h-[80px] items-center justify-center p-6"
                style={{ pageBreakAfter: i < lotLabelsToPrint.length - 1 ? 'always' : 'auto' }}
              >
                <span className="text-center text-3xl font-bold break-words">{lot}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
