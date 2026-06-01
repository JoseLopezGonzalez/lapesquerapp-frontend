'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Loader2 } from 'lucide-react';
import { rawMaterialReceptionService } from '@/services/domain/raw-material-receptions/rawMaterialReceptionService';
import { usePrintElement } from '@/hooks/usePrintElement';
import { notify } from '@/lib/notifications';

/**
 * Diálogo para imprimir letreros: solo nombre del producto, sin fecha.
 * Un letrero por línea de la recepción (nombre del producto en grande).
 */
export function ProductLabelsPrintDialog({ receptionId, isOpen, onClose }) {
  const [reception, setReception] = useState(null);
  const [loading, setLoading] = useState(false);

  const { onPrint } = usePrintElement({
    id: 'product-labels-print-content',
    freeSize: true,
  });

  const productNames = useMemo(() => {
    if (!reception?.details?.length) return [];
    return reception.details
      .filter((d) => d.product)
      .map((d) => d.productName || d.product?.name || d.product?.alias || 'Producto');
  }, [reception]);

  useEffect(() => {
    if (!isOpen || !receptionId) {
      setReception(null);
      return;
    }
    setLoading(true);
    rawMaterialReceptionService
      .getById(receptionId)
      .then((data) => {
        const details = (data.details || []).map((d) => ({
          ...d,
          productName: d.product?.name ?? d.product?.alias ?? 'Producto',
        }));
        setReception({ ...data, details });
      })
      .catch((err) => {
        console.error('Error al cargar recepción para letreros:', err);
        notify.error({
          title: 'Error al cargar datos',
          description: 'No se pudo cargar la recepción para imprimir letreros.',
        });
        onClose();
      })
      .finally(() => setLoading(false));
  }, [isOpen, receptionId, onClose]);

  const handlePrint = () => {
    onPrint();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Imprimir letreros</DialogTitle>
          <DialogDescription>
            Se imprimirá un letrero por producto con el nombre en grande (sin fecha).
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
            </div>
          ) : productNames.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              No hay productos en esta recepción.
            </p>
          ) : (
            <>
              <p className="text-muted-foreground text-sm">
                Vista previa ({productNames.length} letrero{productNames.length !== 1 ? 's' : ''}):
              </p>
              <div className="flex max-h-[280px] flex-wrap gap-3 overflow-y-auto">
                {productNames.map((name, i) => (
                  <div
                    key={`${name}-${i}`}
                    className="bg-muted/30 min-w-[140px] rounded-lg border p-4 text-center"
                  >
                    <span className="text-lg font-semibold break-words">{name}</span>
                  </div>
                ))}
              </div>
              <Button className="w-full gap-2" onClick={handlePrint}>
                <Printer className="h-4 w-4" />
                Imprimir letreros
              </Button>
            </>
          )}
        </div>
        {/* Contenido oculto para impresión: un bloque por letrero, nombre grande sin fecha */}
        <div id="product-labels-print-content" className="hidden print:block">
          <div className="space-y-4 p-4">
            {productNames.map((name, i) => (
              <div
                key={`print-${i}`}
                className="flex min-h-[80px] items-center justify-center rounded-lg border border-black p-6"
                style={{ pageBreakAfter: i < productNames.length - 1 ? 'always' : 'auto' }}
              >
                <span className="text-center text-3xl font-bold break-words">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
