"use client"

import { useStoreContext } from '@/context/StoreContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import PalletCard from '../PositionSlideover/PalletCard';
import { REGISTERED_PALLETS_STORE_ID } from '@/hooks/useStores';
import Masonry from 'react-masonry-css';

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

    // Configuración de breakpoints para el masonry layout
    // Reducimos el número de columnas para que los cards sean más anchos
    const breakpointColumnsObj = {
        default: 3,
        1920: 3, // 2xl
        1536: 3, // xl
        1280: 2, // lg
        768: 2,  // md
        640: 1,  // sm
    };

    return (
        <ScrollArea className="w-full h-full">
            <div className="p-4">
                {allPallets.length === 0 ? (
                    <div className="flex items-center justify-center h-full min-h-[400px]">
                        <div className="text-center text-muted-foreground">
                            <p className="text-lg">No hay palets registrados</p>
                            <p className="text-sm mt-2">Los palets en estado &quot;registered&quot; aparecerán aquí</p>
                        </div>
                    </div>
                ) : (
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
                )}
            </div>
        </ScrollArea>
    );
}

