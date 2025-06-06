"use client"
import React, { useRef } from 'react'
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

    const { openPalletDialog, isPalletRelevant } = useStoreContext();

    const handleOnCLickEdit = () => {
        openPalletDialog(pallet.id)
    }

    const fondoClasses = isPalletRelevant(pallet.id) ?
        'bg-green-500 text-background border-green-400 dark:border-green-600 overflow-hidden '
        : '' + 'bg-card border-border shadow-md  overflow-hidden';

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
                        <DropdownMenuItem
                            className='cursor-pointer'
                            onClick={handleOnCLickEdit}
                        >
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
/* 
import { useReactToPrint } from 'react-to-print'; */

import { forwardRef } from 'react';

const ComponenteAImprimir = forwardRef((props, ref) => (
    <div ref={ref}>
        <h1>Contenido a imprimir</h1>
        <p>Este es el contenido que se imprimirá.</p>
    </div>
));

import printJS from 'print-js';

export const Test = () => {
    const componenteRef = useRef();

    /*  const handlePrint = useReactToPrint({
         componenteRef
     }); */

    /* const handlePrint = () => {
        console.log('ref', componenteRef.current);
    } */

    const handlePrint = () => {
        printJS({ printable: 'print-area-id', type: 'html', targetStyles: ['*'] });
    };

    return (
        <div>
            {/* <ComponenteAImprimir ref={componenteRef} /> */}
            <div ref={componenteRef}>
                <h1>Contenido a imprimir</h1>
                <p>Este es el contenido que se imprimirá.</p>
            </div>
            {/*  <button onClick={handlePrint}>Imprimir</button> */}

            <form method="post" action="#" id="print-area-id">
                <h1>Contenido a imprimir</h1>
                <p>Este es el contenido que se imprimirá.</p>
            </form>

            <button type="button" onClick={handlePrint} className="bg-blue-500 text-white px-4 py-2 rounded">
                Print Form
            </button>


        </div>
    );
};


