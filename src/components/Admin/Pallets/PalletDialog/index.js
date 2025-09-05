"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { usePallet } from "@/hooks/usePallet";
import PalletView from "./PalletView";


export default function PalletDialog({ palletId, isOpen, onChange, initialStoreId = null, initialOrderId = null, onCloseDialog }) {

    const handleOnClickClose = () => {
        onCloseDialog();
        /* onClose(); */
    };


    return (
        <>
            <Dialog open={isOpen} onOpenChange={handleOnClickClose}>
                <DialogContent className="w-full max-w-[95vw] max-h-[90vi] overflow-hidden">
                    <DialogHeader>
                        <DialogTitle className="">
                            {palletId && palletId !== 'new' ? `Editar Palet #${palletId}` : "Nuevo Palet"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex justify-center flex-1 items-center w-full h-full">
                        <PalletView
                            palletId={palletId}
                            onChange={onChange}
                            initialStoreId={initialStoreId}
                            initialOrderId={initialOrderId}
                            wrappedInDialog={true}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
