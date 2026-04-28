"use client"

import { Calendar, Download, Info, Loader2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { notify } from "@/lib/notifications"
import { useOrdersProfitabilitySummary } from "@/hooks/useOrdersStats"
import { formatDecimal, formatDecimalCurrency } from "@/helpers/formats/numbers/formatNumbers"
import {
  createOrdersProfitabilityExportJob,
  downloadOrdersProfitabilityExportJob,
  getOrdersProfitabilityExportJob,
} from "@/services/orderService"
import { useSession } from "next-auth/react"

const POLL_INTERVAL_MS = 3000

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

function sleep(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function getExportStatusMessage(job, isCreating) {
  if (isCreating) return "Exportación en cola..."
  if (job?.status === "pending") return "Exportación en cola..."
  if (job?.status === "processing") return "Generando Excel..."
  if (job?.status === "finished") return "Excel listo para descargar."
  if (job?.status === "failed") return job.errorMessage || "No se pudo generar el Excel. Inténtalo de nuevo."
  return null
}

export function OrdersProfitabilitySummaryCard() {
  const [exportJob, setExportJob] = useState(null)
  const [isCreatingExport, setIsCreatingExport] = useState(false)
  const [isPollingExport, setIsPollingExport] = useState(false)
  const [isDownloadingExport, setIsDownloadingExport] = useState(false)
  const isMountedRef = useRef(true)
  const { data: session } = useSession()
  const token = session?.user?.accessToken
  const { data, isLoading } = useOrdersProfitabilitySummary({})
  const isExportBusy = isCreatingExport || isPollingExport || isDownloadingExport
  const exportStatusMessage = getExportStatusMessage(exportJob, isCreatingExport)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const downloadExport = async (job) => {
    if (!token) {
      notify.error({ title: "No hay sesion activa para descargar" })
      return
    }

    if (!job?.downloadUrl) {
      notify.error({ title: "El Excel todavia no esta disponible" })
      return
    }

    try {
      setIsDownloadingExport(true)
      const { blob, filename } = await downloadOrdersProfitabilityExportJob(job.downloadUrl, token)
      const url = window.URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = filename
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      window.URL.revokeObjectURL(url)
      notify.success({ title: "Descarga iniciada" })
    } catch (_error) {
      notify.error({ title: "No se pudo descargar el Excel" })
    } finally {
      if (isMountedRef.current) {
        setIsDownloadingExport(false)
      }
    }
  }

  const handleGenerateExport = async () => {
    if (!token) {
      notify.error({ title: "No hay sesion activa para exportar" })
      return
    }

    if (!data?.period?.from || !data?.period?.to) {
      notify.error({ title: "No hay rango de fechas disponible para exportar" })
      return
    }

    try {
      setIsCreatingExport(true)
      setExportJob(null)
      const initialJob = await createOrdersProfitabilityExportJob(
        {
          dateFrom: data.period.from,
          dateTo: data.period.to,
          productIds: [],
          onlyMissingCosts: true,
        },
        token
      )

      if (!isMountedRef.current) return

      setExportJob(initialJob)
      setIsCreatingExport(false)
      setIsPollingExport(initialJob.status !== "finished" && initialJob.status !== "failed")

      let currentJob = initialJob
      while (currentJob.status !== "finished" && currentJob.status !== "failed") {
        await sleep(POLL_INTERVAL_MS)
        if (!isMountedRef.current) return
        currentJob = await getOrdersProfitabilityExportJob(initialJob.id, token)
        if (!isMountedRef.current) return
        setExportJob(currentJob)
      }

      if (currentJob.status === "finished") {
        notify.success({ title: "Excel listo para descargar" })
      } else {
        const message = currentJob.errorMessage || "No se pudo generar el Excel. Intentalo de nuevo."
        notify.error({ title: message })
      }
    } catch (_error) {
      const message = "No se pudo generar el Excel. Intentalo de nuevo."
      notify.error({ title: message })
    } finally {
      if (isMountedRef.current) {
        setIsCreatingExport(false)
        setIsPollingExport(false)
      }
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
            onClick={exportJob?.status === "finished" ? () => downloadExport(exportJob) : handleGenerateExport}
            disabled={isLoading || isExportBusy || !data}
          >
            {isExportBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {exportJob?.status === "finished" ? "Descargar Excel" : exportJob?.status === "failed" ? "Reintentar" : "Generar Excel"}
          </Button>
          {exportStatusMessage ? (
            <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
              {exportStatusMessage}
            </span>
          ) : null}
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
