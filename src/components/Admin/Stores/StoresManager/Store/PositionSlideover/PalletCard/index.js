"use client"
import React, { useRef } from 'react'
import { useState } from "react"
import { Box, Package, Layers, X, Plus, Printer, Edit, LogOut, Eye, MapPin, MapPinX, MapPinHouse } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useStoreContext } from "@/context/StoreContext"
import { useSession } from 'next-auth/react'
import { formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers'
import { getAvailableBoxes, getAvailableBoxesCount, getAvailableNetWeight } from '@/helpers/pallet/boxAvailability'
import { REGISTERED_PALLETS_STORE_ID } from '@/hooks/useStores'

export default function PalletCard({ pallet }) {
    const { data: session } = useSession();

    const { openPalletDialog, isPalletRelevant, openPalletLabelDialog, openMovePalletToStoreDialog, removePalletFromPosition, store } = useStoreContext();
    
    // Detectar si estamos en el almacén fantasma o si el palet está sin ubicar
    const isGhostStore = store?.id === REGISTERED_PALLETS_STORE_ID;
    const isUnlocated = !pallet.position;
    const shouldHideRemoveOption = isGhostStore || isUnlocated;

    const handleOnCLickEdit = () => {
        openPalletDialog(pallet.id)
    }

    /* Handle on Click quitar elemento de posición */
    const handleOnClickRemovePalletFromPosition = () => {
        removePalletFromPosition(pallet.id)
    }

    const fondoClasses = isPalletRelevant(pallet.id) ?
        'bg-green-500 text-background border-green-400 dark:border-green-600 overflow-hidden '
        : '' + 'bg-card border-border shadow-md  overflow-hidden';

    /* const hasMultipleProducts = pallet.products.length > 1 */

    // Solo contar cajas disponibles
    const availableBoxes = getAvailableBoxes(pallet.boxes || []);
    const availableBoxCount = getAvailableBoxesCount(pallet);
    const availableNetWeight = getAvailableNetWeight(pallet);

    const productsSummary = availableBoxes.reduce((acc, box) => {
        const product = box.product
        if (!acc[product.id]) {
            acc[product.id] = {
                name: product.name,
                netWeight: 0,
                boxCount: 0,
            }
        }
        acc[product.id].netWeight += Number(box.netWeight)
        acc[product.id].boxCount += 1
        return acc
    }, {})
    const productsSummaryArray = Object.values(productsSummary)


    const hasMultipleProducts = productsSummaryArray.length > 1

    // Verificar si el usuario es store_operator (no puede reubicar pallets)
    const isStoreOperator = session?.user?.role?.includes('store_operator');


    return (
        <Card className={fondoClasses} >
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-2 space-x-2">
                <div className="flex items-center space-x-2">
                    <div className="flex items-center bg-black text-white p-1.5  rounded-md gap-2">
                        <Layers className="h-5 w-5" />
                    </div>
                    <h3 className="font-medium text-xl text-foreground">
                        Palet #{pallet.id}
                    </h3>
                    {pallet.orderId && (
                        <Badge
                            variant="outline"
                            className="bg-muted text-muted-foreground text-xs mt-0.5"
                        >
                            Pedido: #{pallet.orderId}
                        </Badge>
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
                        <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => openPalletLabelDialog(pallet.id)}
                        >
                            <Printer className="h-4 w-4 mr-2" />
                            Imprimir etiqueta
                        </DropdownMenuItem>
                        {/* <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalles
                        </DropdownMenuItem> */}
                        <DropdownMenuSeparator />
                        {/* Opción Reubicar - Solo visible para usuarios que no son store_operator */}
                        {!isStoreOperator && (
                            <DropdownMenuItem
                                className='cursor-pointer'
                                onClick={() => openMovePalletToStoreDialog(pallet.id)}
                            >
                                <MapPinHouse className="h-4 w-4 mr-2" />
                                Reubicar
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                            className='cursor-pointer'
                            onClick={handleOnCLickEdit}
                        >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                        </DropdownMenuItem>
                        {/* Solo mostrar "Quitar de esta posición" si NO es almacén fantasma y NO está sin ubicar */}
                        {!shouldHideRemoveOption && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={handleOnClickRemovePalletFromPosition}
                                    className="text-destructive focus:text-destructive cursor-pointer"
                                >
                                    <MapPinX className="h-4 w-4 mr-2" />
                                    Quitar de esta posición
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>

            <CardContent className="p-4 pt-0 ">
                <div className="py-3 px-1 ">
                    <div className="text-xs font-medium text-muted-foreground mb-1.5">Productos:</div>
                    <div className="space-y-3 ">
                        {productsSummaryArray.map((product, index) => (
                            <div key={index} className="flex flex-col   overflow-hidden">
                                <p className="text-sm font-medium text-foreground max-w-xs truncate  overflow-hidden">{product.name}</p>
                                {hasMultipleProducts && (product.weight || product.boxCount) && (
                                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                                        <span>{formatDecimalWeight(product.netWeight)} kg</span>
                                        <span className="mx-1.5 ">|</span>
                                        {product.boxCount && (
                                            <span>
                                                {product.boxCount} {product.boxCount === 1 ? "caja" : "cajas"}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

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

                {pallet.observations && (
                    <div className="mb-3">
                        <div className="text-xs font-medium text-muted-foreground mb-1">Observaciones:</div>
                        <div className="text-sm text-foreground bg-muted/50 p-2 rounded-md  break-words max-w-xs">{pallet.observations}</div>
                    </div>
                )}
            </CardContent>

            <CardFooter className="p-0 w-full">
                <div className="w-full grid grid-cols-2 divide-x divide-border">
                    <div className="flex items-center justify-center py-3 bg-accent/40 ">
                        <span className="text-base font-semibold">
                            {availableBoxCount} {availableBoxCount === 1 ? "caja" : "cajas"}
                        </span>
                    </div>
                    <div className="flex items-center justify-center py-3 bg-accent/40">
                        <span className="text-base font-semibold">{formatDecimalWeight(availableNetWeight)}</span>
                    </div>
                </div>
            </CardFooter>
        </Card>
    )
}



