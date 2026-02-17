"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { usePrintElement } from '@/hooks/usePrintElement';
import ReceptionReciboPrintContent from './ReceptionReciboPrintContent';

export default function ReceptionPrintDialog({
  isOpen,
  onClose,
  receptionId,
  supplier,
  date,
  notes,
  details = [],
  pallets = [],
  creationMode = null,
}) {
  const { onPrint } = usePrintElement({
    id: 'reception-print-content',
    freeSize: true,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-2xl overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Imprimir Nota de Entrada</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col justify-center w-full flex-1 overflow-auto">
          <ReceptionReciboPrintContent
            receptionId={receptionId}
            supplier={supplier}
            date={date}
            notes={notes}
            details={details}
            pallets={pallets}
            creationMode={creationMode}
            className="p-6 border border-gray-200 rounded-lg print:bg-white"
          />
        </div>
        <div id="reception-print-content" className="hidden print:block">
          <ReceptionReciboPrintContent
            receptionId={receptionId}
            supplier={supplier}
            date={date}
            notes={notes}
            details={details}
            pallets={pallets}
            creationMode={creationMode}
          />
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button onClick={onPrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

