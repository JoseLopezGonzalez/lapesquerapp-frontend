'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/Shadcn/Combobox';
import { PackagePlus, Loader2 } from 'lucide-react';

export default function CreateFromForecastDialog({
  open,
  onOpenChange,
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
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className={isMobile ? "max-w-full w-full h-full max-h-full m-0 rounded-none flex flex-col" : "sm:max-w-md"}>
        <DialogHeader className={isMobile ? "text-center" : ""}>
          <DialogTitle className={`flex items-center gap-2 ${isMobile ? "justify-center" : ""}`}>
            <PackagePlus className="h-5 w-5" />
            Crear palet desde previsión
          </DialogTitle>
        </DialogHeader>
        <div className={`space-y-4 ${isMobile ? "flex flex-col items-center justify-center flex-1" : ""}`}>
          <p className="text-sm text-muted-foreground">
            Se creará un palet con todas las cajas de la previsión del pedido. Introduce el lote y el almacén donde se almacenará.
          </p>
          <div className={`space-y-4 ${isMobile ? "w-full max-w-md" : ""}`}>
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
        <DialogFooter className={isMobile ? "flex-col gap-2" : ""}>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isCreating}
            className={isMobile ? "w-full" : ""}
          >
            Cancelar
          </Button>
          <Button
            onClick={onCreate}
            disabled={isCreating}
            className={isMobile ? "w-full" : ""}
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <PackagePlus className="h-4 w-4 mr-2" />
                Crear palet
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
