"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PalletView from "@/components/Admin/Pallets/PalletDialog/PalletView";
import React from "react";

export default function ReceptionPalletDialog({ 
    palletId, 
    isOpen, 
    onSave, 
    onCloseDialog,
    initialPallet = null
}) {
    const handleSaveTemporal = (temporalPallet) => {
        // Capture temporalPallet and call onSave
        if (onSave && temporalPallet) {
            onSave(temporalPallet);
            // Close dialog after saving
            if (onCloseDialog) {
                onCloseDialog();
            }
        }
    };

    const handleClose = () => {
        if (onCloseDialog) {
            onCloseDialog();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="w-full max-w-[95vw] max-h-[90vh] overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="">
                        {palletId && palletId !== 'new' && !palletId.startsWith('temp-') 
                            ? `Editar Palet #${palletId}` 
                            : "Nuevo Palet"}
                    </DialogTitle>
                </DialogHeader>
                <div className="flex justify-center flex-1 items-center w-full h-full overflow-auto">
                    <PalletView
                        palletId={palletId && palletId !== 'new' && !palletId.startsWith('temp-') ? palletId : null}
                        onChange={() => {}} // We handle saving manually via onSaveTemporal
                        initialStoreId={null}
                        initialOrderId={null}
                        wrappedInDialog={true}
                        onSaveTemporal={handleSaveTemporal}
                        initialPallet={initialPallet}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}

