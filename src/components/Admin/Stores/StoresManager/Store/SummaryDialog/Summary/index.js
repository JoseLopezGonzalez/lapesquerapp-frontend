"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { useStoreContext } from "@/context/StoreContext"
import { formatDecimalWeight } from "@/helpers/formats/numbers/formatNumbers"

const speciesData = [
    {
        id: 1,
        name: "Fish",
        totalWeight: 1250,
        products: [
            { id: 1, name: "Atlantic Salmon", weight: 450 },
            { id: 2, name: "Tuna", weight: 380 },
            { id: 3, name: "Cod", weight: 220 },
            { id: 4, name: "Sea Bass", weight: 200 },
        ],
    },
    {
        id: 2,
        name: "Crustaceans",
        totalWeight: 850,
        products: [
            { id: 1, name: "King Crab", weight: 320 },
            { id: 2, name: "Lobster", weight: 280 },
            { id: 3, name: "Shrimp", weight: 250 },
        ],
    },
    {
        id: 3,
        name: "Mollusks",
        totalWeight: 620,
        products: [
            { id: 1, name: "Squid", weight: 220 },
            { id: 2, name: "Octopus", weight: 180 },
            { id: 3, name: "Clams", weight: 120 },
            { id: 4, name: "Mussels", weight: 100 },
        ],
    },
    {
        id: 4,
        name: "Shellfish",
        totalWeight: 430,
        products: [
            { id: 1, name: "Prawns", weight: 180 },
            { id: 2, name: "Scallops", weight: 150 },
            { id: 3, name: "Oysters", weight: 100 },
        ],
    },
    {
        id: 5,
        name: "Seaweed",
        totalWeight: 320,
        products: [
            { id: 1, name: "Nori", weight: 150 },
            { id: 2, name: "Wakame", weight: 120 },
            { id: 3, name: "Kombu", weight: 50 },
        ],
    },
    {
        id: 6,
        name: "Roe",
        totalWeight: 180,
        products: [
            { id: 1, name: "Salmon Roe", weight: 100 },
            { id: 2, name: "Tobiko", weight: 80 },
        ],
    },
]

export default function Summary() {

    const { speciesSummary } = useStoreContext()
    const species = speciesSummary




    const [selectedSpecies, setSelectedSpecies] = useState(speciesData[0].name)
    const [products, setProducts] = useState([])

    const formatWeight = (weight) => `${weight.toLocaleString()} kg`
    const formatPercentage = (value, total) => `${((value / total) * 100).toFixed(1)}%`
    const currentSpecies = species.find((s) => s.name === selectedSpecies)

    const totalWeight = species.reduce((sum, s) => sum + s.totalWeight, 0)
    const totalProducts = species.reduce((sum, s) => sum + s.products.length, 0)
    const totalSpecies = species.length

    const getOpacity = (value, total) => Math.max(0.15, value / total)


    useEffect(() => {
        setSelectedSpecies(species[0].name)
    }, [species])

    useEffect(() => {
        setProducts(currentSpecies?.products ?? [])
    }
        , [currentSpecies])

    return (
        <div className="bg-background text-foreground p-6 max-w-3xl mx-auto rounded-lg  min-w-[700px]">

            <div className="text-xs text-muted-foreground/70 mb-6 flex items-center">
                species    <span>{formatWeight(totalWeight)}</span>
                <Separator orientation="vertical" className="mx-2 h-3" />
                <span>{totalProducts} products</span>
                <Separator orientation="vertical" className="mx-2 h-3" />
                <span>{totalSpecies} species</span>
            </div>

            <div className="mb-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    Especies
                </h3>
                <ScrollArea className="w-full whitespace-nowrap pb-4">
                    <div className="flex space-x-2">
                        {species.map((species, index) => {
                            const percentage = 100 * species.percentage
                            return (
                                <Card
                                    key={index}
                                    className={cn(
                                        "bg-card border-2 cursor-pointer transition-all duration-200 hover:shadow-md flex-shrink-0 ",
                                        selectedSpecies === species.name ? "border-primary shadow-sm" : "border-muted"
                                    )}
                                    onClick={() => setSelectedSpecies(species.name)}
                                >
                                    <CardContent className="p-3 flex items-center space-x-3">
                                        <div
                                            className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center",
                                                selectedSpecies === species.name
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-muted text-muted-foreground"
                                            )}
                                        >
                                            <span className="text-sm font-semibold">
                                                {/* iniciales de name */}

                                                {species.name.substring(0, 1)}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-baseline gap-3">
                                                <div className="text-sm font-medium truncate pr-1" title={species.name}>
                                                    {species.name}
                                                </div>
                                                <div
                                                    className={cn(
                                                        "text-xs font-medium rounded-sm px-1.5 py-0.5 flex-shrink-0",
                                                        selectedSpecies === species.name
                                                            ? "bg-primary/10 text-primary"
                                                            : "bg-muted text-muted-foreground"
                                                    )}
                                                >
                                                    {species.percentage.toFixed(0)}%
                                                </div>
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-0.5">
                                                {formatWeight(species.quantity)}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </div>

            {currentSpecies && (
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-muted-foreground">Productos</h3>
                        <div className="px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">
                            {currentSpecies.products.length} productos
                        </div>
                    </div>

                    <div className="border rounded-md max-h-80 overflow-y-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="text-left py-2 px-4 text-sm font-medium">Producto</th>
                                    <th className="text-right py-2 px-4 text-sm font-medium">Cantidad</th>
                                    <th className="text-right py-2 px-4 text-sm font-medium w-20">%</th>
                                </tr>
                            </thead>
                            <tbody >
                                {products.map((product) => {
                                    /* const opacity = getOpacity(product.weight, totalWeight) */
                                    return (
                                        <tr key={product.name} className="border-b border-muted last:border-0 hover:bg-muted/20">
                                            <td className="py-3 px-4 text-sm">{product.name}</td>
                                            <td className="py-3 px-4 text-sm text-right">{formatWeight(product.quantity)}</td>
                                            <td className="py-3 px-4 text-sm text-right">
                                                {product.productPercentage.toFixed(2)}%
                                            </td>
                                        </tr>
                                    )
                                })}
                                <tr className="bg-muted/30 font-medium">
                                    <td className="py-3 px-4 text-sm">Total</td>
                                    <td className="py-3 px-4 text-sm text-right">{formatDecimalWeight(currentSpecies.quantity)}</td>
                                    <td className="py-3 px-4 text-sm text-right">
                                       {currentSpecies.percentage.toFixed(2)}%
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
