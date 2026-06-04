'use client';

import { useEffect } from 'react';
import { PALLET_LABEL_SIZE } from '@/configs/config';

import { AlertTriangle, CloudAlert, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { usePrintElement } from '@/hooks/usePrintElement';
import { useIsMobile } from '@/hooks/use-mobile';

import PalletLabel from '@/components/Admin/Pallets/PalletLabel';

interface PalletLabelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pallet: unknown;
}

export default function PalletLabelDialog({ isOpen, onClose, pallet }: PalletLabelDialogProps) {
  const labelWidth = parseInt(PALLET_LABEL_SIZE.width) || 110;
  const labelHeight = parseInt(PALLET_LABEL_SIZE.height) || 150;
  const { onPrint } = usePrintElement({
    id: 'print-area-id',
    width: labelWidth,
    height: labelHeight,
  });
  const isMobile = useIsMobile();

  // En mobile: saltar el dialog y disparar la impresión directamente
  useEffect(() => {
    if (!isMobile || !isOpen || !pallet) return;
    const timeout = setTimeout(() => {
      onPrint();
      onClose();
    }, 150);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, isOpen, pallet]);

  // En mobile con pallet cargado: renderizar etiqueta oculta para que onPrint pueda copiarla
  if (isMobile) {
    if (!isOpen || !pallet) return null;
    return (
      <div
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', top: 0 }}
      >
        <div
          id="print-area-id"
          className="text-black"
          style={{ width: PALLET_LABEL_SIZE.width, height: PALLET_LABEL_SIZE.height }}
        >
          <PalletLabel pallet={pallet} />
        </div>
      </div>
    );
  }

  // Desktop: dialog normal
  const maxDialogWidth = Math.max(512, labelWidth * 3.779 + 200);

  const mobileFullScreen =
    'max-sm:top-0 max-sm:left-0 max-sm:h-dvh max-sm:max-h-dvh max-sm:w-full max-sm:max-w-full max-sm:translate-x-0 max-sm:translate-y-0 max-sm:overflow-y-auto max-sm:rounded-none';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {!pallet ? (
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
              Por favor, revisa tu conexión o inténtalo nuevamente más tarde.
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
            <DialogTitle>
              {(pallet as { id?: string | number })?.id
                ? `Etiqueta - Palet #${(pallet as { id?: string | number }).id}`
                : 'Nuevo Palet'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex w-full flex-col justify-center">
            <Alert variant="destructive" className="w-full max-w-md">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="text-sm">Etiqueta con espacio limitado</AlertTitle>
              <AlertDescription className="text-sm">
                Productos o lotes podrían no mostrarse completamente.
              </AlertDescription>
            </Alert>
            <div className="mt-4 flex w-full flex-col items-center gap-4 overflow-x-auto">
              <div className="flex-shrink-0">
                <div
                  id="print-area-id"
                  className="text-black"
                  style={{ width: PALLET_LABEL_SIZE.width, height: PALLET_LABEL_SIZE.height }}
                >
                  <PalletLabel pallet={pallet} />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-3 border-t pt-4">
            <Button onClick={onPrint}>
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
