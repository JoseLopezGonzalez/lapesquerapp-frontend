"use client"

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { formatDecimalWeight, formatInteger } from "@/helpers/formats/numbers/formatNumbers"
import { useTotalStockStats } from "@/hooks/useStockStats"
import { Skeleton } from "@/components/ui/skeleton"

export function CurrentStockCard() {
    const { data, isLoading } = useTotalStockStats()

    if (isLoading) return (
        <Card className="relative p-4 rounded-2xl shadow-sm border h-full bg-gradient-to-t from-neutral-100 to-white dark:from-neutral-800 dark:to-neutral-900">
            <CardHeader className="p-0 pb-2">
                <div className="flex justify-between items-center mb-2">
                    <Skeleton className="w-28 h-4" />
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

    return (
        <Card
            className="relative p-4 rounded-2xl shadow-sm border h-full bg-gradient-to-t from-neutral-100 to-white dark:from-neutral-800 dark:to-neutral-900 cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => (window.location.href = "/admin/stores-manager")}
        >
            <CardHeader className="p-0 pb-2">
                <div className="flex justify-between items-center">
                    <CardDescription>
                        Stock actual
                    </CardDescription>
                </div>
                <CardTitle>
                    <div>
                        <h1 className="text-3xl font-medium tracking-tight">
                            {formatDecimalWeight(data?.totalNetWeight)}
                        </h1>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 italic">
                            {formatInteger(data?.totalPallets)} palets, {formatInteger(data?.totalBoxes)} cajas
                            {data?.totalStores != null && ` · ${data.totalStores} almacenes`}
                        </div>
                    </div>
                </CardTitle>
            </CardHeader>
        </Card>
    )
}
