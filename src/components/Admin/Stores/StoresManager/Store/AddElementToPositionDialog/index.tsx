'use client';

import { notify } from '@/lib/notifications';
import { useState, type ChangeEvent } from 'react';
import { Layers, Search, X, Check, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStoreContext } from '@/context/StoreContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { assignPalletsToPosition } from '@/services/palletService';
import { useSession } from 'next-auth/react';
import {
  getAvailableBoxes,
  getAvailableBoxesCount,
  getAvailableNetWeight,
} from '@/helpers/pallet/boxAvailability';

interface Pallet {
  id: string | number;
  position?: string | null;
  products?: { name?: string }[];
  lotNumbers?: string[];
  location?: string;
  boxes?: {
    product?: { id: string | number; name: string };
    netWeight?: string | number;
    lot?: string;
  }[];
}

interface PalletInfo {
  productsSummaryArray: { name: string; netWeight: number; boxCount: number }[];
  availableBoxCount: number;
  availableNetWeight: number;
  hasMultipleProducts: boolean;
}

export default function AddElementToPosition({ open }: { open: boolean }) {
  const {
    addElementToPositionDialogData,
    closeAddElementToPosition,
    pallets,
    changePalletsPosition,
  } = useStoreContext();

  const position = addElementToPositionDialogData;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPalletIds, setSelectedPalletIds] = useState<(string | number)[]>([]);
  const [activeTab, setActiveTab] = useState('unlocated');
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  const onSubmit = () => {
    if (position === null) return;
    assignPalletsToPosition(String(position), selectedPalletIds.map(Number), token ?? '')
      .then(() => {
        notify.success({ title: 'Pallets ubicados correctamente' });
        setSelectedPalletIds([]);
        setSearchQuery('');
        changePalletsPosition(selectedPalletIds, position);
        closeAddElementToPosition();
      })
      .catch((error: unknown) => {
        console.error('Error al ubicar los pallets:', error);
        notify.error({ title: 'Error al ubicar los pallets' });
      });
  };

  const handleOnClose = () => {
    setSelectedPalletIds([]);
    setSearchQuery('');
    closeAddElementToPosition();
  };

  const handleSubmit = () => {
    if (selectedPalletIds.length <= 0) {
      notify.error({ title: 'Debe seleccionar al menos un pallet para ubicar' });
      return;
    }
    onSubmit();
  };

  const togglePalletSelection = (palletId: string | number) => {
    setSelectedPalletIds((prev) =>
      prev.includes(palletId) ? prev.filter((id) => id !== palletId) : [...prev, palletId]
    );
  };

  const filteredPallets = (pallets as Pallet[]).filter((pallet) => {
    if (activeTab === 'unlocated' && pallet.position) {
      return false;
    }
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    if (String(pallet.id).toLowerCase().includes(query)) return true;
    if (
      Array.isArray(pallet.products) &&
      pallet.products.some((product) =>
        String(product.name || '')
          .toLowerCase()
          .includes(query)
      )
    )
      return true;
    if (
      Array.isArray(pallet.lotNumbers) &&
      pallet.lotNumbers.some((lot) =>
        String(lot || '')
          .toLowerCase()
          .includes(query)
      )
    )
      return true;
    if (pallet.location && String(pallet.location).toLowerCase().includes(query)) return true;
    if (
      Array.isArray(pallet.boxes) &&
      pallet.boxes.some((box) =>
        String(box.product?.name || '')
          .toLowerCase()
          .includes(query)
      )
    )
      return true;
    if (
      Array.isArray(pallet.boxes) &&
      pallet.boxes.some((box) =>
        String(box.lot || '')
          .toLowerCase()
          .includes(query)
      )
    )
      return true;
    return false;
  });

  return (
    <Dialog open={open} onOpenChange={handleOnClose}>
      <DialogContent
        size="lg"
        className="flex max-h-[90vh] flex-col max-sm:top-0 max-sm:left-0 max-sm:h-dvh max-sm:max-h-dvh max-sm:w-full max-sm:max-w-full max-sm:translate-x-0 max-sm:translate-y-0 max-sm:overflow-y-auto max-sm:rounded-none"
      >
        <DialogHeader>
          <DialogTitle>Seleccionar pallets para posición {position}</DialogTitle>
          <DialogDescription>
            Seleccione uno o varios pallets de la lista para ubicarlos en esta posición.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          defaultValue="unlocated"
          className="w-full"
          onValueChange={(value: string) => {
            setActiveTab(value);
            setSelectedPalletIds([]);
          }}
        >
          <TabsList className="mb-4 grid w-full flex-1 grid-cols-2">
            <TabsTrigger value="unlocated">Pallets sin ubicar</TabsTrigger>
            <TabsTrigger value="all">Todos los pallets</TabsTrigger>
          </TabsList>

          <div className="relative my-2">
            <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
            <Input
              placeholder="Buscar por ID, producto o lote..."
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

          <TabsContent value="unlocated" className="m-0">
            <PalletList
              pallets={filteredPallets}
              selectedPalletIds={selectedPalletIds}
              togglePalletSelection={togglePalletSelection}
            />
          </TabsContent>

          <TabsContent value="all" className="m-0">
            <PalletList
              pallets={filteredPallets}
              selectedPalletIds={selectedPalletIds}
              togglePalletSelection={togglePalletSelection}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <div className="text-muted-foreground mr-auto flex items-center text-sm">
            {selectedPalletIds.length > 0 && (
              <>
                <Check className="text-primary mr-1 h-4 w-4" />
                {selectedPalletIds.length}{' '}
                {selectedPalletIds.length === 1 ? 'pallet seleccionado' : 'pallets seleccionados'}
              </>
            )}
          </div>

          <Button onClick={handleSubmit} disabled={selectedPalletIds.length === 0}>
            {selectedPalletIds.length === 1
              ? 'Ubicar pallet'
              : `Ubicar ${selectedPalletIds.length} pallets`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PalletList({
  pallets,
  selectedPalletIds,
  togglePalletSelection,
}: {
  pallets: Pallet[];
  selectedPalletIds: (string | number)[];
  togglePalletSelection: (id: string | number) => void;
}) {
  return (
    <ScrollArea className="h-[50vh] py-3 pr-4">
      <div className="flex flex-col gap-3 py-1">
        {pallets.length > 0 ? (
          pallets.map((pallet) => {
            const isSelected = selectedPalletIds.includes(pallet.id);
            const availableBoxes = getAvailableBoxes(pallet.boxes || []);
            const availableBoxCount = getAvailableBoxesCount(pallet);
            const availableNetWeight = getAvailableNetWeight(pallet);

            const productsSummary = (
              availableBoxes as {
                product: { id: string | number; name: string };
                netWeight: string | number;
              }[]
            ).reduce(
              (
                acc: Record<string | number, { name: string; netWeight: number; boxCount: number }>,
                box
              ) => {
                const product = box.product;
                if (!acc[product.id]) {
                  acc[product.id] = {
                    name: product.name,
                    netWeight: 0,
                    boxCount: 0,
                  };
                }
                acc[product.id].netWeight += Number(box.netWeight);
                acc[product.id].boxCount += 1;
                return acc;
              },
              {}
            );
            const productsSummaryArray = Object.values(productsSummary);
            const hasMultipleProducts = productsSummaryArray.length > 1;

            return (
              <div
                key={pallet.id}
                className={cn(
                  'hover:bg-accent flex cursor-pointer items-start space-x-3 rounded-md border p-3 transition-colors',
                  isSelected && 'border-primary bg-accent'
                )}
                onClick={() => togglePalletSelection(pallet.id)}
              >
                <div className="mt-1 flex h-5 w-5 items-center justify-center">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => togglePalletSelection(pallet.id)}
                    id={`pallet-${pallet.id}`}
                    className="pointer-events-none"
                  />
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Layers className="text-muted-foreground mr-2 h-4 w-4" />
                      <span className="font-medium">Pallet #{pallet.id}</span>
                      {hasMultipleProducts && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          {productsSummaryArray.length} productos
                        </Badge>
                      )}
                    </div>

                    {pallet.position && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {pallet.position}
                      </Badge>
                    )}
                  </div>

                  <div className="mt-1 text-sm">
                    {productsSummaryArray.map((product, index) => (
                      <div key={index} className="line-clamp-1">
                        {product.name}
                        {product.netWeight > 0 && ` (${product.netWeight.toFixed(1)} kg)`}
                        {product.boxCount > 0 &&
                          ` - ${product.boxCount} ${product.boxCount === 1 ? 'caja' : 'cajas'}`}
                      </div>
                    ))}
                  </div>

                  <div className="text-muted-foreground mt-1.5 flex items-center text-xs">
                    <span>Total: {(availableNetWeight as number).toFixed(1)} kg</span>
                    <span className="mx-1.5">|</span>
                    <span>
                      {availableBoxCount} {availableBoxCount === 1 ? 'caja' : 'cajas'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-muted-foreground py-6 text-center">
            No se encontraron pallets que coincidan con la búsqueda
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
