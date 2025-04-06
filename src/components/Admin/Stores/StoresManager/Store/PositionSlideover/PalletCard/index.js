"use client"
import React from 'react'
import { useState } from "react"
import { Box, Package, Layers, X, Plus, Printer, Edit, LogOut, Eye, MapPin } from "lucide-react"
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
import { formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers'

export default function PalletCard({ pallet }) {
    /* const hasMultipleProducts = pallet.products.length > 1 */


    const productsSummary = pallet.boxes.reduce((acc, box) => {
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

    return (
        <Card className="bg-card border-border shadow-md">
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-2 space-x-2">
                <div className="flex items-center space-x-2">
                    <div className="flex items-center bg-black text-white p-1.5  rounded-xl gap-2">

                        <Layers className="h-5 w-5" />
                    </div>

                    <h3 className="font-medium text-xl text-foreground">
                        Palet #{pallet.id}
                    </h3>
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
                        <DropdownMenuItem>
                            <Printer className="h-4 w-4 mr-2" />
                            Imprimir etiqueta
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalles
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                            <MapPin className="h-4 w-4 mr-2" />
                            Reubicar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive">
                            <LogOut className="h-4 w-4 mr-2" />
                            Quitar de esta posición
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>

            <CardContent className="p-4 pt-0">
                <div className="py-3 px-1">
                    <div className="text-xs font-medium text-muted-foreground mb-1.5">Productos:</div>
                    <div className="space-y-3">
                        {productsSummaryArray.map((product, index) => (
                            <div key={index} className="flex flex-col">
                                <span className="text-sm font-medium text-foreground">{product.name}</span>
                                {hasMultipleProducts && (product.weight || product.boxCount) && (
                                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                                        <span>{formatDecimalWeight(product.netWeight)} kg</span>
                                        <span className="mx-1.5 text-border">|</span>
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
                    <div className="flex flex-wrap gap-1.5">
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
                        <div className="text-sm text-foreground bg-muted/50 p-2 rounded-md">{pallet.observations}</div>
                    </div>
                )}
            </CardContent>

            <CardFooter className="p-0">
                <div className="w-full grid grid-cols-2 divide-x divide-border">
                    <div className="flex items-center justify-center py-3 bg-accent/40">
                        <span className="text-base font-semibold">
                            {pallet.boxes.length} {pallet.boxes.length === 1 ? "caja" : "cajas"}
                        </span>
                    </div>
                    <div className="flex items-center justify-center py-3 bg-accent/40">
                        <span className="text-base font-semibold">{formatDecimalWeight(pallet.netWeight)}</span>
                    </div>
                </div>
            </CardFooter>
        </Card>
    )
}