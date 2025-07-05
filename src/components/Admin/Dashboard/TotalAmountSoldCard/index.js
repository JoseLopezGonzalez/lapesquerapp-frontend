"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { TrendingUp, TrendingDown, Info, Calendar } from "lucide-react"
import { useSession } from "next-auth/react"
import { getOrdersTotalAmountStats } from "@/services/orderService"
import { formatDecimalCurrency } from "@/helpers/formats/numbers/formatNumbers"

export function TotalAmountSoldCard() {
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

        getOrdersTotalAmountStats({ dateFrom, dateTo }, token)
            .then(setData)
            .catch((err) => {
                console.error("Error al obtener el importe total:", err)
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

    const formatDateRange = (from, to) => {
        const f = new Date(from).toLocaleDateString("es-ES")
        const t = new Date(to).toLocaleDateString("es-ES")
        return `${f} → ${t}`
    }

    if (isLoading) {
        return (
            <Card className="relative p-4 rounded-2xl shadow-sm border h-full bg-gradient-to-t from-foreground-100 to-background dark:from-gray-800 dark:to-gray-900">
                <CardHeader className="p-0 pb-2">
                    <div className="flex justify-between items-center mb-2">
                        <Skeleton className="w-44 h-4 " />
                        <Skeleton className="h-4 w-12" />
                    </div>
                    <CardTitle>
                        <div className="flex flex-col gap-2 mt-2">
                            <Skeleton className="h-8 w-36" />
                            <Skeleton className="h-3 w-40" />
                        </div>
                    </CardTitle>
                </CardHeader>
            </Card>
        )
    }


    return (
        <Card className="p-4 rounded-2xl shadow-sm border h-full bg-gradient-to-t from-foreground-100 to-background dark:from-gray-800 dark:to-gray-900">
            <CardHeader className="p-0 pb-2">
                <div className="flex justify-between items-center">
                    <CardDescription className="text-sm text-muted-foreground">
                        Importe Total de Ventas
                    </CardDescription>
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

                <CardTitle>
                    {data?.value !== null ? (
                        <div>
                            <h1 className="text-3xl font-medium tracking-tight flex gap-2 items-center">
                                {formatDecimalCurrency(data.subtotal)}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="w-4 h-4 cursor-pointer" />
                                    </TooltipTrigger>
                                    <TooltipContent className="text-sm p-5 w-64">
                                        <div className="grid gap-2">

                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[11px] font-semibold text-foreground-300 uppercase tracking-wider">
                                                    Año en curso
                                                </span>
                                                <span className="text-xs text-foreground-300 ml-1 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDateRange(data.range.from, data.range.to)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>Importe</span>
                                                <span className="font-medium">{formatDecimalCurrency(data.value)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>Subtotal</span>
                                                <span className="font-medium">{formatDecimalCurrency(data.subtotal)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>IVA</span>
                                                <span className="font-medium">{formatDecimalCurrency(data.tax)}</span>
                                            </div>

                                            {data.comparisonValue && (
                                                <div>
                                                    <Separator className="my-2 bg-foreground-300" />
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-[11px] font-semibold text-foreground-300 uppercase tracking-wider">
                                                            Año anterior
                                                        </span>
                                                        <span className="text-xs text-foreground-300 ml-1 flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {formatDateRange(data.range.fromPrev, data.range.toPrev)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span>Importe</span>
                                                        <span className="font-medium">{formatDecimalCurrency(data.comparisonValue)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span>Subtotal</span>
                                                        <span className="font-medium">{formatDecimalCurrency(data.comparisonSubtotal)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span>IVA</span>
                                                        <span className="font-medium">{formatDecimalCurrency(data.comparisonTax)}</span>
                                                    </div>
                                                </div>
                                            )}

                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </h1>
                            <div className="text-xs text-gray-500 mt-1 italic">
                                {formatDecimalCurrency(data.value)} con IVA
                            </div>
                        </div>
                    ) : (
                        <span className="text-muted-foreground text-base">Sin datos</span>
                    )}
                </CardTitle>
            </CardHeader>
        </Card >
    )
}
