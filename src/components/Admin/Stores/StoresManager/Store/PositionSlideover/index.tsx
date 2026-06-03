'use client';

import { useState } from 'react';
import { Layers, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import PalletCard from './PalletCard';
import { PalletCardStack } from '../PalletCardStack';

interface PositionSlideoverProps {
  onClose?: () => void;
  position?: string;
}

export default function PositionSlideover({ onClose, position = 'A5' }: PositionSlideoverProps) {
  const [flippedId, setFlippedId] = useState<string | number | null>(null);
  const isMobile = useIsMobile();

  const {
    isOpenPositionSlideover,
    closePositionSlideover,
    selectedPosition,
    getPositionPallets,
    openAddElementToPosition,
    getPosition,
  } = useStoreContext();

  const pallets = getPositionPallets(selectedPosition) as Array<{
    id: string | number;
    lots: string[];
    [key: string]: unknown;
  }>;
  const positionData = getPosition(selectedPosition);

  const handleOnClickAddElement = () => {
    openAddElementToPosition(selectedPosition);
  };

  return (
    <Sheet open={isOpenPositionSlideover} onOpenChange={closePositionSlideover}>
      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        className={
          isMobile
            ? 'max-h-[85vh] overflow-y-auto rounded-t-2xl'
            : 'flex h-full w-[900px] min-w-[430px] flex-col'
        }
      >
        <SheetHeader>
          <SheetTitle>Posición {positionData?.nombre || 'Desconocida'}</SheetTitle>
          <SheetDescription>Detalles de la posición seleccionada</SheetDescription>
        </SheetHeader>

        <div className={isMobile ? 'px-4' : ''}>
          <Button
            className="flex w-full items-center justify-center gap-2"
            onClick={handleOnClickAddElement}
          >
            <Plus className="h-4 w-4" />
            Agregar nuevo elemento
          </Button>
        </div>

        {pallets.length === 0 ? (
          <div className="py-4">
            <Card className="bg-muted/30 mx-4 flex flex-col items-center justify-center border-dashed p-6 text-center">
              <Layers className="text-muted-foreground mb-3 h-10 w-10" />
              <h3 className="mb-1 text-lg font-medium">No hay elementos</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                No hay elementos ubicados en esta posición.
              </p>
              <Button className="flex items-center gap-2" onClick={handleOnClickAddElement}>
                <Plus className="h-4 w-4" />
                Agregar elemento
              </Button>
            </Card>
          </div>
        ) : (
          <>
            {/* Mobile: horizontal swipe — CSS hidden on md+ (no JS timing dependency) */}
            <div className="py-4 md:hidden">
              <PalletCardStack>
                {pallets.map((pallet) => (
                  <PalletCard
                    key={pallet.id}
                    pallet={pallet}
                    isFlipped={flippedId === pallet.id}
                    onFlip={(f) => setFlippedId(f ? pallet.id : null)}
                  />
                ))}
              </PalletCardStack>
            </div>

            {/* Desktop: vertical scroll — CSS hidden below md */}
            <div className="hidden min-h-0 flex-1 overflow-y-auto px-2 py-4 md:block">
              <div className="space-y-4">
                {pallets.map((pallet) => (
                  <PalletCard
                    key={pallet.id}
                    pallet={pallet}
                    isFlipped={flippedId === pallet.id}
                    onFlip={(f) => setFlippedId(f ? pallet.id : null)}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
