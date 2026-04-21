"use client"

import { useMemo, useState } from "react"
import { Calendar, Info, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { DateRangePicker } from "@/components/ui/dateRangePicker"
import { Combobox } from "@/components/Shadcn/Combobox"
import { useOrdersProfitabilitySummary } from "@/hooks/useOrdersStats"
import { useProductOptions } from "@/hooks/useProductOptions"
import { actualYearRange } from "@/helpers/dates"
import { formatDecimal, formatDecimalCurrency } from "@/helpers/formats/numbers/formatNumbers"

const initialDateRange = {
  from: actualYearRange.from,
  to: actualYearRange.to,
}

const PRODUCT_ALL_OPTION = {
  value: "all",
  label: "Todos los productos",
}

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
  const [range, setRange] = useState(initialDateRange)
  const [productId, setProductId] = useState("all")
  const { productOptions, loading: productsLoading } = useProductOptions()
  const { data, isLoading } = useOrdersProfitabilitySummary({ range, productId })

  const comboboxOptions = useMemo(() => [PRODUCT_ALL_OPTION, ...productOptions], [productOptions])

  if (isLoading && !data) {
    return (
      <Card className="relative h-full rounded-2xl border bg-gradient-to-t from-neutral-100 to-white p-4 shadow-sm dark:from-neutral-800 dark:to-neutral-900">
        <CardHeader className="p-0 pb-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-9 w-36" />
          <Skeleton className="mt-2 h-3 w-28" />
        </CardHeader>
        <CardContent className="space-y-3 px-0 pb-4">
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        </CardContent>
        <CardFooter className="grid gap-2 px-0 pt-0">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardFooter>
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
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <p className="mt-1 text-xs italic text-muted-foreground">
              {data?.ordersCount ? `${data.ordersCount} pedidos en el rango` : "Sin pedidos en el rango"}
            </p>
          </div>
          <Badge variant="outline" className="shrink-0">
            {formatNullablePercentage(data?.marginPercentage)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="grid gap-3 px-0 pb-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border bg-background/70 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Importe</p>
            <p className="mt-1 text-base font-medium">{formatNullableCurrency(data?.totalRevenue)}</p>
          </div>
          <div className="rounded-xl border bg-background/70 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Coste</p>
            <p className="mt-1 text-base font-medium">{formatNullableCurrency(data?.totalCost)}</p>
          </div>
        </div>
        <Separator />
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="truncate">{formatDateRange(data?.period?.from, data?.period?.to)}</span>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        </div>
      </CardContent>

      <CardFooter className="grid gap-2 px-0 pt-0">
        <DateRangePicker dateRange={range} onChange={setRange} />
        <Combobox
          options={comboboxOptions}
          placeholder="Todos los productos"
          searchPlaceholder="Buscar producto..."
          notFoundMessage="No se encontraron productos"
          value={productId}
          onChange={(value) => setProductId(value || "all")}
          loading={productsLoading}
        />
      </CardFooter>
    </Card>
  )
}
