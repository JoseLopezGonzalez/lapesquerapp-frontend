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

    // Calcular ancho máximo del diálogo basado en el tamaño de la etiqueta
    // PALLET_LABEL_SIZE.width es "110mm", extraemos el número
    const labelWidth = parseInt(PALLET_LABEL_SIZE.width) || 110; // default 110mm
    // 1mm ≈ 3.779px a 96dpi, añadimos padding y margen extra
    const maxDialogWidth = Math.max(512, (labelWidth * 3.779) + 200); // mínimo 512px (max-w-lg), más espacio para padding

    if (!pallets || pallets.length === 0) {
        return null;
    }

    // Filtrar pallets válidos que tengan cajas
    const validPallets = pallets.filter(item => {
        const pallet = item.pallet;
        return pallet && pallet.boxes && pallet.boxes.length > 0;
    });

    if (validPallets.length === 0) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="w-full max-h-[90vh] overflow-hidden flex flex-col" style={{ maxWidth: `${maxDialogWidth}px` }}>
                    <DialogHeader>
                        <DialogTitle>
                            Imprimir Todas las Etiquetas
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col justify-center w-full flex-1 overflow-auto">
                        <Alert variant="destructive" className="w-full max-w-md">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle className="text-sm">No hay pallets válidos</AlertTitle>
                            <AlertDescription className="text-sm">
                                No hay pallets con cajas para imprimir.
                            </AlertDescription>
                        </Alert>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="w-full max-h-[90vh] overflow-hidden flex flex-col" style={{ maxWidth: `${maxDialogWidth}px` }}>
                    <DialogHeader>
                        <DialogTitle>
                            Imprimir Todas las Etiquetas ({validPallets.length} pallets)
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col justify-center w-full flex-1">
                        <Alert variant="destructive" className="w-full max-w-md mb-4">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle className="text-sm">Etiquetas con espacio limitado</AlertTitle>
                            <AlertDescription className="text-sm">
                                Productos o lotes podrían no mostrarse completamente. Cada etiqueta se imprimirá en una página separada.
                            </AlertDescription>
                        </Alert>
                        <div className="flex flex-col items-center gap-4 overflow-x-auto w-full">
                            <div className="flex-shrink-0 overflow-y-auto" style={{ maxHeight: '70vh' }}>
                                {/* Vista previa - muestra todas las etiquetas */}
                                <div className="flex flex-col gap-4">
                                    {validPallets.map((item, index) => {
                                        const pallet = item.pallet;
                                        return (
                                            <div 
                                                key={pallet.id || `preview-${index}`}
                                                className="text-black"
                                                style={{ 
                                                    width: PALLET_LABEL_SIZE.width, 
                                                    height: PALLET_LABEL_SIZE.height 
                                                }}>
                                                <PalletLabel pallet={pallet} />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Área de impresión dentro del Dialog pero oculta - igual que BoxLabelPrintDialog */}
                    <div id="print-all-labels-area" className="hidden print:block">
                        {validPallets.map((item, index) => {
                            const pallet = item.pallet;
                            return (
                                <div
                                    key={pallet.id || `pallet-${index}`}
                                    className="page"
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
                    <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                        <Button onClick={handleOnClickPrintLabels}>
                            <Printer className="h-4 w-4 mr-2" />
                            Imprimir Todas las Etiquetas
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

