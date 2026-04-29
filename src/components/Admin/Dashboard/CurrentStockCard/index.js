"use client"

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    formatDecimal,
    formatDecimalCurrency,
    formatDecimalWeight,
    formatInteger,
} from "@/helpers/formats/numbers/formatNumbers"
import { useTotalStockStats } from "@/hooks/useStockStats"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Info } from "lucide-react"

const LOW_COST_COVERAGE_THRESHOLD = 80

export function CurrentStockCard() {
    const { data, isLoading } = useTotalStockStats()
    const totalStockCost = Number(data?.totalStockCost ?? 0)
    const stockCostPerKg = Number(data?.stockCostPerKg ?? 0)
    const costCoverageWeightPct = Number(data?.costCoverageWeightPct ?? 0)
    const costCoverageBoxesPct = Number(data?.costCoverageBoxesPct ?? 0)

    const isLowCoverage =
        (costCoverageWeightPct < LOW_COST_COVERAGE_THRESHOLD ||
            costCoverageBoxesPct < LOW_COST_COVERAGE_THRESHOLD)

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
            className="relative p-4 rounded-2xl shadow-sm border h-full bg-gradient-to-t from-neutral-100 to-white dark:from-neutral-800 dark:to-neutral-900"
        >
            <CardHeader className="p-0 pb-2">
                <div className="flex justify-between items-center">
                    <CardDescription>
                        Stock actual
                    </CardDescription>
                </div>
                <CardTitle>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-medium tracking-tight">
                                {formatDecimalWeight(data?.totalNetWeight)}
                            </h1>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="inline-flex cursor-pointer">
                                        <Info className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent className="text-sm p-5 w-64">
                                    <div className="grid gap-2">
                                        <div className="text-[11px] font-semibold uppercase tracking-wider text-foreground-300">
                                            Coste valorado
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Importe total</span>
                                            <span className="font-medium">{formatDecimalCurrency(totalStockCost)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Coste medio</span>
                                            <span className="font-medium">{formatDecimal(stockCostPerKg)} €/kg</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Cobertura peso</span>
                                            <span className="font-medium">{formatDecimal(costCoverageWeightPct)}%</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Cobertura cajas</span>
                                            <span className="font-medium">{formatDecimal(costCoverageBoxesPct)}%</span>
                                        </div>
                                        {isLowCoverage && (
                                            <div className="text-xs text-foreground-300 italic">
                                                Cobertura baja: el importe es orientativo.
                                            </div>
                                        )}
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        </div>
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
