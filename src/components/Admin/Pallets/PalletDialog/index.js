"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ExternalLink, Package } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
    // Get pallet data to check for receptionId
    const { temporalPallet } = usePallet({ 
        id: palletId && !palletId?.toString().startsWith('temp-') ? palletId : (palletId === 'new' ? 'new' : null), 
        onChange: () => {},
        initialStoreId,
        initialOrderId,
        skipBackendSave: true,
        initialPallet
    });

    const receptionId = temporalPallet?.receptionId;
    const belongsToReception = receptionId !== null && receptionId !== undefined;

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
                <DialogContent className="w-full max-w-[95vw] max-h-[90vh] overflow-hidden" aria-describedby={undefined}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 flex-wrap">
                            <span>
                                {palletId && palletId !== 'new' && !palletId?.toString().startsWith('temp-') 
                                    ? (belongsToReception ? `Ver Palet #${palletId}` : `Editar Palet #${palletId}`)
                                    : "Nuevo Palet"}
                            </span>
                            {belongsToReception && receptionId && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Link
                                                href={`/admin/raw-material-receptions/${receptionId}/edit`}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Badge
                                                    variant="outline"
                                                    className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:text-blue-800 transition-colors cursor-pointer flex items-center gap-1.5"
                                                >
                                                    <Package className="h-3 w-3" />
                                                    <span>Recepción #{receptionId}</span>
                                                    <ExternalLink className="h-3 w-3" />
                                                </Badge>
                                            </Link>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Ver recepción #{receptionId}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
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
