'use client';

import { Layers } from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useStoreContext } from '@/context/StoreContext';
import { useIsMobile } from '@/hooks/use-mobile';
import PalletCard from '../PositionSlideover/PalletCard';

export default function UnallocatedPositionSlideover() {
  const isMobile = useIsMobile();

  const {
    isOpenUnallocatedPositionSlideover,
    closeUnallocatedPositionSlideover,
    unlocatedPallets,
  } = useStoreContext();

  const pallets = unlocatedPallets as Array<{
    id: string | number;
    lots: string[];
    [key: string]: unknown;
  }>;

  return (
    <Sheet
      open={isOpenUnallocatedPositionSlideover}
      onOpenChange={closeUnallocatedPositionSlideover}
    >
      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        className={
          isMobile
            ? 'flex max-h-[85vh] flex-col rounded-t-2xl'
            : 'flex h-full w-[900px] min-w-[430px] flex-col'
        }
      >
        <SheetHeader>
          <SheetTitle>Elementos sin ubicar</SheetTitle>
          <SheetDescription>Palés pendientes de asignar a una posición</SheetDescription>
        </SheetHeader>

        {pallets.length === 0 ? (
          <div className="py-4">
            <Card className="bg-muted/30 mx-4 flex flex-col items-center justify-center border-dashed p-6 text-center">
              <Layers className="text-muted-foreground mb-3 h-10 w-10" />
              <h3 className="mb-1 text-lg font-medium">No hay elementos</h3>
              <p className="text-muted-foreground text-sm">
                No hay palés pendientes de ubicar en este almacén.
              </p>
            </Card>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-4">
              {pallets.map((pallet) => (
                <PalletCard key={pallet.id} pallet={pallet} />
              ))}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
