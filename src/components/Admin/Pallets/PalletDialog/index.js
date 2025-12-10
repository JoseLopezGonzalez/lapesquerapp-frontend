"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { usePallet } from "@/hooks/usePallet";
import PalletView from "./PalletView";


export default function PalletDialog({ 
    palletId, 
    isOpen, 
    onChange, 
    initialStoreId = null, 
    initialOrderId = null, 
    onCloseDialog,
    onSaveTemporal = null,
    initialPallet = null
}) {

    const handleOnClickClose = () => {
        onCloseDialog();
        /* onClose(); */
    };

    const handleSaveTemporal = (temporalPallet) => {
        if (onSaveTemporal && temporalPallet) {
            onSaveTemporal(temporalPallet);
            if (onCloseDialog) {
                onCloseDialog();
            }
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={handleOnClickClose}>
                <DialogContent className="w-full max-w-[95vw] max-h-[90vh] overflow-hidden">
                    <DialogHeader>
                        <DialogTitle className="">
                            {palletId && palletId !== 'new' && !palletId?.toString().startsWith('temp-') 
                                ? `Editar Palet #${palletId}` 
                                : "Nuevo Palet"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex justify-center flex-1 items-center w-full h-full overflow-auto pb-4">
                        <PalletView
                            palletId={palletId && !palletId?.toString().startsWith('temp-') ? palletId : (palletId === 'new' ? 'new' : null)}
                            onChange={onChange}
                            initialStoreId={initialStoreId}
                            initialOrderId={initialOrderId}
                            wrappedInDialog={true}
                            onSaveTemporal={onSaveTemporal ? handleSaveTemporal : null}
                            initialPallet={initialPallet}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
