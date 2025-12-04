// PalletLabel.js
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDecimalWeight } from "@/helpers/formats/numbers/formatNumbers";
import { getAvailableBoxes, getAvailableBoxesCount, getAvailableNetWeight } from "@/helpers/pallet/boxAvailability";

const PalletLabel = ({ pallet }) => {
    // Usar valores del backend si están disponibles, sino calcular desde cajas disponibles
    const availableBoxes = getAvailableBoxes(pallet.boxes || []);
    const availableBoxCount = getAvailableBoxesCount(pallet);
    const availableNetWeight = getAvailableNetWeight(pallet);
    
    return (
        <Card className=" p-0 py-0 overflow-hidden w-full h-full flex flex-col" >
            <CardHeader className="pb-2">
                <CardTitle className="text-3xl font-bold">Palet #{pallet.id}</CardTitle>
                {pallet.orderId && (
                    <p className="text-sm text-muted-foreground">Pedido vinculado: #{pallet.orderId}</p>
                )}
            </CardHeader>
            <CardContent className="text-sm space-y-2 print:text-xs print:space-y-1 flex-1 ">
                <div className="flex flex-col h-full justify-between ">
                    <div className="flex flex-col flex-1 gap-1 ">
                        <div className="flex flex-col max-h-[18mm]  overflow-hidden w-full">
                            <p className="font-semibold text-muted-foreground mb-1">Productos:</p>
                            <ul className="list-disc list-inside space-y-0.5 w-full">
                                {[...new Set(availableBoxes.map((b) => b.product.name))].map((name) => (
                                    <li key={name} className="font-medium text-foreground w-full truncate">
                                        {name}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="flex flex-col max-h-[26mm]  overflow-hidden w-full">
                            <p className="font-semibold text-muted-foreground mb-1">Lotes:</p>
                            <div className="flex flex-wrap gap-1">
                                {[...new Set(availableBoxes.map((b) => b.lot))].map((lot) => (
                                    <Badge key={lot} variant="outline" className="text-xs">
                                        {lot}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                        {pallet.observations && (
                            <div className="flex flex-col max-h-[13mm] overflow-hidden w-full ">
                                <p className="font-semibold text-muted-foreground mb-1 ">Observaciones:</p>
                                <p className="bg-muted/50 flex-1 h-full rounded-md truncate w-full">{pallet.observations}</p>
                            </div>
                        )}
                    </div>
                    <Separator className="my-1" />
                    <div className="grid grid-cols-11 gap-2 text-center">
                        <div className="col-span-5">
                            <p className="text-lg font-medium">{availableBoxCount} cajas</p>
                        </div>
                        <Separator orientation="vertical" className="h-8" />
                        <div className="col-span-5">
                            <p className="text-lg font-medium">{formatDecimalWeight(availableNetWeight)}</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default PalletLabel;
