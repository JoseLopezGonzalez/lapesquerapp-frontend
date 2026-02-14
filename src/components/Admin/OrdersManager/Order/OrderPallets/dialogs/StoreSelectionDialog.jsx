'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/Shadcn/Combobox';
import { Warehouse } from 'lucide-react';

export default function StoreSelectionDialog({
  open,
  onOpenChange,
  storeOptions,
  selectedStoreId,
  onStoreSelect,
  loading,
  isMobile,
}) {
  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={isMobile ? "max-w-full w-full h-full max-h-full m-0 rounded-none flex flex-col" : "sm:max-w-md"}>
        <DialogHeader className={isMobile ? "text-center" : ""}>
          <DialogTitle className={`flex items-center gap-2 ${isMobile ? "justify-center" : ""}`}>
            <Warehouse className="h-5 w-5" />
            Seleccionar Almacén
          </DialogTitle>
        </DialogHeader>
        <div className={`space-y-4 ${isMobile ? "flex flex-col items-center justify-center flex-1" : ""}`}>
          <div className={`space-y-2 ${isMobile ? "w-full max-w-md" : ""}`}>
            <Label htmlFor="store-select" className={isMobile ? "text-center block" : ""}>Almacén donde se creará el palet</Label>
            <Combobox
              options={storeOptions}
              value={selectedStoreId || ''}
              onChange={(value) => {
                if (value) {
                  onStoreSelect(value);
                }
              }}
              placeholder="Selecciona un almacén"
              searchPlaceholder="Buscar almacén..."
              notFoundMessage="No se encontraron almacenes"
              loading={loading}
            />
          </div>
          <p className={`text-sm text-muted-foreground ${isMobile ? "text-center max-w-md" : ""}`}>
            El palet se creará en el almacén seleccionado y se vinculará automáticamente a este pedido.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
