"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { getStockBySpecies } from "@/services/storeService"
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDecimalWeight } from "@/helpers/formats/numbers/formatNumbers"

export function StockBySpeciesCard() {
    const { data: session, status } = useSession()
    const [stockData, setStockData] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (status !== "authenticated") return

        getStockBySpecies(session.user.accessToken)
            .then(setStockData)
            .catch((err) => {
                console.error("Error al cargar stock por especie:", err)
                setStockData([])
            })
            .finally(() => setIsLoading(false))
    }, [status])

    return (
        <Card className="">
            <CardHeader className="">
                <CardTitle className="text-xl font-semibold">
                    Stock por especie
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                    Total actual en kilos por especie (palets almacenados)
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 mt-2">
                {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex flex-col gap-1">
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-2 w-full rounded-full" />
                        </div>
                    ))
                ) : stockData.length > 0 ? (
                    stockData.map((item) => (
                        <div key={item.id} className="space-y-1">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-foreground">
                                    {item.name}
                                </span>
                                <div className="text-sm text-muted-foreground font-mono flex gap-2 items-center">
                                    <span>{formatDecimalWeight(item.total_kg)}</span>
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
                    <div className="text-muted-foreground text-sm">
                        Sin datos de stock
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
