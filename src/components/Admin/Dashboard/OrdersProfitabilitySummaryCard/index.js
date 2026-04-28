"use client"

import { Calendar, Download, Info, Loader2 } from "lucide-react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { notify } from "@/lib/notifications"
import { useOrdersProfitabilitySummary } from "@/hooks/useOrdersStats"
import { formatDecimal, formatDecimalCurrency } from "@/helpers/formats/numbers/formatNumbers"
import { exportOrdersProfitabilitySummary } from "@/services/orderService"
import { useSession } from "next-auth/react"

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
  const [isExporting, setIsExporting] = useState(false)
  const { data: session } = useSession()
  const token = session?.user?.accessToken
  const { data, isLoading } = useOrdersProfitabilitySummary({})

  const handleExport = async () => {
    if (!token) {
      notify.error({ title: "No hay sesion activa para exportar" })
      return
    }

    if (!data?.period?.from || !data?.period?.to) {
      notify.error({ title: "No hay rango de fechas disponible para exportar" })
      return
    }

    try {
      setIsExporting(true)
      const blob = await exportOrdersProfitabilitySummary(
        {
          dateFrom: data.period.from,
          dateTo: data.period.to,
        },
        token
      )

      const url = window.URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = `auditoria_rentabilidad_pedidos_${data.period.from}_${data.period.to}.xlsx`
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      window.URL.revokeObjectURL(url)
      notify.success({ title: "Exportacion completada" })
    } catch (_error) {
      notify.error({ title: "No se pudo exportar la auditoria de margen" })
    } finally {
      setIsExporting(false)
    }
  }

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
        <CardContent className="px-0 pb-0">
          <div className="flex justify-end">
            <Skeleton className="h-4 w-4 rounded-full" />
          </div>
        </CardContent>
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
          </div>
          <Badge variant="outline" className="shrink-0">
            {formatNullablePercentage(data?.marginPercentage)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-0 pb-0">
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleExport}
            disabled={isLoading || isExporting || !data}
          >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Exportar Excel
          </Button>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
