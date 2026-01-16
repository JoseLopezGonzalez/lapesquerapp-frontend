"use client"

import { useStoreContext } from '@/context/StoreContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import PalletCard from '../PositionSlideover/PalletCard';
import { REGISTERED_PALLETS_STORE_ID } from '@/hooks/useStores';
import Masonry from 'react-masonry-css';
import { Package } from 'lucide-react';

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
                    <div className="flex flex-col items-center justify-center w-full h-full min-h-[400px]">
                        <div className="relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-xl opacity-70" />
                            <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-background border shadow-xs">
                                <Package className="h-6 w-6 text-primary" strokeWidth={1.5} />
                            </div>
                        </div>
                        <h2 className="mt-4 text-lg font-medium tracking-tight">No hay palets registrados</h2>
                        <p className="mt-2 text-center text-muted-foreground max-w-[300px] text-xs whitespace-normal">
                            Los palets en estado &quot;registered&quot; aparecerán aquí. Registra palets para verlos en esta vista.
                        </p>
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

