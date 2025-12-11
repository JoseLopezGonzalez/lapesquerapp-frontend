"use client";

import { PALLET_LABEL_SIZE } from "@/configs/config";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { usePrintElement } from "@/hooks/usePrintElement";
import PalletLabel from "@/components/Admin/Pallets/PalletLabel";

export default function AllPalletsLabelDialog({ isOpen, onClose, pallets = [] }) {
    const { onPrint } = usePrintElement({ 
        id: 'print-all-labels-area', 
        width: PALLET_LABEL_SIZE.width, 
        height: PALLET_LABEL_SIZE.height 
    });

    const handleOnClickPrintLabels = () => {
        onPrint();
    };

    if (!pallets || pallets.length === 0) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-full max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>
                        Imprimir Todas las Etiquetas ({pallets.length} pallets)
                    </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col justify-center w-full flex-1 overflow-auto">
                    <Alert variant="destructive" className="w-full max-w-md mb-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle className="text-sm">Etiquetas con espacio limitado</AlertTitle>
                        <AlertDescription className="text-sm">
                            Productos o lotes podrían no mostrarse completamente. Cada etiqueta se imprimirá en una página separada.
                        </AlertDescription>
                    </Alert>
                    <div className="flex flex-col items-center gap-4 overflow-auto">
                        <div className='bg-orange-200 px-4 py-4'>
                            <div className="flex flex-col items-center gap-4"
                                style={{ width: PALLET_LABEL_SIZE.width }}>
                                <div className="w-full h-20 bg-white rounded-b-xl border-t-0 border bg-card text-card-foreground shadow">
                                </div>
                                <div 
                                    id='print-all-labels-area' 
                                    className="text-black flex flex-col gap-4"
                                    style={{ width: PALLET_LABEL_SIZE.width }}>
                                    <style dangerouslySetInnerHTML={{
                                        __html: `
                                            @media print {
                                                .label-page {
                                                    page-break-after: always;
                                                    page-break-inside: avoid;
                                                }
                                                .label-page:last-child {
                                                    page-break-after: auto;
                                                }
                                            }
                                        `
                                    }} />
                                    {pallets.map((item, index) => {
                                        const pallet = item.pallet;
                                        const isLast = index === pallets.length - 1;
                                        return (
                                            <div
                                                key={pallet.id || `pallet-${index}`}
                                                className={isLast ? '' : 'label-page'}
                                                style={{ 
                                                    width: PALLET_LABEL_SIZE.width, 
                                                    height: PALLET_LABEL_SIZE.height,
                                                }}
                                            >
                                                <PalletLabel pallet={pallet} />
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="w-full h-20 bg-white rounded-t-xl border border-b-0 bg-card text-card-foreground">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                    <Button onClick={handleOnClickPrintLabels}>
                        <Printer className="h-4 w-4 mr-2" />
                        Imprimir Todas las Etiquetas
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

