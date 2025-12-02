"use client"

import { useEffect, useState } from "react"
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Loader } from "lucide-react"
import { useSession } from "next-auth/react"
import { getOrdersTotalAmountStats } from "@/services/orderService" // <-- función que debes implementar
import { formatDecimalCurrency } from "@/helpers/formats/numbers/formatNumbers" // formateador de moneda

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
    }, [status])

    const percentage = data?.percentageChange
    const hasValidPercentage = typeof percentage === "number" && !isNaN(percentage)
    const isUp = hasValidPercentage && percentage > 0
    const isDown = hasValidPercentage && percentage < 0
    const TrendIcon = isUp ? TrendingUp : isDown ? TrendingDown : null
    const trendText = isUp ? "al alza" : isDown ? "a la baja" : null
    const trendColor = isUp ? "text-green-600" : isDown ? "text-red-600" : ""

    // console.log(data)

    return (
        <Card className="relative p-4 rounded-2xl shadow-sm border h-fit bg-gradient-to-t from-foreground-100 to-background dark:from-gray-800 dark:to-gray-900">
            <CardHeader className="p-0 pb-2">
                <div className="flex justify-between items-center">
                    <CardDescription className="text-sm text-muted-foreground">
                        Importe vendido
                    </CardDescription>
                    <div>
                        {hasValidPercentage && TrendIcon && (
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
                <CardTitle className="text-3xl font-medium tracking-tight">
                    {isLoading ? (
                        <div className="h-8 flex items-center">
                            <Loader className="w-4 h-4 animate-spin text-muted-foreground" />
                        </div>
                    ) : data?.value !== null ? (
                        formatDecimalCurrency(data.value)
                    ) : (
                        <span className="text-muted-foreground text-base">Sin datos</span>
                    )}
                </CardTitle>
            </CardHeader>

            <CardFooter className="flex-col items-start gap-1.5 text-sm mt-4 mb-6 p-0">
                <div className="flex items-center font-medium">
                    {trendText ? (
                        <>
                            Tendencia {trendText} respecto al año pasado
                            {TrendIcon && (
                                <TrendIcon className={`ml-2 w-4 h-4 ${trendColor}`} />
                            )}
                        </>
                    ) : (
                        <>Sin comparación disponible</>
                    )}
                </div>
                <div className="text-muted-foreground text-xs">
                    Importe vendido desde enero hasta hoy
                </div>
            </CardFooter>
        </Card>
    )
}
