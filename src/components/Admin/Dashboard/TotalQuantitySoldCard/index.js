"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown } from "lucide-react"
import { useSession } from "next-auth/react"
import { getOrdersTotalNetWeightStats } from "@/services/orderService"
import { formatDecimalWeight } from "@/helpers/formats/numbers/formatNumbers"
import { Skeleton } from "@/components/ui/skeleton"

export function TotalQuantitySoldCard() {
    const { data: session, status } = useSession()
    const [data, setData] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (status !== "authenticated") return

        const today = new Date()
        const firstDay = new Date(today.getFullYear(), 0, 1)
        const dateFrom = firstDay.toISOString().split("T")[0]
        const dateTo = today.toISOString().split("T")[0]
        const token = session.user.accessToken

        getOrdersTotalNetWeightStats({ dateFrom, dateTo }, token)
            .then(setData)
            .catch((err) => {
                console.error("Error al obtener la cantidad total:", err)
                setData(null)
            })
            .finally(() => setIsLoading(false))
    }, [status, session])

    const percentage = data?.percentageChange
    const hasValidPercentage = typeof percentage === "number" && !isNaN(percentage)
    const isUp = hasValidPercentage && percentage > 0
    const isDown = hasValidPercentage && percentage < 0
    const TrendIcon = isUp ? TrendingUp : isDown ? TrendingDown : null
    const trendColor = isUp ? "text-green-600" : isDown ? "text-red-600" : ""

    if (isLoading) return (
        <Card className="relative p-4 rounded-2xl shadow-sm border h-full bg-gradient-to-t from-foreground-100 to-background dark:from-gray-800 dark:to-gray-900">
            <CardHeader className="p-0 pb-2">
                <div className="flex justify-between items-center mb-2">
                    <Skeleton className="w-44 h-4 " />
                    <Skeleton className="h-4 w-12 " />
                </div>
                <CardTitle>
                    <div className="flex flex-col gap-2 mt-2">
                        <Skeleton className="h-8 w-36 " />
                        <Skeleton className="h-3 w-28 " />
                    </div>
                </CardTitle>
            </CardHeader>
        </Card>
    )


    return (
        <Card className="relative p-4 rounded-2xl shadow-sm border h-full bg-gradient-to-t from-foreground-100 to-background dark:from-gray-800 dark:to-gray-900">
            <CardHeader className="p-0 pb-2">
                <div className="flex justify-between items-center">
                    <CardDescription className="text-sm text-muted-foreground">
                        Cantidad Total de Ventas
                    </CardDescription>
                    <div>
                        {hasValidPercentage && (
                            <Badge
                                variant="outline"
                                className={`flex items-center gap-1 text-xs px-2 py-1 ${trendColor}`}
                            >
                                <TrendIcon className="w-3 h-3" />
                                {percentage > 0 ? "+" : ""}
                                {percentage.toFixed(1)}%
                            </Badge>
                        )}
                    </div>
                </div>
                <CardTitle className=" ">
                    {data?.value !== null ? (
                        <div>
                            <h1 className="text-3xl font-medium tracking-tight">{formatDecimalWeight(data.value)}</h1>
                            <div className="text-xs text-gray-500 mt-1 italic">
                                {!data?.comparisonValue
                                    ? "No hay datos de años anteriores"
                                    : `${formatDecimalWeight(data?.comparisonValue)} el año anterior`
                                }
                            </div>
                        </div>
                    ) : (
                        <span className="text-muted-foreground text-base">Sin datos</span>
                    )}
                </CardTitle>
            </CardHeader>
        </Card>
    )
}
