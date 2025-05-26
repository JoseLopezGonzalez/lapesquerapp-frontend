"use client"

import Map from './MapContainer/Map'
import MapContainer from './MapContainer'
import Loader from '@/components/Utilities/Loader';
import { StoreProvider, useStoreContext } from '@/context/StoreContext';
import { LocateFixed } from "lucide-react"
import { Button } from "@/components/ui/button"
import Filters from './Filters';
import { Card } from '@/components/ui/card';
import PositionSlideover from './PositionSlideover';
import AddElementToPosition from './AddElementToPositionDialog';
import { useState } from 'react';
import PalletDialog from './PalletDialog';
import UnallocatedPositionSlideover from './UnallocatedPositionSlideover';
import { UNLOCATED_POSITION_ID } from '@/configs/config';

export const StoreContent = () => {

    const { loading, error, isOpenAddElementToPositionDialog,
        isOpenPalletDialog,
        openUnallocatedPositionSlideover,
        isPositionRelevant,
        isPositionFilled,

    } = useStoreContext();

    const handleOnClickUnallocatedPosition = () => {
        console.log("Unallocated positions clicked");
        openUnallocatedPositionSlideover();
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full w-full gap-6">
                <Loader />
            </div>
        )
    }

    const isUnallocatedPositionRelevant = isPositionRelevant(UNLOCATED_POSITION_ID);
    const isUnallocatedPositionFilled = isPositionFilled(UNLOCATED_POSITION_ID)

    const fondoClasses = isUnallocatedPositionRelevant ?
        'bg-green-500 group-hover:bg-green-600 dark:group-hover:bg-green-800'
        : isUnallocatedPositionFilled
            ? 'bg-primary/75 group-hover:bg-primary text-background'
            : 'bg-foreground-300 group-hover:bg-foreground-400';

    return (
        <>
            <div className='flex items-center justify-center w-full h-full gap-4'>

                {/* Map */}
                <Card className=' relative grow flex items-center justify-center w-full h-full overflow-hidden'>
                    <MapContainer>
                        <Map onClickPosition={() => console.log()} isPositionEmpty={() => console.log()} />
                    </MapContainer>
                    <div className="absolute bottom-4 right-4 z-10">
                        <Button variant="secondary"
                            className={`flex items-center gap-2 ${fondoClasses} `}
                            onClick={handleOnClickUnallocatedPosition}
                        >
                            <LocateFixed size={24} />
                            Elementos sin ubicar
                        </Button>
                    </div>
                </Card >

                <div className='max-w-[350px] w-full h-full overflow-hidden'>
                    <Filters />
                </div>

                <PositionSlideover />

                <UnallocatedPositionSlideover />

                <AddElementToPosition open={isOpenAddElementToPositionDialog} />

                <PalletDialog open={isOpenPalletDialog} />

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

export const Store = ({ storeId }) => {

    return (
        <StoreProvider storeId={storeId} >
            <StoreContent />
        </StoreProvider>

    )
}