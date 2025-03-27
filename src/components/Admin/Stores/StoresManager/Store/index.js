"use client"

import Map from './MapContainer/Map'
import MapContainer from './MapContainer'
import { useStore } from '@/hooks/useStore';
import Loader from '@/components/Utilities/Loader';
import { StoreProvider, useStoreContext } from '@/context/StoreContext';


import {
    Box,

    Package,

    Filter,
    ChevronDown,
    ChevronUp,
    Locate,
    LocateFixed,
} from "lucide-react"

// Add these imports at the top of the file
import { Check, ChevronsUpDown } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
/* import { Slider } from "@/components/ui/slider" */
import { Separator } from "@/components/ui/separator"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Combobox } from '@/components/Shadcn/Combobox';
import Filters from './Filters';
import { Card } from '@/components/ui/card';



function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
}

export const StoreContent = () => {

    const { loading, error, productsOptions } = useStoreContext();

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full w-full gap-6">
                <Loader />
            </div>
        )
    }

    return (
        <>
            <div className='flex items-center justify-center w-full h-full gap-4'>

                {/* Map */}
                <Card className=' relative grow flex items-center justify-center w-full h-full overflow-hidden'>
                    <MapContainer>
                        <Map onClickPosition={() => console.log()} isPositionEmpty={() => console.log()} />
                    </MapContainer>
                    <div className="absolute bottom-4 right-4 z-10">
                        <Button variant="secondary">
                            <LocateFixed size={24} />
                            Elementos sin ubicar
                            </Button>
                    </div>
                </Card >

                <Card className='max-w-[350px] w-full flex items-center justify-center h-full overflow-hidden'>
                    <Filters />
                </Card>

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