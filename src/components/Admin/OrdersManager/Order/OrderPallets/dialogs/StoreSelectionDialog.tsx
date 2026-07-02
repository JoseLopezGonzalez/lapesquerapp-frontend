'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/Shadcn/Combobox';
import { Warehouse } from 'lucide-react';

interface StoreSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeOptions: Array<{ value: number | string; label: string }>;
  selectedStoreId?: number | string | null;
  onStoreSelect: (storeId: number | string) => void;
  loading?: boolean;
  isMobile?: boolean;
}

export default function StoreSelectionDialog({
  open,
  onOpenChange,
  storeOptions,
  selectedStoreId,
  onStoreSelect,
  loading,
  isMobile,
}: StoreSelectionDialogProps) {
  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={
          isMobile
            ? 'm-0 flex h-full max-h-full w-full max-w-full flex-col rounded-none'
            : 'sm:max-w-md'
        }
      >
        <DialogHeader className={isMobile ? 'text-center' : ''}>
          <DialogTitle className={`flex items-center gap-2 ${isMobile ? 'justify-center' : ''}`}>
            <Warehouse className="h-5 w-5" />
            Seleccionar Almacén
          </DialogTitle>
        </DialogHeader>
        <div
          className={`space-y-4 ${isMobile ? 'flex flex-1 flex-col items-center justify-center' : ''}`}
        >
          <div className={`space-y-2 ${isMobile ? 'w-full max-w-md' : ''}`}>
            <Label htmlFor="store-select" className={isMobile ? 'block text-center' : ''}>
              Almacén donde se creará el palet
            </Label>
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
          <p className={`text-muted-foreground text-sm ${isMobile ? 'max-w-md text-center' : ''}`}>
            El palet se creará en el almacén seleccionado y se vinculará automáticamente a este
            pedido.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
