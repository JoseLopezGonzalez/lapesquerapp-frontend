"use client"

import { useState } from "react"
import { Layers, Search, X, Check, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useStoreContext } from "@/context/StoreContext"
import { ScrollArea } from "@/components/ui/scroll-area"

const availablePallets = [
    {
        id: "2001",
        products: [{ name: "Pulpo eviscerado congelado en bloque", category: "Pulpo" }],
        lotNumbers: ["L-2023-08-01"],
        netWeight: 245.5,
        boxCount: 2,
        location: "B3",
    },
    {
        id: "2002",
        products: [{ name: "Calamar patagónico limpio", category: "Calamar" }],
        lotNumbers: ["L-2023-08-02"],
        netWeight: 180.0,
        boxCount: 3,
    },
    {
        id: "2003",
        products: [{ name: "Merluza fileteada", category: "Merluza" }],
        lotNumbers: ["L-2023-08-03"],
        netWeight: 120.75,
        boxCount: 4,
        location: "C7",
    },
    {
        id: "2004",
        products: [
            { name: "Pulpo cocido refrigerado", category: "Pulpo", weight: 110.5, boxCount: 2 },
            { name: "Calamar limpio", category: "Calamar", weight: 90.0, boxCount: 1 },
        ],
        lotNumbers: ["L-2023-08-04", "L-2023-08-05"],
        netWeight: 200.5,
        boxCount: 3,
    },
    {
        id: "2005",
        products: [{ name: "Rape cola", category: "Rape" }],
        lotNumbers: ["L-2023-08-06"],
        netWeight: 95.25,
        boxCount: 2,
        location: "D2",
    },
    {
        id: "2006",
        products: [
            { name: "Pulpo entero congelado IQF", category: "Pulpo" },
            { name: "Pulpo cocido", category: "Pulpo", weight: 85.5, boxCount: 1 },
            { name: "Calamar anillas", category: "Calamar", weight: 75.0, boxCount: 2 },
        ],
        lotNumbers: ["L-2023-08-07", "L-2023-08-08"],
        netWeight: 310.0,
        boxCount: 5,
    },
    {
        id: "2007",
        products: [{ name: "Merluza del Cantábrico", category: "Merluza" }],
        lotNumbers: ["L-2023-08-09"],
        netWeight: 175.0,
        boxCount: 3,
    },
    {
        id: "2008",
        products: [{ name: "Pulpo Mauritania", category: "Pulpo" }],
        lotNumbers: ["L-2023-08-10"],
        netWeight: 290.5,
        boxCount: 2,
        location: "A2",
    },
]

export default function AddElementToPosition({ open, onOpenChange, onSubmit }) {


    const { selectedPosition, closeAddElementToPosition, unlocatedPallets, pallets } = useStoreContext()

    const position = selectedPosition

    const [searchQuery, setSearchQuery] = useState("")
    const [selectedPalletIds, setSelectedPalletIds] = useState([])
    const [activeTab, setActiveTab] = useState("unlocated")

    const handleOnClose = () => {
        setSelectedPalletIds([])
        setSearchQuery("")
        closeAddElementToPosition()
    }

    const handleSubmit = () => {
        if (selectedPalletIds.length > 0 && onSubmit) {
            onSubmit(selectedPalletIds)
            setSelectedPalletIds([])
            setSearchQuery("")
            onOpenChange(false)
        }
    }

    const togglePalletSelection = (palletId) => {
        setSelectedPalletIds((prev) =>
            prev.includes(palletId) ? prev.filter((id) => id !== palletId) : [...prev, palletId]
        )
    }


    const filteredPallets = pallets.filter((pallet) => {
        if (activeTab === "unlocated" && pallet.position) {
            return false
        }
        if (!searchQuery) return true
        const query = searchQuery.toLowerCase()
        if (pallet.id.toLowerCase().includes(query)) return true
        if (pallet.products.some((product) => product.name.toLowerCase().includes(query))) return true
        if (pallet.lotNumbers.some((lot) => lot.toLowerCase().includes(query))) return true
        if (pallet.location && pallet.location.toLowerCase().includes(query)) return true
        return false
    })

    const unlocatedCount = availablePallets.filter((p) => !p.location).length

    return (
        <Dialog open={open} onOpenChange={handleOnClose}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Seleccionar pallets para posición {position}</DialogTitle>
                    <DialogDescription>
                        Seleccione uno o varios pallets de la lista para ubicarlos en esta posición.
                    </DialogDescription>
                </DialogHeader>

                <Tabs
                    defaultValue="unlocated"
                    className="w-full"
                    onValueChange={(value) => {
                        setActiveTab(value)
                        setSelectedPalletIds([])
                    }}
                >
                    <TabsList className="grid w-full flex-1 grid-cols-2 mb-4">
                        <TabsTrigger value="unlocated" >
                            Pallets sin ubicar

                        </TabsTrigger>
                        <TabsTrigger value="all">Todos los pallets</TabsTrigger>
                    </TabsList>

                    <div className="relative my-2">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por ID, producto o lote..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1 h-7 w-7"
                                onClick={() => setSearchQuery("")}
                            >
                                <X className="h-4 w-4" />
                                <span className="sr-only">Limpiar búsqueda</span>
                            </Button>
                        )}
                    </div>

                    <TabsContent value="unlocated" className="m-0">
                        <PalletList
                            pallets={filteredPallets}
                            selectedPalletIds={selectedPalletIds}
                            togglePalletSelection={togglePalletSelection}
                        />
                    </TabsContent>

                    <TabsContent value="all" className="m-0">
                        <PalletList
                            pallets={filteredPallets}
                            selectedPalletIds={selectedPalletIds}
                            togglePalletSelection={togglePalletSelection}
                        />
                    </TabsContent>
                </Tabs>

                <DialogFooter className="mt-4">
                    <div className="flex items-center text-sm text-muted-foreground mr-auto">
                        {selectedPalletIds.length > 0 && (
                            <>
                                <Check className="h-4 w-4 mr-1 text-primary" />
                                {selectedPalletIds.length} {" "}
                                {selectedPalletIds.length === 1 ? "pallet seleccionado" : "pallets seleccionados"}
                            </>
                        )}
                    </div>

                    <Button onClick={handleSubmit} disabled={selectedPalletIds.length === 0}>
                        {selectedPalletIds.length === 1 ? "Ubicar pallet" : `Ubicar ${selectedPalletIds.length} pallets`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function PalletList({ pallets, selectedPalletIds, togglePalletSelection }) {
    return (
        <ScrollArea className=" h-[50vh] pr-4  py-3 ">
            <div className="flex flex-col gap-3 py-1">
                {pallets.length > 0 ? (
                    pallets.map((pallet) => {
                        const isSelected = selectedPalletIds.includes(pallet.id)
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
                            <div
                                key={pallet.id}
                                className={cn(
                                    "flex items-start space-x-3 border rounded-md p-3 cursor-pointer hover:bg-accent transition-colors",
                                    isSelected && "border-primary bg-accent"
                                )}
                                onClick={() => togglePalletSelection(pallet.id)}
                            >
                                <div className="flex h-5 w-5 items-center justify-center mt-1">
                                    <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={() => togglePalletSelection(pallet.id)}
                                        id={`pallet-${pallet.id}`}
                                        className="pointer-events-none"
                                    />
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <Layers className="h-4 w-4 mr-2 text-muted-foreground" />
                                            <span className="font-medium">Pallet #{pallet.id}</span>
                                            {hasMultipleProducts && (
                                                <Badge variant="outline" className="ml-2 text-xs">
                                                    {
                                                        productsSummaryArray.length
                                                    } productos
                                                </Badge>
                                            )}
                                        </div>

                                        {pallet.position && (
                                            <Badge variant="secondary" className="flex items-center gap-1">
                                                <MapPin className="h-3 w-3" />
                                                {pallet.position}
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="mt-1 text-sm">
                                        {productsSummaryArray.map((product, index) => (
                                            <div key={index} className="line-clamp-1">
                                                {product.name}
                                                {product.netWeight && ` (${product.netWeight.toFixed(1)} kg)`}
                                                {product.boxCount && ` - ${product.boxCount} ${product.boxCount === 1 ? "caja" : "cajas"}`}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-1.5 flex items-center text-xs text-muted-foreground">
                                        <span>Total: {pallet.netWeight.toFixed(1)} kg</span>
                                        <span className="mx-1.5">|</span>
                                        <span>
                                            {pallet.numberOfBoxes} {pallet.numberOfBoxes === 1 ? "caja" : "cajas"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <div className="text-center py-6 text-muted-foreground">
                        No se encontraron pallets que coincidan con la búsqueda
                    </div>
                )}
            </div>
        </ScrollArea>
    )
}
