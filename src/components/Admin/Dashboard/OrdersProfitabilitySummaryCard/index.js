"use client"

import { Calendar, Info } from "lucide-react"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useOrdersProfitabilitySummary } from "@/hooks/useOrdersStats"
import { formatDecimal, formatDecimalCurrency, formatInteger } from "@/helpers/formats/numbers/formatNumbers"

const LOW_COST_COVERAGE_THRESHOLD = 80

function formatDateRange(from, to) {
  if (!from || !to) return "Rango no definido"
  const start = new Date(from).toLocaleDateString("es-ES")
  const end = new Date(to).toLocaleDateString("es-ES")
  return `${start} → ${end}`
}

function formatNullableCurrency(value) {
  return typeof value === "number" ? formatDecimalCurrency(value) : "—"
}

function formatNullablePercentage(value) {
  return typeof value === "number" ? `${formatDecimal(value)} %` : "—"
}

export function OrdersProfitabilitySummaryCard() {
  const { data, isLoading } = useOrdersProfitabilitySummary({})
  const costCoverageBoxesPct = Number(data?.costCoverageBoxesPct ?? 0)
  const isLowCoverage = data && costCoverageBoxesPct < LOW_COST_COVERAGE_THRESHOLD

  if (isLoading && !data) {
    return (
      <Card className="relative h-full rounded-2xl border bg-gradient-to-t from-neutral-100 to-white p-4 shadow-sm dark:from-neutral-800 dark:to-neutral-900">
        <CardHeader className="p-0 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Skeleton className="h-4 w-36" />
              <div className="mt-2 flex items-start gap-2">
                <Skeleton className="h-9 w-36" />
                <Skeleton className="mt-1 h-4 w-4 rounded-full" />
              </div>
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="relative h-full rounded-2xl border bg-gradient-to-t from-neutral-100 to-white p-4 shadow-sm dark:from-neutral-800 dark:to-neutral-900">
      <CardHeader className="p-0 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardDescription>Rentabilidad de pedidos</CardDescription>
            <div className="mt-1 flex items-start gap-2">
              <CardTitle className="text-3xl font-medium tracking-tight">
                {formatNullableCurrency(data?.grossMargin)}
              </CardTitle>
              {data && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="mt-1 shrink-0 text-muted-foreground transition-colors hover:text-foreground">
                      <Info className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="w-72 p-4 text-sm">
                    <div className="grid gap-2">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Periodo
                        </span>
                        <span className="flex items-center gap-1 text-xs">
                          <Calendar className="h-3 w-3" />
                          {formatDateRange(data.period?.from, data.period?.to)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span>Pedidos</span>
                        <span className="font-medium">{data.ordersCount ?? 0}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span>Importe</span>
                        <span className="font-medium">{formatNullableCurrency(data.totalRevenue)}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span>Coste</span>
                        <span className="font-medium">{formatNullableCurrency(data.totalCost)}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span>Margen bruto</span>
                        <span className="font-medium">{formatNullableCurrency(data.grossMargin)}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span>Margen %</span>
                        <span className="font-medium">{formatNullablePercentage(data.marginPercentage)}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span>% cajas con coste</span>
                        <span className="font-medium">{formatNullablePercentage(data.costCoverageBoxesPct)}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span>Cajas con coste</span>
                        <span className="font-medium">{formatInteger(data.coveredBoxes ?? 0)}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span>Cajas sin coste</span>
                        <span className="font-medium">{formatInteger(data.uncoveredBoxes ?? 0)}</span>
                      </div>
                      {isLowCoverage && (
                        <div className="text-xs italic text-muted-foreground">
                          Cobertura baja: el margen es orientativo.
                        </div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            {data && (
              <div className="mt-1 text-xs text-muted-foreground">
                {formatNullablePercentage(data.costCoverageBoxesPct)} cajas con coste
              </div>
            )}
          </div>
          <Badge variant="outline" className="shrink-0">
            {formatNullablePercentage(data?.marginPercentage)}
          </Badge>
        </div>
      </CardHeader>
    </Card>
  )
}
