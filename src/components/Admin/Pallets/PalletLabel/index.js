// PalletLabel.js
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDecimalWeight } from "@/helpers/formats/numbers/formatNumbers";
import { getAvailableBoxes, getAvailableBoxesCount, getAvailableNetWeight } from "@/helpers/pallet/boxAvailability";

const PalletLabel = ({ pallet }) => {
    // Usar valores del backend si están disponibles, sino calcular desde cajas disponibles
    // Asegurar que las cajas tengan la estructura correcta (product en lugar de article)
    const normalizedBoxes = (pallet.boxes || []).map(box => {
        // Si la caja tiene article pero no product, convertir article a product
        if (box.article && !box.product) {
            return {
                ...box,
                product: box.article
            };
        }
        return box;
    });
    
    const availableBoxes = getAvailableBoxes(normalizedBoxes);
    const availableBoxCount = getAvailableBoxesCount(pallet);
    const availableNetWeight = getAvailableNetWeight(pallet);
    
    // Obtener productos únicos de las cajas disponibles
    const uniqueProducts = [...new Set(availableBoxes
        .filter(b => b.product && b.product.name)
        .map((b) => b.product.name))];
    
    // Obtener lotes únicos de las cajas disponibles
    const uniqueLots = [...new Set(availableBoxes
        .filter(b => b.lot)
        .map((b) => b.lot))];
    
    return (
        <Card className="p-0 overflow-hidden w-full h-full flex flex-col bg-white text-neutral-900 dark:bg-white dark:text-neutral-900">
            <CardHeader className="pb-2">
                <CardTitle className="text-3xl font-bold">Palet #{pallet.id}</CardTitle>
                {pallet.orderId && (
                    <p className="text-sm text-gray-600 dark:text-gray-600">Pedido vinculado: #{pallet.orderId}</p>
                )}
            </CardHeader>
            <CardContent className="text-sm space-y-2 print:text-xs print:space-y-1 flex-1">
                <div className="flex flex-col h-full justify-between ">
                    <div className="flex flex-col flex-1 gap-1 ">
                        <div className="flex flex-col max-h-[18mm] overflow-hidden w-full">
                            <p className="font-semibold text-gray-600 dark:text-gray-600 mb-1">Productos:</p>
                            {uniqueProducts.length > 0 ? (
                                <ul className="list-disc list-inside space-y-0.5 w-full">
                                    {uniqueProducts.map((name) => (
                                        <li
                                            key={name}
                                            className="font-medium text-neutral-900 dark:text-neutral-900 w-full truncate"
                                        >
                                            {name}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-600 dark:text-gray-600 text-xs">Sin productos</p>
                            )}
                        </div>
                        <div className="flex flex-col max-h-[26mm] overflow-hidden w-full">
                            <p className="font-semibold text-gray-600 dark:text-gray-600 mb-1">Lotes:</p>
                            {uniqueLots.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                    {uniqueLots.map((lot) => (
                                        <Badge
                                            key={lot}
                                            variant="outline"
                                            className="text-xs border-gray-400 text-neutral-900 bg-white dark:border-gray-400 dark:text-neutral-900 dark:bg-white"
                                        >
                                            {lot}
                                        </Badge>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-600 dark:text-gray-600 text-xs">Sin lotes</p>
                            )}
                        </div>
                        {pallet.observations && (
                            <div className="flex flex-col max-h-[13mm] overflow-hidden w-full">
                                <p className="font-semibold text-gray-600 dark:text-gray-600 mb-1">Observaciones:</p>
                                <p className="bg-gray-100 dark:bg-gray-100 flex-1 h-full rounded-md truncate w-full">
                                    {pallet.observations}
                                </p>
                            </div>
                        )}
                    </div>
                    <Separator className="my-1 bg-gray-300 dark:bg-gray-300" />
                    <div className="grid grid-cols-11 gap-2 text-center">
                        <div className="col-span-5 text-neutral-900 dark:text-neutral-900">
                            <p className="text-lg font-medium">{availableBoxCount} cajas</p>
                        </div>
                        <Separator orientation="vertical" className="h-8 bg-gray-300 dark:bg-gray-300" />
                        <div className="col-span-5 text-neutral-900 dark:text-neutral-900">
                            <p className="text-lg font-medium">{formatDecimalWeight(availableNetWeight)}</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default PalletLabel;
