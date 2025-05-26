"use client"
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
import PalletCard from "./PalletCard"

const palletData = [
    {
        id: "1567",
        type: "Pallet",
        products: [{ name: "Pulpo eviscerado congelado en bloque Roto", category: "Pulpo" }],
        lotNumbers: ["L-2023-05-12", "L-2023-05-13"],
        observations: "Pulpo Mozambique en cajas marrones.",
        netWeight: 257.38,
        boxCount: 1,
    },
    {
        id: "1568",
        type: "Pallet",
        products: [{ name: "Pulpo entero congelado IQF", category: "Pulpo" }],
        lotNumbers: ["L-2023-06-01"],
        observations: "Pulpo Mauritania calidad premium.",
        netWeight: 320.5,
        boxCount: 2,
    },
    {
        id: "1570",
        type: "Pallet",
        products: [
            { name: "Pulpo cocido refrigerado", category: "Pulpo", weight: 120.5, boxCount: 2 },
            { name: "Calamar patagónico limpio", category: "Calamar", weight: 85.3, boxCount: 3 },
            { name: "Merluza fileteada", category: "Merluza", weight: 95.2, boxCount: 1 },
        ],
        lotNumbers: ["L-2023-07-01", "L-2023-07-02"],
        observations: "Pallet mixto para distribución local. Mantener refrigerado.",
        netWeight: 301.0,
        boxCount: 6,
    },
    {
        id: "1569",
        type: "Pallet",
        products: [{ name: "Calamar limpio tubo", category: "Calamar" }],
        lotNumbers: ["L-2023-05-20", "L-2023-05-21", "L-2023-05-22"],
        observations: "Calamar patagónico en cajas azules.",
        netWeight: 180.75,
        boxCount: 3,
    },
]

const typeIcons = {
    Pallet: <Layers className="h-5 w-5" />,
    Caja: <Box className="h-5 w-5" />,
    Tina: <Package className="h-5 w-5" />,
}

export default function PositionSlideover({ onClose, position = "A5" }) {


    const { isOpenPositionSlideover, closePositionSlideover, selectedPosition, getPositionPallets, openAddElementToPosition } = useStoreContext()

    const pallets = getPositionPallets(selectedPosition)

    const open = isOpenPositionSlideover

    const handleOnClickAddElement = () => {
        openAddElementToPosition()
        console.log('openAddElementToPosition')
    }

    console.log('pallets', pallets)

    return (

        <Sheet open={open} onOpenChange={closePositionSlideover} >
            {/*  <SheetTrigger>Open</SheetTrigger> */}
            <SheetContent className='w-[400px] sm:w-[900px] sm:min-w-[430px] flex flex-col h-full'  >
                <SheetHeader>
                    <SheetTitle>Posicion A4</SheetTitle>
                    <SheetDescription>
                        Detalles de la posición seleccionada
                    </SheetDescription>
                </SheetHeader>
                <div className="">
                    <Button className="w-full flex items-center justify-center gap-2" onClick={handleOnClickAddElement}>
                        <Plus className="h-4 w-4"  />
                        Agregar nuevo elemento
                    </Button>
                </div>

                <ScrollArea className="flex-1 gap-2 py-4 px-2">
                    <div className=" space-y-4">
                        {palletData.length === 0 ? (
                            <Card className="bg-muted/30 border-dashed flex flex-col items-center justify-center p-6 text-center">
                                <Layers className="h-10 w-10 text-muted-foreground mb-3" />
                                <h3 className="text-lg font-medium mb-1">No hay elementos</h3>
                                <p className="text-sm text-muted-foreground mb-4">No hay elementos ubicados en esta posición.</p>
                                <Button className="flex items-center gap-2">
                                    <Plus className="h-4 w-4" />
                                    Agregar elemento
                                </Button>
                            </Card>
                        ) : (

                            pallets.map((pallet) => <PalletCard key={pallet.id} pallet={pallet} />)
                        )}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    )
}

