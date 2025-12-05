"use client"

import { useStoreContext } from '@/context/StoreContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import PalletCard from '../PositionSlideover/PalletCard';
import { REGISTERED_PALLETS_STORE_ID } from '@/hooks/useStores';

export default function PalletKanbanView() {
    const { store, pallets } = useStoreContext();

    // Verificar si es el almacén fantasma
    const isGhostStore = store?.id === REGISTERED_PALLETS_STORE_ID;

    if (!isGhostStore) {
        return null;
    }

    // Obtener todos los palets del almacén fantasma
    const allPallets = pallets || store?.content?.pallets || [];

    return (
        <ScrollArea className="w-full h-full p-4">
            {allPallets.length === 0 ? (
                <div className="flex items-center justify-center h-full min-h-[400px]">
                    <div className="text-center text-muted-foreground">
                        <p className="text-lg">No hay palets registrados</p>
                        <p className="text-sm mt-2">Los palets en estado &quot;registered&quot; aparecerán aquí</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {allPallets.map((pallet) => (
                        <PalletCard key={pallet.id} pallet={pallet} />
                    ))}
                </div>
            )}
        </ScrollArea>
    );
}

