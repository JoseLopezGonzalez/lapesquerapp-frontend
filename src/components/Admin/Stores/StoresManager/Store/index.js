"use client"

import Map from './MapContainer/Map'
import MapContainer from './MapContainer'
import LoadingStoreDetails from '../LoadingStoreDetails';
import { StoreProvider, useStoreContext } from '@/context/StoreContext';
import { LocateFixed, Plus, ArrowRightLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Filters from './Filters';
import { Card } from '@/components/ui/card';
import PositionSlideover from './PositionSlideover';
import AddElementToPosition from './AddElementToPositionDialog';
import { useState } from 'react';
import UnallocatedPositionSlideover from './UnallocatedPositionSlideover';
import { UNLOCATED_POSITION_ID } from '@/configs/config';
import PalletKanbanView from './PalletKanbanView';
import { REGISTERED_PALLETS_STORE_ID } from '@/hooks/useStores';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import PalletLabelDialog from '../../../Pallets/PalletLabelDialog';
import MovePalletToStoreDialog from './MovePalletToStoreDialog';
import MoveMultiplePalletsToStoreDialog from './MoveMultiplePalletsToStoreDialog';
import PalletDialog from '@/components/Admin/Pallets/PalletDialog';


export const StoreContent = ({ passedStoreId, passedStoreName }) => {

    const { loading, error, isOpenAddElementToPositionDialog,
        isOpenPalletDialog,
        openUnallocatedPositionSlideover,
        isPositionRelevant,
        isPositionFilled,
        palletDialogData,
        updateStoreWhenOnChangePallet,
        openCreatePalletDialog,
        store,
        isOpenPalletLabelDialog, closePalletLabelDialog, palletLabelDialogData,
        closePalletDialog,
        openMoveMultiplePalletsToStoreDialog
    } = useStoreContext();

    const storeId = store?.id || passedStoreId;
    // Detectar almacén fantasma por ID o por nombre (verificar tanto el storeId del contexto como el pasado como prop)
    const isGhostStore = storeId === REGISTERED_PALLETS_STORE_ID || 
                         store?.id === REGISTERED_PALLETS_STORE_ID ||
                         passedStoreId === REGISTERED_PALLETS_STORE_ID ||
                         store?.name === "En espera";

    const handleOnClickUnallocatedPosition = () => {
        // console.log("Unallocated positions clicked");
        openUnallocatedPositionSlideover();
    }

    const handleOnClickCreatePallet = () => {
        openCreatePalletDialog();
    }

    // Usar el nombre pasado como prop (del store seleccionado) o el del contexto si ya está cargado
    const displayStoreName = passedStoreName || store?.name;

    if (loading) {
        return (
            <LoadingStoreDetails storeName={displayStoreName} />
        )
    }

    // Si es el almacén fantasma, mostrar vista kanban (sin mapa ni botones)
    if (isGhostStore) {
        return (
            <>
                <div className='flex items-center justify-center w-full h-full gap-4'>
                    {/* Vista Kanban para almacén fantasma - Solo ScrollArea con cards */}
                    <Card className='relative flex-1 flex items-center justify-center w-full h-full overflow-hidden'>
                        <PalletKanbanView />
                        <div className="absolute bottom-4 right-4 z-10">
                            <Button 
                                variant="outline"
                                onClick={openMoveMultiplePalletsToStoreDialog}
                                disabled={!store?.content?.pallets || store.content.pallets.length === 0}
                            >
                                <ArrowRightLeft size={24} />
                                Traspaso masivo
                            </Button>
                        </div>
                    </Card>

                    {/* Filtros a la derecha */}
                    <div className='max-w-[350px] w-full h-full overflow-hidden'>
                        <Filters />
                    </div>
                </div>

                {/* Diálogos necesarios */}
                <PalletDialog isOpen={isOpenPalletDialog} palletId={palletDialogData} onChange={updateStoreWhenOnChangePallet} initialStoreId={storeId} onCloseDialog={closePalletDialog} />
                <PalletLabelDialog isOpen={isOpenPalletLabelDialog} onClose={closePalletLabelDialog} pallet={palletLabelDialogData} />
                <MovePalletToStoreDialog />
                <MoveMultiplePalletsToStoreDialog />
            </>
        );
    }

    const isUnallocatedPositionRelevant = isPositionRelevant(UNLOCATED_POSITION_ID);
    const isUnallocatedPositionFilled = isPositionFilled(UNLOCATED_POSITION_ID)

    const fondoClasses = isUnallocatedPositionRelevant ?
        'bg-green-500 hover:bg-green-400 '
        : isUnallocatedPositionFilled
            ? 'bg-primary/75 hover:bg-primary/90 text-background'
            : 'bg-foreground-300 hover:bg-foreground-400';

    return (
        <>
            <div className='flex items-center justify-center w-full h-full gap-4 '>

                {/* Map */}
                <Card className=' relative flex-1 flex items-center justify-center w-full h-full overflow-auto'>
                    <MapContainer>
                        <Map onClickPosition={() => {}} isPositionEmpty={() => {}} />
                    </MapContainer>
                    <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
                        <Button variant="secondary"
                            className={`flex items-center gap-2 ${fondoClasses} `}
                            onClick={handleOnClickUnallocatedPosition}
                        >
                            <LocateFixed size={24} />
                            Elementos sin ubicar
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                    <Plus size={24} />
                                    Nuevo
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="start">
                                <DropdownMenuLabel>Crear elementos</DropdownMenuLabel>
                                <DropdownMenuGroup>
                                    <DropdownMenuItem onClick={handleOnClickCreatePallet}>
                                        Palet
                                        <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        Tinas
                                        <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        Cajas
                                        <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                                    </DropdownMenuItem>

                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button 
                            variant="outline"
                            onClick={openMoveMultiplePalletsToStoreDialog}
                            disabled={!store?.content?.pallets || store.content.pallets.length === 0}
                        >
                            <ArrowRightLeft size={24} />
                            Traspaso masivo
                        </Button>
                    </div>
                </Card >

                <div className='max-w-[350px] w-full h-full overflow-hidden'>
                    <Filters />
                </div>

                <PositionSlideover />

                <UnallocatedPositionSlideover />

                <AddElementToPosition open={isOpenAddElementToPositionDialog} />

                <PalletDialog isOpen={isOpenPalletDialog} palletId={palletDialogData} onChange={updateStoreWhenOnChangePallet} initialStoreId={storeId} onCloseDialog={closePalletDialog} />

                <PalletLabelDialog isOpen={isOpenPalletLabelDialog} onClose={closePalletLabelDialog} pallet={palletLabelDialogData} />

                <MovePalletToStoreDialog />
                <MoveMultiplePalletsToStoreDialog />

                {/* Slideovers */}
                {/* <PositionDetailsSlideover open={openPositionDetailsSlideover} onClose={() => setOpenPositionDetailsSlideover(false)} data={positionDetailsSlideoverData} />
                <UnlocatedElementsSlider open={openUnlocatedElementsSlideover} onClose={() => setOpenUnlocatedElementsSlideover(false)} data={unlocatedElementsSlideoverData} />
 */}
                {/* Modals */}
                {/*  <ModalAddToPosition show={openAddElementToPositionModal} onClose={() => setOpenAddElementToPositionModal(false)} data={addElementToPositionModalData} elementos={almacen.content} />
                */} {/* <RegisterPalletModal open={openRegisterPalletModal} onClose={() => setOpenRegisterPalletModal(false)} onSubmit={registerPallet} storeId={almacen.id} /> */}
                {/* <ModalPrintPalletLabel show={openLabelPalletPrintModal} onClose={() => setOpenLabelPalletPrintModal(false)} data={labelPalletPrintModalData} />
                <ReportsModal open={openReportsModal} onClose={() => setOpenReportsModal(false)} />
 */}
                {/* Register Pallet Modal */}

                {/* <RegisterPalletModal open={openRegisterPalletModal} onClose={() => setOpenRegisterPalletModal(false)} onSubmit={registerPallet} storeId={almacen.id} />
 */}
                {/* Edit Pallet Modal */}
                {/* <PalletModal open={openEditPalletModal} onClose={() => setOpenEditPalletModal(false)} onSubmit={editPallet} data={editPalletModalData} storeId={almacen.id} />
 */}
                {/* Print Container */}
                {/* <PrintContainer open={openPrintMap}>
                    <PrintableMap />
                </PrintContainer>
 */}
                {/*  </StoreProvider> */}

                {/* Floating Action Button */}
                {/*  <FloatingActionButton actions={fabActions} /> */}

                {/* Toast */}
                {/*  {createPortal(<Toaster />, document.body)} */}
            </div >

        </>
    )
}


export const Store = ({ storeId, storeName, onUpdateCurrentStoreTotalNetWeight, onAddNetWeightToStore, setIsStoreLoading }) => {
    // Pasar el storeId al contexto para que StoreContent pueda usarlo
    return (
        <StoreProvider
            storeId={storeId}
            onUpdateCurrentStoreTotalNetWeight={onUpdateCurrentStoreTotalNetWeight}
            onAddNetWeightToStore={onAddNetWeightToStore}
            setIsStoreLoading={setIsStoreLoading}
        >
            <StoreContent passedStoreId={storeId} passedStoreName={storeName} />
        </StoreProvider>

    )
}