"use client"

import { useMemo, useState } from "react"
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { Loader2, SearchX } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { DateRangePicker } from "@/components/ui/dateRangePicker"
import { useOrdersProfitabilityProducts } from "@/hooks/useOrdersStats"
import { actualYearRange } from "@/helpers/dates"
import { formatDecimal, formatDecimalCurrency, formatDecimalWeight } from "@/helpers/formats/numbers/formatNumbers"

const initialDateRange = {
  from: actualYearRange.from,
  to: actualYearRange.to,
}

const metricConfig = {
  grossMargin: {
    label: "Margen bruto",
    color: "var(--chart-1)",
    formatter: (value) => (typeof value === "number" ? formatDecimalCurrency(value) : "—"),
  },
  marginPercentage: {
    label: "Margen %",
    color: "var(--chart-2)",
    formatter: (value) => (typeof value === "number" ? `${formatDecimal(value)} %` : "—"),
  },
  totalRevenue: {
    label: "Importe",
    color: "var(--chart-3)",
    formatter: (value) => (typeof value === "number" ? formatDecimalCurrency(value) : "—"),
  },
}

export function OrdersProfitabilityProductsCard() {
  const [range, setRange] = useState(initialDateRange)
  const [metric, setMetric] = useState("grossMargin")
  const { data, isLoading } = useOrdersProfitabilityProducts({ range })

  const selectedMetric = metricConfig[metric]
  const products = data?.products ?? []
  const chartData = useMemo(
    () =>
      products.slice(0, 8).map((item) => ({
        name: item.product?.name ?? "Sin producto",
        value: typeof item[metric] === "number" ? item[metric] : null,
        totalWeightKg: item.totalWeightKg,
        totalRevenue: item.totalRevenue,
        totalCost: item.totalCost,
        grossMargin: item.grossMargin,
        marginPercentage: item.marginPercentage,
        ordersCount: item.ordersCount,
      })),
    [products, metric]
  )

  return (
    <Card className="w-full max-w-full overflow-hidden">
      <CardHeader className="space-y-4 pb-2">
        <div className="flex flex-col gap-1">
          <CardTitle>Rentabilidad por producto</CardTitle>
          <CardDescription>
            Productos expedidos en el periodo, ordenados por importe total.
          </CardDescription>
        </div>
        <DateRangePicker dateRange={range} onChange={setRange} />
      </CardHeader>

      <CardContent>
        <div className="h-[320px] w-full">
          {isLoading ? (
            <div className="flex h-full w-full flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">Cargando datos...</p>
            </div>
          ) : !chartData.length ? (
            <div className="flex h-full w-full flex-col items-center justify-center">
              <div className="relative">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 blur-xl opacity-70" />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-full border bg-background shadow-xs">
                  <SearchX className="h-6 w-6 text-primary" strokeWidth={1.5} />
                </div>
              </div>
              <h2 className="mt-3 text-lg font-medium tracking-tight">Sin datos</h2>
              <p className="mt-3 mb-2 max-w-[320px] text-center text-xs text-muted-foreground">
                Ajusta el rango de fechas para ver el desglose de rentabilidad por producto.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(chartData.length * 46, 260)}>
              <ChartContainer
                config={{
                  value: {
                    label: selectedMetric.label,
                    color: selectedMetric.color,
                  },
                }}
              >
                <BarChart
                  data={chartData}
                  layout="vertical"
                  barCategoryGap={12}
                  margin={{ right: 90, top: 8, bottom: 8 }}
                >
                  <CartesianGrid horizontal={false} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} hide />
                  <XAxis type="number" hide />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        indicator="line"
                        formatter={(value, _name, item) => {
                          const payload = item?.payload
                          return (
                            <div className="grid w-full gap-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-muted-foreground">{selectedMetric.label}</span>
                                <span className="font-semibold">{selectedMetric.formatter(value)}</span>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-muted-foreground">Cantidad</span>
                                <span className="font-medium">{formatDecimalWeight(payload?.totalWeightKg ?? 0)}</span>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-muted-foreground">Importe</span>
                                <span className="font-medium">{metricConfig.totalRevenue.formatter(payload?.totalRevenue)}</span>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-muted-foreground">Coste</span>
                                <span className="font-medium">{metricConfig.grossMargin.formatter(payload?.totalCost)}</span>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-muted-foreground">Pedidos</span>
                                <span className="font-medium">{payload?.ordersCount ?? 0}</span>
                              </div>
                            </div>
                          )
                        }}
                      />
                    }
                  />
                  <Bar dataKey="value" fill={selectedMetric.color} radius={4} barSize={28}>
                    <LabelList
                      dataKey="value"
                      position="right"
                      offset={8}
                      className="fill-foreground text-nowrap"
                      fontSize={12}
                      formatter={selectedMetric.formatter}
                    />
                    <LabelList
                      dataKey="name"
                      position="insideLeft"
                      offset={8}
                      className="fill-background text-nowrap"
                      fontSize={12}
                      formatter={(name) => name}
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 border-t bg-muted/50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm text-muted-foreground">
          {!isLoading && products.length > 0
            ? `Mostrando ${Math.min(products.length, 8)} de ${products.length} productos del periodo`
            : !isLoading
              ? "* Solo se incluyen productos con expediciones en el rango."
              : ""}
        </span>
        <Select value={metric} onValueChange={setMetric}>
          <SelectTrigger className="h-8 w-full text-sm sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="grossMargin">Margen bruto</SelectItem>
            <SelectItem value="marginPercentage">Margen %</SelectItem>
            <SelectItem value="totalRevenue">Importe</SelectItem>
          </SelectContent>
        </Select>
      </CardFooter>
    </Card>
  )
}
