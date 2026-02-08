"use client"
import React from 'react'
import { Layers, Package } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers'
import { getAvailableBoxesCount, getAvailableNetWeight } from '@/helpers/pallet/boxAvailability'

export default function SearchPalletCard({ 
    pallet, 
    isSelected = false,
    isLinkedToOtherOrder = false,
    onToggleSelection
}) {
    // Los resultados de búsqueda SÍ tienen productsSummary del backend
    const availableBoxCount = getAvailableBoxesCount(pallet);
    const availableNetWeight = getAvailableNetWeight(pallet);

    // Usar productsSummary del backend si está disponible
    let productsSummaryArray = [];
    if (pallet.productsSummary && Array.isArray(pallet.productsSummary) && pallet.productsSummary.length > 0) {
        productsSummaryArray = pallet.productsSummary.map(item => ({
            name: item.product?.name || '',
            netWeight: parseFloat(item.availableNetWeight || 0),
            boxCount: parseInt(item.availableBoxCount || 0),
        }));
    } else if (pallet.productsNames && Array.isArray(pallet.productsNames)) {
        // Fallback: usar productsNames (sin peso individual)
        productsSummaryArray = pallet.productsNames.map(name => ({
            name: name,
            netWeight: 0,
            boxCount: 0,
        }));
    }

    const hasMultipleProducts = productsSummaryArray.length > 1;
    const belongsToReception = pallet?.receptionId !== null && pallet?.receptionId !== undefined;

    // Extraer lotes: primero intentar desde pallet.lots, luego desde boxes
    const lots = pallet.lots && Array.isArray(pallet.lots) && pallet.lots.length > 0
        ? pallet.lots
        : pallet.boxes && Array.isArray(pallet.boxes)
            ? [...new Set(pallet.boxes.map(box => box.lot).filter(Boolean))]
            : [];

    return (
        <Card 
            className={`bg-card border shadow-md overflow-hidden cursor-pointer transition-all h-fit ${
                isSelected 
                    ? 'border-2 border-primary shadow-lg' 
                    : 'border hover:border-primary/50'
            } ${isLinkedToOtherOrder ? 'opacity-50' : ''}`}
            onClick={() => !isLinkedToOtherOrder && onToggleSelection?.()}
        >
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-2 space-x-2">
                <div className="flex items-center space-x-2 flex-1">
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => !isLinkedToOtherOrder && onToggleSelection?.()}
                        disabled={isLinkedToOtherOrder}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-0.5"
                    />
                    <div className="flex items-center bg-black text-white p-1.5 rounded-md gap-2">
                        <Layers className="h-5 w-5" />
                    </div>
                    <h3 className="font-medium text-xl text-foreground">
                        Palet #{pallet.id}
                    </h3>
                    {pallet.receptionId && (
                        <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700 border-blue-200 text-xs mt-0.5 flex items-center gap-1.5"
                        >
                            <Package className="h-3 w-3" />
                            <span>Recepción #{pallet.receptionId}</span>
                        </Badge>
                    )}
                    {isLinkedToOtherOrder && (
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs">
                            Vinculado a otro pedido
                        </Badge>
                    )}
                </div>
            </CardHeader>

            <CardContent className="p-4 pt-0">
                <div className="py-3 px-1">
                    <div className="text-xs font-medium text-muted-foreground mb-1.5">Productos:</div>
                    <div className="space-y-3">
                        {productsSummaryArray.length > 0 ? (
                            productsSummaryArray.map((product, index) => (
                                <div key={index} className="flex flex-col overflow-hidden">
                                    <p className="text-sm font-medium text-foreground max-w-xs truncate overflow-hidden">
                                        {product.name}
                                    </p>
                                    {hasMultipleProducts && (product.netWeight > 0 || product.boxCount > 0) && (
                                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                                            {product.netWeight > 0 && (
                                                <>
                                                    <span>{formatDecimalWeight(product.netWeight)} kg</span>
                                                    {product.boxCount > 0 && <span className="mx-1.5">|</span>}
                                                </>
                                            )}
                                            {product.boxCount > 0 && (
                                                <span>
                                                    {product.boxCount} {product.boxCount === 1 ? "caja" : "cajas"}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">Sin productos</p>
                        )}
                    </div>
                </div>

                {lots.length > 0 && (
                    <div className="mb-3">
                        <div className="text-xs font-medium text-muted-foreground mb-1">Lotes:</div>
                        <div className="flex flex-wrap gap-1.5 max-w-xs overflow-hidden">
                            {lots.map((lot) => (
                                <Badge key={lot} variant="outline" className="bg-accent text-accent-foreground border-input text-xs">
                                    {lot}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {pallet.observations && (
                    <div className="mb-3">
                        <div className="text-xs font-medium text-muted-foreground mb-1">Observaciones:</div>
                        <div className="text-sm text-foreground bg-muted/50 p-2 rounded-md break-words max-w-xs">
                            {pallet.observations}
                        </div>
                    </div>
                )}

                {pallet.storedPallet?.store_id && (
                    <div className="mb-3">
                        <div className="text-xs font-medium text-muted-foreground mb-1">Almacén:</div>
                        <div className="text-sm text-foreground">
                            {pallet.storedPallet.position && `${pallet.storedPallet.position} - `}
                            {pallet.storedPallet.store_name || `Almacén #${pallet.storedPallet.store_id}`}
                        </div>
                    </div>
                )}
            </CardContent>

            <CardFooter className="p-0 w-full">
                <div className="w-full grid grid-cols-2 divide-x divide-border">
                    <div className="flex items-center justify-center py-3 bg-accent/40">
                        <span className="text-base font-semibold">
                            {availableBoxCount} {availableBoxCount === 1 ? "caja" : "cajas"}
                        </span>
                    </div>
                    <div className="flex items-center justify-center py-3 bg-accent/40">
                        <span className="text-base font-semibold">
                            {formatDecimalWeight(availableNetWeight)}
                        </span>
                    </div>
                </div>
            </CardFooter>
        </Card>
    )
}
