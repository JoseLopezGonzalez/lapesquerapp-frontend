'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import {
  AlertCircle,
  ArrowDownUp,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleX,
  ClipboardCheck,
  Euro,
  Eye,
  Factory,
  Filter,
  Flame,
  Info,
  Loader2,
  LockKeyhole,
  PackageSearch,
  RefreshCcw,
  Scale,
  Search,
  ShieldAlert,
  TriangleAlert,
  Warehouse,
  X,
} from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DateRangePicker } from '@/components/ui/dateRangePicker'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useProductionControlPanel } from '@/hooks/production/useProductionControlPanel'
import { notify } from '@/lib/notifications'
import { cn } from '@/lib/utils'
import { closeProduction } from '@/services/productionService'

const PER_PAGE = 25

const STATUS_META = {
  closed: { label: 'Cerrada', variant: 'secondary', icon: CheckCircle2 },
  not_reconciled: { label: 'No conciliada', variant: 'destructive', icon: CircleX },
  ready_to_close: { label: 'Lista para cerrar', variant: 'success', icon: CheckCircle2 },
  not_closeable: { label: 'No cerrable', variant: 'warning', icon: TriangleAlert },
  open: { label: 'Abierta', variant: 'info', icon: Factory },
}

const RECONCILIATION_META = {
  ok: { label: 'OK', variant: 'success', icon: CheckCircle2 },
  warning: { label: 'Aviso', variant: 'warning', icon: TriangleAlert },
  error: { label: 'Error', variant: 'destructive', icon: CircleX },
}

const SEVERITY_META = {
  critical: { label: 'Crítica', variant: 'destructive', icon: Flame },
  warning: { label: 'Limitación', variant: 'warning', icon: TriangleAlert },
  info: { label: 'Aviso', variant: 'info', icon: Info },
}

const ALERT_LABELS = {
  reconciliation_not_ok: 'Conciliación',
  no_processes: 'Sin procesos',
  process_not_started: 'Proceso sin inicio',
  process_not_finished: 'Proceso sin finalizar',
  final_node_no_outputs: 'Nodo final sin salidas',
  pending_order: 'Pedido pendiente',
  pallet_not_shipped: 'Palet sin expedir',
  stock_remaining: 'Stock pendiente',
  orphan_box: 'Caja sin ubicar',
  missing_cost: 'Coste incompleto',
  stock_without_production: 'Stock sin producción',
}

const OPERATIONAL_CODES = new Set(['stock_remaining', 'pending_order', 'pallet_not_shipped'])
const PROCESS_CODES = new Set(['no_processes', 'process_not_started', 'process_not_finished', 'final_node_no_outputs', 'orphan_box'])

function formatDateParam(date) {
  if (!date) return undefined
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDisplayDate(value) {
  if (!value) return 'Sin fecha'
  const date = new Date(`${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
}

function formatNumber(value, decimals = 0) {
  const number = Number(value)
  if (!Number.isFinite(number)) return '0'
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number)
}

function formatKg(value, decimals = 1, signed = false) {
  const number = Number(value)
  if (!Number.isFinite(number)) return '0 kg'
  const sign = signed && number > 0 ? '+' : ''
  return `${sign}${formatNumber(number, decimals)} kg`
}

function getStatusMeta(status) {
  return STATUS_META[status] ?? { label: status || 'Sin estado', variant: 'secondary', icon: AlertCircle }
}

function getReconciliationMeta(status) {
  return RECONCILIATION_META[status] ?? { label: status || 'N/D', variant: 'secondary', icon: AlertCircle }
}

function getSeverityMeta(severity) {
  return SEVERITY_META[severity] ?? SEVERITY_META.info
}

function getActionLabel(production, alert) {
  if (!alert) {
    if (production.status === 'ready_to_close') return 'Cerrar producción'
    if (production.status === 'not_reconciled') return 'Ver conciliación'
    if (production.status === 'closed') return 'Ver detalle'
    return 'Ver árbol de procesos'
  }

  const labels = {
    reconciliation_not_ok: 'Ver conciliación',
    no_processes: 'Ver árbol',
    process_not_started: 'Ver árbol',
    process_not_finished: 'Ver árbol',
    final_node_no_outputs: 'Revisar salidas',
    pending_order: 'Ver producción',
    pallet_not_shipped: 'Ver producción',
    stock_remaining: 'Buscar lote',
    orphan_box: 'Ver producción',
    missing_cost: 'Regularizar coste',
  }

  return labels[alert.code] || alert.action || 'Ver producción'
}

function getProductionActionHref(production, alert) {
  if (!alert) return `/admin/productions/${production.id}`
  if (alert.code === 'stock_remaining') return `/admin/boxes?lot=${encodeURIComponent(production.lot || '')}`
  if (alert.code === 'missing_cost') return `/admin/cost-regularization?lot=${encodeURIComponent(production.lot || '')}`
  return `/admin/productions/${production.id}`
}

function StatusBadge({ status }) {
  const meta = getStatusMeta(status)
  const Icon = meta.icon
  return (
    <Badge variant={meta.variant} className="gap-1">
      <Icon className="size-3" />
      {meta.label}
    </Badge>
  )
}

function ReconciliationBadge({ status }) {
  const meta = getReconciliationMeta(status)
  const Icon = meta.icon
  return (
    <Badge variant={meta.variant} className="gap-1">
      <Icon className="size-3" />
      {meta.label}
    </Badge>
  )
}

function SeverityBadge({ severity }) {
  const meta = getSeverityMeta(severity)
  const Icon = meta.icon
  return (
    <Badge variant={meta.variant} className="gap-1">
      <Icon className="size-3" />
      {meta.label}
    </Badge>
  )
}

function SummaryMetric({ icon: Icon, label, value, description, loading }) {
  return (
    <div className="rounded-lg border bg-card px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          {loading ? <Skeleton className="mt-2 h-6 w-16" /> : <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>}
          {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
        </div>
        <div className="rounded-md bg-muted p-2 text-muted-foreground">
          <Icon className="size-4" />
        </div>
      </div>
    </div>
  )
}

function Filters({ filters, setFilters, onApply, onReset, fetching }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="size-4" />
              Filtros
            </CardTitle>
            <CardDescription>El resumen es global; los filtros afectan solo a la tabla.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onReset}>
              <X className="mr-2 size-4" />
              Limpiar
            </Button>
            <Button type="button" size="sm" onClick={onApply} disabled={fetching}>
              {fetching ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Search className="mr-2 size-4" />}
              Aplicar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-6">
          <div className="space-y-1.5 lg:col-span-2">
            <Label htmlFor="production-control-lot">Lote</Label>
            <Input
              id="production-control-lot"
              value={filters.lot}
              onChange={(event) => setFilters((current) => ({ ...current, lot: event.target.value }))}
              placeholder="Buscar por lote"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Estado</Label>
            <Select value={filters.status || 'all'} onValueChange={(value) => setFilters((current) => ({ ...current, status: value === 'all' ? '' : value }))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="open">Abiertas</SelectItem>
                <SelectItem value="closed">Cerradas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Conciliación</Label>
            <Select
              value={filters.reconciliation_status || 'all'}
              onValueChange={(value) => setFilters((current) => ({ ...current, reconciliation_status: value === 'all' ? '' : value }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="ok">OK</SelectItem>
                <SelectItem value="warning">Aviso</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="production-control-species">ID especie</Label>
            <Input
              id="production-control-species"
              type="number"
              min="1"
              value={filters.species_id}
              onChange={(event) => setFilters((current) => ({ ...current, species_id: event.target.value }))}
              placeholder="Opcional"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Orden</Label>
            <Select value={`${filters.sort_by}:${filters.sort_dir}`} onValueChange={(value) => {
              const [sort_by, sort_dir] = value.split(':')
              setFilters((current) => ({ ...current, sort_by, sort_dir }))
            }}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="id:desc">Más recientes</SelectItem>
                <SelectItem value="date:desc">Fecha desc.</SelectItem>
                <SelectItem value="date:asc">Fecha asc.</SelectItem>
                <SelectItem value="lot:asc">Lote A-Z</SelectItem>
                <SelectItem value="lot:desc">Lote Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 md:col-span-2 lg:col-span-2">
            <Label>Rango de fechas</Label>
            <DateRangePicker
              dateRange={filters.dateRange}
              onChange={(range) => setFilters((current) => ({ ...current, dateRange: range || { from: undefined, to: undefined } }))}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function GlobalAlerts({ alerts }) {
  const visibleAlerts = alerts.slice(0, 5)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldAlert className="size-4" />
          Alertas globales
        </CardTitle>
        <CardDescription>Lotes o cajas que requieren revisión fuera de una producción concreta.</CardDescription>
      </CardHeader>
      <CardContent>
        {visibleAlerts.length === 0 ? (
          <div className="rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground">
            No hay alertas globales en este momento.
          </div>
        ) : (
          <div className="space-y-2">
            {visibleAlerts.map((alert, index) => (
              <div key={`${alert.code}-${alert.lot}-${index}`} className="rounded-lg border px-3 py-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <SeverityBadge severity={alert.severity} />
                    <span className="truncate text-sm font-medium">{alert.title || ALERT_LABELS[alert.code] || alert.code}</span>
                    {alert.lot ? <Badge variant="outline" className="font-mono">{alert.lot}</Badge> : null}
                  </div>
                  {alert.actions?.some((action) => action.type === 'open_lot_search') && alert.lot ? (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/boxes?lot=${encodeURIComponent(alert.lot)}`}>
                        <PackageSearch className="mr-2 size-4" />
                        Ver cajas
                      </Link>
                    </Button>
                  ) : null}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{alert.message}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {alert.product?.name ? <span>{alert.product.name}</span> : null}
                  {alert.weightKg != null ? <span>{formatKg(alert.weightKg)}</span> : null}
                  {alert.boxesCount != null ? <span>{formatNumber(alert.boxesCount)} cajas</span> : null}
                </div>
              </div>
            ))}
            {alerts.length > visibleAlerts.length ? (
              <p className="text-xs text-muted-foreground">Hay {alerts.length - visibleAlerts.length} alertas más. Ajusta el lote en inventario para investigarlas.</p>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ProductionTable({ productions, selectedProduction, onSelectProduction, loading }) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} className="h-10 w-full" />)}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Factory className="size-4" />
          Producciones
        </CardTitle>
        <CardDescription>Selecciona una fila para ver alertas agrupadas y acciones recomendadas.</CardDescription>
      </CardHeader>
      <CardContent>
        {productions.length === 0 ? (
          <Empty className="min-h-64 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <PackageSearch className="size-4" />
              </EmptyMedia>
              <EmptyTitle>No hay producciones con estos filtros</EmptyTitle>
              <EmptyDescription>Prueba a ampliar el rango de fechas o limpiar estado y conciliación.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-36">Lote</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Especie</TableHead>
                  <TableHead className="text-right">Entrada</TableHead>
                  <TableHead className="text-right">Producido</TableHead>
                  <TableHead className="text-right">Vendido</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Reprocesado</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Conciliación</TableHead>
                  <TableHead>Coste</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productions.map((production) => {
                  const metrics = production.metrics ?? {}
                  const balance = Number(metrics.balanceWeightKg) || 0
                  const reconciliationStatus = production.reconciliation?.status
                  const hasMissingCosts = production.costs?.hasMissingCosts
                  const isSelected = selectedProduction?.id === production.id
                  return (
                    <TableRow
                      key={production.id}
                      className={cn('cursor-pointer', isSelected && 'bg-muted/60')}
                      onClick={() => onSelectProduction(production)}
                    >
                      <TableCell>
                        <div className="font-mono text-sm font-medium">{production.lot || 'Sin lote'}</div>
                        <div className="text-xs text-muted-foreground">#{production.id}</div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{formatDisplayDate(production.date)}</TableCell>
                      <TableCell><StatusBadge status={production.status} /></TableCell>
                      <TableCell className="min-w-32 max-w-48 truncate">{production.species?.name || 'Sin especie'}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatKg(metrics.inputWeightKg)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatKg(metrics.producedWeightKg)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatKg(metrics.salesWeightKg)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatKg(metrics.stockWeightKg)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatKg(metrics.reprocessedWeightKg)}</TableCell>
                      <TableCell
                        className={cn(
                          'text-right font-medium tabular-nums',
                          balance < 0 && 'text-destructive',
                          balance > 0 && reconciliationStatus === 'error' && 'text-destructive',
                          balance > 0 && reconciliationStatus === 'warning' && 'text-amber-700 dark:text-amber-300',
                          balance === 0 && 'text-muted-foreground'
                        )}
                      >
                        {formatKg(balance, 1, true)}
                      </TableCell>
                      <TableCell><ReconciliationBadge status={reconciliationStatus} /></TableCell>
                      <TableCell>
                        {hasMissingCosts ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="warning" className="gap-1">
                                  <Euro className="size-3" />
                                  Coste parcial
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                {formatNumber(production.costs?.missingCostBoxesCount)} cajas, {formatKg(production.costs?.missingCostWeightKg)}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <Badge variant="success" className="gap-1">
                            <Euro className="size-3" />
                            Coste ok
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          <Button type="button" variant="ghost" size="icon-sm" onClick={() => onSelectProduction(production)}>
                            <Eye className="size-4" />
                            <span className="sr-only">Ver alertas</span>
                          </Button>
                          <Button asChild variant="ghost" size="icon-sm">
                            <Link href={`/admin/productions/${production.id}`}>
                              <Factory className="size-4" />
                              <span className="sr-only">Abrir producción</span>
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function AlertGroup({ title, alerts, production }) {
  if (!alerts.length) return null

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">{title}</h3>
      <div className="space-y-2">
        {alerts.map((alert, index) => (
          <div key={`${alert.code}-${index}`} className="rounded-lg border p-3">
            <div className="flex flex-wrap items-center gap-2">
              <SeverityBadge severity={alert.severity} />
              <Badge variant="outline">{ALERT_LABELS[alert.code] || alert.code}</Badge>
            </div>
            <p className="mt-2 text-sm leading-relaxed">{alert.message}</p>
            {alert.action ? <p className="mt-1 text-xs text-muted-foreground">{alert.action}</p> : null}
            <Button asChild size="sm" variant="outline" className="mt-3">
              <Link href={getProductionActionHref(production, alert)}>
                {getActionLabel(production, alert)}
              </Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

function groupProductionAlerts(alerts) {
  const groups = {
    critical: [],
    operational: [],
    process: [],
    cost: [],
    other: [],
  }

  for (const alert of alerts || []) {
    if (alert.severity === 'critical') groups.critical.push(alert)
    else if (OPERATIONAL_CODES.has(alert.code)) groups.operational.push(alert)
    else if (PROCESS_CODES.has(alert.code)) groups.process.push(alert)
    else if (alert.severity === 'info' || alert.code === 'missing_cost') groups.cost.push(alert)
    else groups.other.push(alert)
  }

  return groups
}

function ProductionSidePanel({ production, open, onOpenChange, onCloseProduction, closePending }) {
  const alerts = production?.alerts ?? []
  const groupedAlerts = groupProductionAlerts(alerts)
  const primaryAlert = alerts.find((alert) => alert.severity === 'critical') || alerts.find((alert) => alert.severity === 'warning') || alerts[0]
  const primaryHref = production ? getProductionActionHref(production, primaryAlert) : '#'
  const primaryLabel = production ? getActionLabel(production, primaryAlert) : 'Ver producción'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl">
        {production ? (
          <>
            <SheetHeader className="border-b">
              <div className="flex flex-wrap items-center gap-2 pr-8">
                <SheetTitle className="font-mono">{production.lot || `Producción #${production.id}`}</SheetTitle>
                <StatusBadge status={production.status} />
              </div>
              <SheetDescription>
                Producción #{production.id} · {production.species?.name || 'Sin especie'} · {formatDisplayDate(production.date)}
              </SheetDescription>
            </SheetHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
              <div className="grid grid-cols-2 gap-2 py-4">
                <div className="rounded-lg border px-3 py-2">
                  <p className="text-xs text-muted-foreground">Balance</p>
                  <p className="text-base font-semibold tabular-nums">{formatKg(production.metrics?.balanceWeightKg, 1, true)}</p>
                </div>
                <div className="rounded-lg border px-3 py-2">
                  <p className="text-xs text-muted-foreground">Conciliación</p>
                  <div className="mt-1"><ReconciliationBadge status={production.reconciliation?.status} /></div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {production.status === 'ready_to_close' ? (
                  <Button type="button" size="sm" onClick={() => onCloseProduction(production)} disabled={closePending}>
                    {closePending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <LockKeyhole className="mr-2 size-4" />}
                    Cerrar producción
                  </Button>
                ) : (
                  <Button asChild size="sm">
                    <Link href={primaryHref}>{primaryLabel}</Link>
                  </Button>
                )}
                <Button asChild size="sm" variant="outline">
                  <Link href={`/admin/productions/${production.id}`}>
                    Ver detalle
                  </Link>
                </Button>
              </div>

              <Separator className="my-4" />

              {alerts.length === 0 ? (
                <Alert>
                  <CheckCircle2 className="size-4" />
                  <AlertTitle>Sin alertas en esta producción</AlertTitle>
                  <AlertDescription>El endpoint no devuelve incidencias accionables para este lote.</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-5">
                  <AlertGroup title="Alertas graves" alerts={groupedAlerts.critical} production={production} />
                  <AlertGroup title="Limitaciones operativas" alerts={groupedAlerts.operational} production={production} />
                  <AlertGroup title="Problemas de proceso" alerts={groupedAlerts.process} production={production} />
                  <AlertGroup title="Avisos de coste" alerts={groupedAlerts.cost} production={production} />
                  <AlertGroup title="Otros avisos" alerts={groupedAlerts.other} production={production} />
                </div>
              )}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function CloseProductionDialog({ production, open, pending, onOpenChange, onConfirm }) {
  const [reason, setReason] = useState('')
  const trimmedReason = reason.trim()

  React.useEffect(() => {
    if (!open) setReason('')
  }, [open])

  function handleSubmit(event) {
    event.preventDefault()
    if (!trimmedReason || trimmedReason.length > 500) return
    onConfirm(trimmedReason)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cerrar producción definitivamente</DialogTitle>
          <DialogDescription>
            {production?.lot ? `El lote ${production.lot} quedará bloqueado para cambios operativos.` : 'La producción quedará bloqueada para cambios operativos.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="production-control-close-reason">Motivo</Label>
            <Textarea
              id="production-control-close-reason"
              rows={4}
              maxLength={500}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Ej. Producción conciliada y validada desde control de producciones"
              disabled={pending}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Obligatorio</span>
              <span>{reason.length}/500</span>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!trimmedReason || trimmedReason.length > 500 || pending}>
              {pending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <LockKeyhole className="mr-2 size-4" />}
              Cerrar definitivamente
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const initialFilters = {
  lot: '',
  species_id: '',
  status: '',
  reconciliation_status: '',
  sort_by: 'id',
  sort_dir: 'desc',
  dateRange: { from: undefined, to: undefined },
}

export default function ProductionsControlPanel() {
  const { data: session } = useSession()
  const token = session?.user?.accessToken
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState(initialFilters)
  const [appliedFilters, setAppliedFilters] = useState(initialFilters)
  const [page, setPage] = useState(1)
  const [selectedProduction, setSelectedProduction] = useState(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [closeTarget, setCloseTarget] = useState(null)

  const queryParams = useMemo(() => {
    const params = {
      page,
      per_page: PER_PAGE,
      sort_by: appliedFilters.sort_by,
      sort_dir: appliedFilters.sort_dir,
    }
    if (appliedFilters.lot.trim()) params.lot = appliedFilters.lot.trim()
    if (appliedFilters.species_id) params.species_id = appliedFilters.species_id
    if (appliedFilters.status) params.status = appliedFilters.status
    if (appliedFilters.dateRange?.from) params.date_from = formatDateParam(appliedFilters.dateRange.from)
    if (appliedFilters.dateRange?.to) params.date_to = formatDateParam(appliedFilters.dateRange.to)
    if (appliedFilters.reconciliation_status) params.reconciliation_status = appliedFilters.reconciliation_status
    return params
  }, [appliedFilters, page])

  const { summary, alerts, productions, pagination, isLoading, isFetching, error, refetch } = useProductionControlPanel(queryParams)

  const visibleProductions = useMemo(() => {
    if (!appliedFilters.reconciliation_status) return productions
    return productions.filter((production) => production.reconciliation?.status === appliedFilters.reconciliation_status)
  }, [appliedFilters.reconciliation_status, productions])

  const closeMutation = useMutation({
    mutationFn: async ({ productionId, reason }) => {
      if (!token) throw new Error('No se pudo autenticar el cierre')
      return closeProduction(productionId, { reason }, token)
    },
    onSuccess: async (response) => {
      notify.success(response?.message || 'Producción cerrada definitivamente')
      setCloseTarget(null)
      setPanelOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['productions'] })
    },
    onError: (mutationError) => {
      notify.error(mutationError?.message || 'No se pudo cerrar la producción')
    },
  })

  const handleApplyFilters = () => {
    setPage(1)
    setAppliedFilters(filters)
  }

  const handleResetFilters = () => {
    setFilters(initialFilters)
    setAppliedFilters(initialFilters)
    setPage(1)
  }

  const handleSelectProduction = (production) => {
    setSelectedProduction(production)
    setPanelOpen(true)
  }

  const summaryItems = [
    { icon: Factory, label: 'Abiertas', value: formatNumber(summary?.openProductions) },
    { icon: ClipboardCheck, label: 'Cerradas', value: formatNumber(summary?.closedProductions) },
    { icon: ShieldAlert, label: 'Lotes sin producción', value: formatNumber(summary?.lotsInStockWithoutProduction), description: `${formatNumber(summary?.lotsInStockWithoutProductionBoxesCount)} cajas` },
    { icon: Euro, label: 'Cajas sin coste', value: formatNumber(summary?.boxesWithoutCost) },
    { icon: Warehouse, label: 'Alertas globales', value: formatNumber(alerts.length) },
    { icon: ArrowDownUp, label: 'Total filtrado', value: formatNumber(pagination.total), description: `Página ${pagination.currentPage || page} de ${pagination.lastPage || 1}` },
  ]

  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="space-y-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">Control de producciones</h1>
              {isFetching && !isLoading ? <Badge variant="outline">Actualizando</Badge> : null}
            </div>
            <p className="text-sm text-muted-foreground">
              Bandeja operativa para conciliación, cierre, alertas de lote y coste.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/productions">
                <Factory className="mr-2 size-4" />
                Listado
              </Link>
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? <Loader2 className="mr-2 size-4 animate-spin" /> : <RefreshCcw className="mr-2 size-4" />}
              Refrescar
            </Button>
          </div>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>No se pudo cargar el panel</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {summaryItems.map((item) => (
            <SummaryMetric key={item.label} {...item} loading={isLoading} />
          ))}
        </div>

        <Filters
          filters={filters}
          setFilters={setFilters}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
          fetching={isFetching}
        />

        <GlobalAlerts alerts={alerts} />

        <ProductionTable
          productions={visibleProductions}
          selectedProduction={selectedProduction}
          onSelectProduction={handleSelectProduction}
          loading={isLoading}
        />

        <div className="flex flex-col gap-2 rounded-lg border bg-card px-3 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
            <Scale className="size-4" />
            <span>{formatNumber(visibleProductions.length)} filas visibles de {formatNumber(pagination.total)} producciones.</span>
            {appliedFilters.reconciliation_status ? <span>Conciliación filtrada en cliente en V1.</span> : null}
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1 || isFetching}
            >
              <ChevronLeft className="mr-2 size-4" />
              Anterior
            </Button>
            <Badge variant="outline">{page} / {pagination.lastPage || 1}</Badge>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((current) => Math.min(pagination.lastPage || current + 1, current + 1))}
              disabled={page >= (pagination.lastPage || 1) || isFetching}
            >
              Siguiente
              <ChevronRight className="ml-2 size-4" />
            </Button>
          </div>
        </div>
      </div>

      <ProductionSidePanel
        production={selectedProduction}
        open={panelOpen}
        onOpenChange={setPanelOpen}
        closePending={closeMutation.isPending}
        onCloseProduction={(production) => setCloseTarget(production)}
      />

      <CloseProductionDialog
        production={closeTarget}
        open={Boolean(closeTarget)}
        pending={closeMutation.isPending}
        onOpenChange={(open) => {
          if (!open) setCloseTarget(null)
        }}
        onConfirm={(reason) => closeMutation.mutate({ productionId: closeTarget.id, reason })}
      />
    </div>
  )
}
