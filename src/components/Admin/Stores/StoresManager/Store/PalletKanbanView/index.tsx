'use client';

import { useStoreContext } from '@/context/StoreContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import PalletCard from '../PositionSlideover/PalletCard';
import { REGISTERED_PALLETS_STORE_ID } from '@/hooks/useStores';
import Masonry from 'react-masonry-css';
import { Package } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const breakpointColumnsObj = {
  default: 3,
  1920: 3,
  1536: 3,
  1280: 2,
  768: 2,
  640: 1,
};

export default function PalletKanbanView() {
  const { store } = useStoreContext();
  const isMobile = useIsMobile();

  const isGhostStore = store?.id === REGISTERED_PALLETS_STORE_ID;

  if (!isGhostStore) return null;

  const allPallets = (store?.content?.pallets || []) as Array<{
    id: string | number;
    lots: string[];
    [key: string]: unknown;
  }>;

  if (allPallets.length === 0) {
    return (
      <div className="flex h-full min-h-[400px] w-full flex-col items-center justify-center">
        <div className="relative">
          <div className="from-primary/20 to-secondary/20 absolute -inset-1 rounded-full bg-gradient-to-r opacity-70 blur-xl" />
          <div className="bg-background relative flex h-14 w-14 items-center justify-center rounded-full border shadow-xs">
            <Package className="text-primary h-6 w-6" strokeWidth={1.5} />
          </div>
        </div>
        <h2 className="mt-4 text-lg font-medium tracking-tight">No hay palets registrados</h2>
        <p className="text-muted-foreground mt-2 max-w-[300px] text-center text-xs whitespace-normal">
          Los palets en estado &quot;registered&quot; aparecerán aquí.
        </p>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="h-full overflow-y-auto px-4 py-4">
        <div className="space-y-4">
          {allPallets.map((pallet) => (
            <PalletCard key={pallet.id} pallet={pallet} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full w-full">
      <div className="p-4">
        <Masonry
          breakpointCols={breakpointColumnsObj}
          className="masonry-grid"
          columnClassName="masonry-grid_column"
        >
          {allPallets.map((pallet) => (
            <div key={pallet.id} className="mb-4">
              <PalletCard pallet={pallet} />
            </div>
          ))}
        </Masonry>
      </div>
    </ScrollArea>
  );
}
