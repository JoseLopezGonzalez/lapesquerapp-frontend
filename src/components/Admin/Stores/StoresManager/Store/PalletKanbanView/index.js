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
    // Para el almacén fantasma, siempre mostrar todos los palets sin filtrar
    const allPallets = store?.content?.pallets || [];

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
                <div className="columns-1 sm:columns-1 md:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 gap-4 space-y-4">
                    {allPallets.map((pallet) => (
                        <div key={pallet.id} className="break-inside-avoid mb-4">
                            <PalletCard pallet={pallet} />
                        </div>
                    ))}
                </div>
            )}
        </ScrollArea>
    );
}

