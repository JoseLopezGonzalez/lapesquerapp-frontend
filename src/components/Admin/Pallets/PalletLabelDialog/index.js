"use client";

import { PALLET_LABEL_SIZE } from "@/configs/config";

import { AlertTriangle, CloudAlert, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { usePrintElement } from "@/hooks/usePrintElement";

import PalletLabel from "@/components/Admin/Pallets/PalletLabel";


export default function PalletLabelDialog({isOpen , onClose , pallet}) {

    const { onPrint } = usePrintElement({ id: 'print-area-id', width: PALLET_LABEL_SIZE.width, height: PALLET_LABEL_SIZE.height });

    const handleOnClickPrintLabel = () => {
        onPrint();
    }

    const handleOnClickClose = () => {
        onClose();
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={handleOnClickClose}>
                {!pallet ? (
                <DialogContent className="w-full  flex flex-col items-center justify-center gap-4 text-center">
                    <DialogHeader>
                        <DialogTitle className="sr-only">
                            Error
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center gap-2 py-10">
                        <div className="flex items-center justify-center bg-red-100 rounded-full p-5 mb-2">
                            <CloudAlert className="w-12 h-12 text-destructive" />
                        </div>
                        <h2 className="text-xl font-semibold text-destructive">¡Vaya! Ocurrió un error</h2>
                        <p className="text-muted-foreground text-sm max-w-xs">
                            Por favor, revisa tu conexión o inténtalo nuevamente más tarde.
                        </p>
                        <Button variant="destructive" className="px-20 mt-5" onClick={handleOnClickClose}>
                            Cerrar
                        </Button>
                    </div>
                </DialogContent>
            ) : (
                <DialogContent className="w-full  max-h-[90vw] overflow-hidden">
                    <DialogHeader>
                        <DialogTitle className="">
                            {pallet?.id ? `Etiqueta - Palet #${pallet.id}` : "Nuevo Palet"}
                        </DialogTitle>
                    </DialogHeader>
                        <div className="flex flex-col justify-center w-full">
                            <Alert variant="destructive" className="w-full max-w-md">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle className="text-sm">Etiqueta con espacio limitado</AlertTitle>
                                <AlertDescription className="text-sm">
                                    Productos o lotes podrían no mostrarse completamente.
                                </AlertDescription>
                            </Alert>
                            <div className="flex flex-col items-center gap-4 mt-4  ">
                                <div className='bg-orange-200 px-4'>
                                    <div className="flex flex-col items-center  gap-4"
                                        style={{ width: PALLET_LABEL_SIZE.width }}>
                                        <div className="w-full h-20 bg-white rounded-b-xl border-t-0 border bg-card text-card-foreground  shadow">
                                        </div>
                                        {/* Vista previa - también es el área de impresión */}
                                        <div id='print-area-id' className="text-black"
                                            style={{ width: PALLET_LABEL_SIZE.width, height: PALLET_LABEL_SIZE.height }}>
                                            <PalletLabel pallet={pallet} />
                                        </div>
                                        <div className="w-full h-20 bg-white rounded-t-xl  border border-b-0 bg-card text-card-foreground  ">
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    <div className="flex justify-end gap-3 pt-4 border-t mt-4 ">
                        <Button onClick={handleOnClickPrintLabel}>
                            <Printer className="h-4 w-4" />
                            Imprimir
                        </Button>
                    </div>
                </DialogContent>
                )}
            </Dialog>
        </>
    );
}
