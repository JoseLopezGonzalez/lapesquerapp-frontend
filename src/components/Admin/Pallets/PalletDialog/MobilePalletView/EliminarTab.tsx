'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { ArrowLeft, ScanSearch, Trash2, TriangleAlert } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';
import type { PalletBox, PalletState } from '@/hooks/pallets/palletHelpers';

const QrScannerWidget = dynamic(
  () => import('@/components/Shared/QrScannerWidget').then((m) => ({ default: m.QrScannerWidget })),
  { ssr: false }
);

interface EliminarTabProps {
  temporalPallet: PalletState;
  onDeleteBox: (boxId: number | string) => void;
  onDeleteAllBoxes: () => void;
  onDeleteScannedCode: (code: string) => void;
  isReadOnly: boolean;
  onBack?: () => void;
}

export default function EliminarTab({
  temporalPallet,
  onDeleteBox,
  onDeleteAllBoxes,
  onDeleteScannedCode,
  isReadOnly,
  onBack,
}: EliminarTabProps) {
  const [scannerOpen, setScannerOpen] = useState(false);

  const boxes: PalletBox[] = temporalPallet.boxes ?? [];

  const handleScannedCode = (rawValue: string) => {
    const code = String(rawValue ?? '').trim();
    if (!code) return;
    onDeleteScannedCode(code);
  };

  if (isReadOnly) {
    return (
      <div className="flex h-full flex-col">
        {onBack && (
          <div className="flex shrink-0 items-center gap-2 border-b px-3 py-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-base font-semibold">Eliminar cajas</h2>
          </div>
        )}
        <p className="py-10 text-center text-sm text-muted-foreground">
          Este palet es de solo lectura.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {onBack && (
        <div className="flex shrink-0 items-center gap-2 border-b px-3 py-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-base font-semibold">Eliminar cajas</h2>
        </div>
      )}
    <div className="flex flex-col gap-4 overflow-auto px-3 py-4 pb-4">
      {/* Scan to delete */}
      <Button
        size="lg"
        variant="outline"
        className="h-16 w-full border-destructive/40 text-base text-destructive hover:bg-destructive/5 hover:text-destructive"
        onClick={() => setScannerOpen(true)}
        disabled={boxes.length === 0}
      >
        <ScanSearch className="mr-3 h-6 w-6" />
        Escanear para eliminar
      </Button>

      {/* Delete all */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="destructive"
            className="w-full"
            disabled={boxes.length === 0}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar todas las cajas
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mx-auto mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <TriangleAlert className="h-6 w-6 text-destructive" />
            </div>
            <AlertDialogTitle>¿Eliminar todas las cajas?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán las {boxes.length} caja{boxes.length !== 1 ? 's' : ''} del palet. Esta
              acción no se puede deshacer una vez guardado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={onDeleteAllBoxes}
            >
              Eliminar todas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Box list */}
      {boxes.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No hay cajas en este palet.
        </p>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {boxes.length} caja{boxes.length !== 1 ? 's' : ''} en el palet
          </p>
          <ul className="divide-y overflow-hidden rounded-lg border">
            {[...boxes].reverse().map((box) => (
              <li key={box.id} className="flex items-center gap-3 px-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {(box.product as { name?: string } | null)?.name ?? '—'}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {box.lot ? `Lote: ${box.lot} · ` : ''}
                    {formatDecimalWeight(box.netWeight)} kg
                  </p>
                </div>
                {box.isAvailable !== false ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => onDeleteBox(box.id)}
                    aria-label="Eliminar caja"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : (
                  <span className="shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-700">
                    Producción
                  </span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Camera scanner */}
      {scannerOpen && (
        <QrScannerWidget
          onScan={handleScannedCode}
          onClose={() => setScannerOpen(false)}
          onError={() => setScannerOpen(false)}
          statusText="Apunta al código GS1-128 de la caja a eliminar"
          successText="Código leído"
        />
      )}
    </div>
    </div>
  );
}
