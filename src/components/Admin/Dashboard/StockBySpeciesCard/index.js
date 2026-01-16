"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { getStockBySpeciesStats } from "@/services/storeService"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDecimalWeight } from "@/helpers/formats/numbers/formatNumbers"
import { Package } from "lucide-react"

export function StockBySpeciesCard() {
    const { data: session, status } = useSession()
    const [stockData, setStockData] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    const accessToken = session?.user?.accessToken

    useEffect(() => {
        if (status !== "authenticated") return

        getStockBySpeciesStats(accessToken)
            .then(setStockData)
            .catch((err) => {
                console.error("Error al cargar stock por especie:", err)
                setStockData([])
            })
            .finally(() => setIsLoading(false))
    }, [status, accessToken])

    if (isLoading) return (
        <Card className="w-full max-w-full overflow-hidden">
            <CardHeader>
                <div>
                    <CardTitle className=" text-base">
                        <Skeleton className="h-6 w-40 mt-2" />
                    </CardTitle>
                    <CardDescription className=" ">
                        <Skeleton className="h-4 w-1/2 mt-2" />
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 mt-2 w-full mb-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex flex-col gap-1 w-full">
                        <div className="flex justify-between items-center w-full">
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-4 w-1/4" /> {/* No se ve */}
                        </div>
                        <Skeleton className="h-2 w-full rounded-full" />
                    </div>
                ))}
            </CardContent>
        </Card>
    )

    return (
        <Card className="w-full max-w-full overflow-hidden">
            <CardHeader className="">
                <div>
                    <CardTitle className=" text-base">
                        Stock por especie
                    </CardTitle>
                    <CardDescription className=" ">
                        Resumen del cantidad de stock por especie.
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 mt-2 mb-4">
                {stockData.length > 0 ? (
                    stockData.map((item) => (
                        <div key={item.id} className="space-y-1">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-foreground">
                                    {item.name}
                                </span>
                                <div className="text-sm text-muted-foreground font-mono flex gap-2 items-center">
                                    <span>{formatDecimalWeight(item.totalNetWeight)}</span>
                                    <span className="text-xs">({item.percentage}%)</span>
                                </div>
                            </div>
                            <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                                <div
                                    className="bg-primary h-full transition-all duration-500 ease-out"
                                    style={{ width: `${item.percentage}%` }}
                                />
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 min-h-[200px]">
                        <div className="relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-xl opacity-70" />
                            <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-background border shadow-xs">
                                <Package className="h-6 w-6 text-primary" strokeWidth={1.5} />
                            </div>
                        </div>
                        <h2 className="mt-4 text-lg font-medium tracking-tight">No hay stock disponible</h2>
                        <p className="mt-2 text-center text-muted-foreground max-w-[280px] text-xs whitespace-normal">
                            No se encontraron datos de stock por especie. Agrega productos al inventario para ver el resumen.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
