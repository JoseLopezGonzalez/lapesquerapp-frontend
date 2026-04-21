"use client"

import { useMemo, useState } from "react"
import { Loader2, SearchX } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DateRangePicker } from "@/components/ui/dateRangePicker"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useOrdersProfitabilityProducts } from "@/hooks/useOrdersStats"
import { actualYearRange } from "@/helpers/dates"
import { formatDecimal, formatDecimalCurrency, formatDecimalWeight } from "@/helpers/formats/numbers/formatNumbers"

const initialDateRange = {
  from: actualYearRange.from,
  to: actualYearRange.to,
}

const metricLabels = {
  grossMargin: "Margen bruto",
  marginPercentage: "Margen %",
  totalRevenue: "Importe",
}

function formatNullableCurrency(value) {
  return typeof value === "number" ? formatDecimalCurrency(value) : "—"
}

function formatNullablePercentage(value) {
  return typeof value === "number" ? `${formatDecimal(value)} %` : "—"
}

export function OrdersProfitabilityProductsCard() {
  const [range, setRange] = useState(initialDateRange)
  const [metric, setMetric] = useState("grossMargin")
  const [search, setSearch] = useState("")
  const { data, isLoading } = useOrdersProfitabilityProducts({ range })

  const products = data?.products ?? []
  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    if (!normalizedSearch) return products

    return products.filter((item) =>
      item.product?.name?.toLowerCase().includes(normalizedSearch)
    )
  }, [products, search])

  const totalWeight = useMemo(
    () => filteredProducts.reduce((sum, item) => sum + (item.totalWeightKg || 0), 0),
    [filteredProducts]
  )

  const totalOrders = useMemo(
    () => filteredProducts.reduce((sum, item) => sum + (item.ordersCount || 0), 0),
    [filteredProducts]
  )

  return (
    <Card className="w-full max-w-full overflow-hidden">
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-1">
          <CardTitle>Rentabilidad por producto</CardTitle>
          <CardDescription>
            Desglose tabular de importe, coste y margen por producto expedido.
          </CardDescription>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <DateRangePicker dateRange={range} onChange={setRange} />
          <div className="grid grid-cols-1 gap-2 xl:grid-cols-[minmax(0,1fr)_180px]">
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar producto"
            />
            <Select value={metric} onValueChange={setMetric}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grossMargin">Orden: Margen bruto</SelectItem>
                <SelectItem value="marginPercentage">Orden: Margen %</SelectItem>
                <SelectItem value="totalRevenue">Orden: Importe</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="min-h-0">
        {isLoading ? (
          <div className="space-y-3">
            <div className="rounded-md border">
              <div className="border-b px-4 py-3">
                <div className="grid grid-cols-4 gap-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
              <div className="space-y-2 p-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="grid grid-cols-4 gap-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        ) : filteredProducts.length > 0 ? (
          <ScrollArea className="h-[340px] w-full rounded-md border">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-background">
                <TableRow>
                  <TableHead className="min-w-[220px]">Producto</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">Importe</TableHead>
                  <TableHead className="text-right">Coste</TableHead>
                  <TableHead className="text-right">Margen bruto</TableHead>
                  <TableHead className="text-right">Margen %</TableHead>
                  <TableHead className="text-right">Pedidos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...filteredProducts]
                  .sort((a, b) => {
                    const aValue = typeof a?.[metric] === "number" ? a[metric] : Number.NEGATIVE_INFINITY
                    const bValue = typeof b?.[metric] === "number" ? b[metric] : Number.NEGATIVE_INFINITY
                    return bValue - aValue
                  })
                  .map((item) => (
                    <TableRow key={item.product?.id ?? item.product?.name}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col gap-0.5">
                          <span>{item.product?.name ?? "Sin producto"}</span>
                          <span className="text-xs text-muted-foreground">
                            Prioridad visual: {metricLabels[metric]}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatDecimalWeight(item.totalWeightKg ?? 0)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNullableCurrency(item.totalRevenue)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNullableCurrency(item.totalCost)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNullableCurrency(item.grossMargin)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNullablePercentage(item.marginPercentage)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {item.ordersCount ?? 0}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </ScrollArea>
        ) : (
          <div className="flex min-h-[280px] flex-col items-center justify-center py-8">
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 blur-xl opacity-70" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-full border bg-background shadow-xs">
                <SearchX className="h-6 w-6 text-primary" strokeWidth={1.5} />
              </div>
            </div>
            <h2 className="mt-4 text-lg font-medium tracking-tight">
              {products.length === 0 ? "Sin datos" : "No se encontraron resultados"}
            </h2>
            <p className="mt-2 max-w-[320px] text-center text-xs text-muted-foreground">
              {products.length === 0
                ? "Ajusta el rango de fechas para ver el desglose de rentabilidad por producto."
                : "No hay productos que coincidan con tu búsqueda. Intenta con otros términos."}
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-2 border-t bg-muted/50 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
        <span className="text-muted-foreground">
          {filteredProducts.length > 0
            ? `${filteredProducts.length} productos · ${totalOrders} apariciones en pedidos`
            : "* Solo se incluyen productos con expediciones en el rango."}
        </span>
        <span className="font-semibold tabular-nums text-foreground">
          {formatDecimalWeight(totalWeight)}
        </span>
      </CardFooter>
    </Card>
  )
}
