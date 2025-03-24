
import Map from './MapContainer/Map'
import MapContainer from './MapContainer'
import { useStore } from '@/hooks/useStore';
import Loader from '@/components/Utilities/Loader';



function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
}

export default function Store({ storeId }) {

    const { store, loading, error } = useStore(storeId);

    const map = store?.map;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full w-full gap-6">
                <Loader />
            </div>
        )
    }

    return (
        <>
            {/* <StoreProvider storeData={storeData} > */}

            {/* Map */}
            <MapContainer>
                <Map onClickPosition={() => console.log()} isPositionEmpty={() => console.log()} map={map} />
            </MapContainer>

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

        </>
    )
}
