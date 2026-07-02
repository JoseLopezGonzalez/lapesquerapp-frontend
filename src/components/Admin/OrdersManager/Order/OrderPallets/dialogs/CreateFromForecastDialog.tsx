'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/Shadcn/Combobox';
import { PackagePlus, Loader2 } from 'lucide-react';

interface CreateFromForecastDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lot: string;
  setLot: (lot: string) => void;
  storeId: number | string | null;
  setStoreId: (storeId: number | string | null) => void;
  storeOptions: Array<{ value: number | string; label: string }>;
  storesLoading?: boolean;
  isCreating?: boolean;
  onCreate: () => void;
  onCancel: () => void;
  isMobile?: boolean;
}

export default function CreateFromForecastDialog({
  open,
  onOpenChange: _onOpenChange,
  lot,
  setLot,
  storeId,
  setStoreId,
  storeOptions,
  storesLoading,
  isCreating,
  onCreate,
  onCancel,
  isMobile,
}: CreateFromForecastDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent
        className={
          isMobile
            ? 'm-0 flex h-full max-h-full w-full max-w-full flex-col rounded-none'
            : 'sm:max-w-md'
        }
      >
        <DialogHeader className={isMobile ? 'text-center' : ''}>
          <DialogTitle className={`flex items-center gap-2 ${isMobile ? 'justify-center' : ''}`}>
            <PackagePlus className="h-5 w-5" />
            Crear palet desde previsión
          </DialogTitle>
        </DialogHeader>
        <div
          className={`space-y-4 ${isMobile ? 'flex flex-1 flex-col items-center justify-center' : ''}`}
        >
          <p className="text-muted-foreground text-sm">
            Se creará un palet con todas las cajas de la previsión del pedido. Introduce el lote y
            el almacén donde se almacenará.
          </p>
          <div className={`space-y-4 ${isMobile ? 'w-full max-w-md' : ''}`}>
            <div className="space-y-2">
              <Label htmlFor="create-from-forecast-lot">Lote</Label>
              <Input
                id="create-from-forecast-lot"
                type="text"
                placeholder="Ej. LOT-2025-001"
                value={lot}
                onChange={(e) => setLot(e.target.value)}
                disabled={isCreating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-from-forecast-store">Almacén</Label>
              <Combobox
                options={storeOptions}
                value={storeId || ''}
                onChange={(value) => setStoreId(value || null)}
                placeholder="Selecciona el almacén"
                searchPlaceholder="Buscar almacén..."
                notFoundMessage="No se encontraron almacenes"
                loading={storesLoading}
                disabled={isCreating}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isCreating}>
            Cancelar
          </Button>
          <Button onClick={onCreate} disabled={isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <PackagePlus />
                Crear palet
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
