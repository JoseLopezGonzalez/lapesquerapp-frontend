"use client"
import React from 'react'
import { Layers, Package, Printer, Edit, Copy, Unlink, Trash2, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers'
import { getAvailableBoxes, getAvailableBoxesCount, getAvailableNetWeight } from '@/helpers/pallet/boxAvailability'

export default function OrderPalletCard({ 
    pallet, 
    onEdit, 
    onClone, 
    onUnlink, 
    onDelete, 
    onPrintLabel,
    isCloning = false,
    isUnlinking = false
}) {
    // Los palets vinculados al pedido NO tienen productsSummary (solo los resultados de búsqueda lo tienen)
    // Calcular desde boxes o usar productsNames como fallback
    const availableBoxCount = getAvailableBoxesCount(pallet);
    const availableNetWeight = getAvailableNetWeight(pallet);

    let productsSummaryArray = [];
    if (pallet.boxes && Array.isArray(pallet.boxes)) {
        // Calcular desde boxes
        const availableBoxes = (pallet.boxes || []).filter(box => box.isAvailable !== false);
        const productsSummary = availableBoxes.reduce((acc, box) => {
            const product = box.product
            if (!product || !product.id) return acc;
            if (!acc[product.id]) {
                acc[product.id] = {
                    name: product.name || '',
                    netWeight: 0,
                    boxCount: 0,
                }
            }
            acc[product.id].netWeight += Number(box.netWeight || 0)
            acc[product.id].boxCount += 1
            return acc
        }, {})
        productsSummaryArray = Object.values(productsSummary)
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

    return (
        <Card className="bg-card border-border shadow-md overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-2 space-x-2">
                <div className="flex items-center space-x-2">
                    <div className="flex items-center bg-black text-white p-1.5 rounded-md gap-2">
                        <Layers className="h-5 w-5" />
                    </div>
                    <h3 className="font-medium text-xl text-foreground">
                        Palet #{pallet.id}
                    </h3>
                    {pallet.receptionId && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link
                                        href={`/admin/raw-material-receptions/${pallet.receptionId}/edit`}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Badge
                                            variant="outline"
                                            className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:text-blue-800 transition-colors cursor-pointer text-xs mt-0.5 flex items-center gap-1.5"
                                        >
                                            <Package className="h-3 w-3" />
                                            <span>Recepción #{pallet.receptionId}</span>
                                            <ExternalLink className="h-3 w-3" />
                                        </Badge>
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Ver recepción #{pallet.receptionId}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-4 w-4"
                            >
                                <circle cx="12" cy="12" r="1" />
                                <circle cx="12" cy="5" r="1" />
                                <circle cx="12" cy="19" r="1" />
                            </svg>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                        {onPrintLabel && (
                            <>
                                <DropdownMenuItem
                                    className="cursor-pointer"
                                    onClick={() => onPrintLabel(pallet.id)}
                                >
                                    <Printer className="h-4 w-4 mr-2" />
                                    Imprimir etiqueta
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                            </>
                        )}
                        <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => onClone(pallet.id)}
                            disabled={belongsToReception || isCloning}
                        >
                            <Copy className="h-4 w-4 mr-2" />
                            Clonar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => onEdit(pallet.id)}
                            title={belongsToReception ? "Ver palet (solo lectura - pertenece a una recepción)" : undefined}
                        >
                            <Edit className="h-4 w-4 mr-2" />
                            {belongsToReception ? "Ver palet" : "Editar"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                            onClick={() => onUnlink(pallet.id)}
                            disabled={belongsToReception || isUnlinking}
                            className="cursor-pointer"
                        >
                            <Unlink className="h-4 w-4 mr-2" />
                            Desvincular
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                            onClick={() => onDelete(pallet.id)}
                            disabled={belongsToReception}
                            className="text-destructive focus:text-destructive cursor-pointer"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
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

                {pallet.lots && Array.isArray(pallet.lots) && pallet.lots.length > 0 && (
                    <div className="mb-3">
                        <div className="text-xs font-medium text-muted-foreground mb-1">Lotes:</div>
                        <div className="flex flex-wrap gap-1.5 max-w-xs overflow-hidden">
                            {pallet.lots.map((lot) => (
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
