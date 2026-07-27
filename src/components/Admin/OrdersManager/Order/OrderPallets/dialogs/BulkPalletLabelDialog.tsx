'use client';

import { useEffect, useRef } from 'react';
import { PALLET_LABEL_SIZE } from '@/configs/config';

import { CloudAlert, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

import { usePrintElement } from '@/hooks/usePrintElement';
import { useIsMobile } from '@/hooks/use-mobile';

import PalletLabel from '@/components/Admin/Pallets/PalletLabel';

interface BulkPalletLabelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pallets: unknown[];
}

interface MobileBulkPalletLabelPrintTriggerProps {
  isOpen: boolean;
  pallets: unknown[];
  onPrint: () => void;
  onClose: () => void;
}

// En mobile: saltar el dialog y disparar la impresión directamente al abrir, replicando el
// patrón de PalletLabelDialog (ver MobilePalletLabelPrintTrigger) pero para varios palets a la
// vez: cada palet se renderiza en su propia `.page` dentro del área de impresión para que
// usePrintElement aplique un salto de página por palet (ver `.page` en usePrintElement.js).
function MobileBulkPalletLabelPrintTrigger({
  isOpen,
  pallets,
  onPrint,
  onClose,
}: MobileBulkPalletLabelPrintTriggerProps) {
  const onPrintRef = useRef(onPrint);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onPrintRef.current = onPrint;
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen || pallets.length === 0) return;
    const timeout = setTimeout(() => {
      onPrintRef.current();
      onCloseRef.current();
    }, 150);
    return () => clearTimeout(timeout);
  }, [isOpen, pallets]);

  if (!isOpen || pallets.length === 0) return null;
  return (
    <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: 0 }}>
      <div id="print-area-id" className="text-black">
        {pallets.map((pallet) => (
          <div
            key={(pallet as { id: number | string }).id}
            className="page"
            style={{ width: PALLET_LABEL_SIZE.width, height: PALLET_LABEL_SIZE.height }}
          >
            <PalletLabel pallet={pallet} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BulkPalletLabelDialog({
  isOpen,
  onClose,
  pallets,
}: BulkPalletLabelDialogProps) {
  const labelWidth = parseInt(PALLET_LABEL_SIZE.width) || 110;
  const labelHeight = parseInt(PALLET_LABEL_SIZE.height) || 150;
  const { onPrint } = usePrintElement({
    id: 'print-area-id',
    width: labelWidth,
    height: labelHeight,
  });
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <MobileBulkPalletLabelPrintTrigger
        isOpen={isOpen}
        pallets={pallets}
        onPrint={onPrint}
        onClose={onClose}
      />
    );
  }

  const maxDialogWidth = Math.max(512, labelWidth * 3.779 + 200);

  const mobileFullScreen =
    'max-sm:top-0 max-sm:left-0 max-sm:h-dvh max-sm:max-h-dvh max-sm:w-full max-sm:max-w-full max-sm:translate-x-0 max-sm:translate-y-0 max-sm:overflow-y-auto max-sm:rounded-none';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {pallets.length === 0 ? (
        <DialogContent
          className={`flex w-full flex-col items-center justify-center gap-4 text-center ${mobileFullScreen}`}
        >
          <DialogHeader>
            <DialogTitle className="sr-only">Error</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center gap-2 py-10">
            <div className="mb-2 flex items-center justify-center rounded-full bg-red-100 p-5">
              <CloudAlert className="text-destructive h-12 w-12" />
            </div>
            <h2 className="text-destructive text-xl font-semibold">¡Vaya! Ocurrió un error</h2>
            <p className="text-muted-foreground max-w-xs text-sm">
              No hay palets seleccionados para imprimir.
            </p>
            <Button variant="destructive" className="mt-5 px-20" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      ) : (
        <DialogContent
          className={`max-h-[90vh] w-full overflow-hidden ${mobileFullScreen}`}
          style={{ maxWidth: `${maxDialogWidth}px` }}
        >
          <DialogHeader>
            <DialogTitle>Etiquetas — {pallets.length} palet(s) seleccionados</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh]">
            <div id="print-area-id" className="flex w-full flex-col items-center gap-4 py-2">
              {pallets.map((pallet) => (
                <div
                  key={(pallet as { id: number | string }).id}
                  className="page flex-shrink-0"
                  style={{ width: PALLET_LABEL_SIZE.width, height: PALLET_LABEL_SIZE.height }}
                >
                  <PalletLabel pallet={pallet} />
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="mt-4 flex justify-end gap-3 border-t pt-4">
            <Button onClick={onPrint}>
              <Printer className="h-4 w-4" />
              Imprimir ({pallets.length})
            </Button>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
