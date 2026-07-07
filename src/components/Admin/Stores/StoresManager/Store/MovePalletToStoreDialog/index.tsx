'use client';

import { useState, type ChangeEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from 'next-auth/react';
import { Warehouse, Check, Search, X, Loader2 } from 'lucide-react';
import { movePalletToStore } from '@/services/palletService';
import { useStoreContext } from '@/context/StoreContext';
import { notify } from '@/lib/notifications';
import { useStoresOptions } from '@/hooks/useStoresOptions';

export default function MovePalletToStoreDialog() {
  const {
    closeMovePalletToStoreDialog,
    movePalletToStoreDialogData: palletId,
    isOpenMovePalletToStoreDialog: isOpen,
    updateStoreWhenOnMovePalletToStore,
  } = useStoreContext();

  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStoreValue, setSelectedStoreValue] = useState<string | number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { storeOptions, loading } = useStoresOptions();

  const filteredStores = storeOptions.filter((store: { label?: string }) =>
    store.label?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetAndClose = () => {
    setSelectedStoreValue(null);
    setSearchQuery('');
    closeMovePalletToStoreDialog();
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetAndClose();
    }
  };

  const handleSubmit = async () => {
    if (!palletId) return;
    if (!selectedStoreValue) {
      notify.error({
        title: 'Almacén de destino requerido',
        description: 'Seleccione un almacén para mover el palet.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await movePalletToStore(palletId, selectedStoreValue, token ?? '');
      notify.success({
        title: 'Palet movido',
        description: 'El palet se ha movido correctamente al almacén seleccionado.',
      });
      updateStoreWhenOnMovePalletToStore({ palletId, storeId: selectedStoreValue });
      resetAndClose();
    } catch {
      notify.error({
        title: 'Error al mover palet',
        description: 'No se pudo mover el palet. Intente de nuevo.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStoreClick = (value: string | number) => {
    setSelectedStoreValue((prev) => (prev === value ? null : value));
  };

  if (!isOpen) return null;

  if (!palletId) {
    console.error('No se proporcionó un ID de pallet válido');
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        size="lg"
        className="flex max-h-[85vh] flex-col max-sm:top-0 max-sm:left-0 max-sm:h-dvh max-sm:max-h-dvh max-sm:w-full max-sm:max-w-full max-sm:translate-x-0 max-sm:translate-y-0 max-sm:overflow-y-auto max-sm:rounded-none"
      >
        <DialogHeader>
          <DialogTitle>Traspaso de almacén - Palet #{palletId}</DialogTitle>
        </DialogHeader>

        {/* Buscador */}
        <div className="relative my-2">
          <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
          <Input
            placeholder="Buscar almacén..."
            className="pl-9"
            value={searchQuery}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1 right-1 h-7 w-7"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Limpiar búsqueda</span>
            </Button>
          )}
        </div>

        {/* Lista de almacenes */}
        {loading ? (
          <div className="flex h-[50vh] w-full flex-col gap-2 pr-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-full rounded-md" />
            ))}
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="text-muted-foreground py-6 text-center text-sm">
            No se encontraron almacenes
          </div>
        ) : (
          <ScrollArea className="h-[45vh] w-full pr-3">
            <div className="flex h-full flex-col gap-2 py-1">
              {filteredStores.map((store: { value: string | number; label?: string }) => {
                const isSelected = selectedStoreValue === store.value;
                return (
                  <div
                    key={store.value}
                    className={`hover:bg-accent flex cursor-pointer items-center justify-between rounded-md border p-3 transition-colors ${isSelected ? 'border-primary bg-accent' : ''}`}
                    onClick={() => handleStoreClick(store.value)}
                  >
                    <div className="flex items-center space-x-2">
                      <Warehouse className="text-muted-foreground h-5 w-5" />
                      <span className="text-sm font-medium">{store.label}</span>
                    </div>
                    {isSelected && <Check className="text-primary h-4 w-4" />}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        <DialogFooter className="mt-4">
          <Button onClick={handleSubmit} disabled={!selectedStoreValue || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Moviendo...
              </>
            ) : (
              'Confirmar traslado'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
