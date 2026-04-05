'use client'

import React, { useMemo, useState } from 'react'
import { Handle, Position } from '@xyflow/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChevronDown, ChevronRight, TrendingDown, TrendingUp, ArrowRight, Loader2, Info } from 'lucide-react'
import { formatWeight } from '@/helpers/production/formatters'
import { formatDecimal, formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers'
import {
  formatContributionPercentage,
  formatCostPerKg,
  formatTotalCost,
  getCostTypeLabel,
  getMaterialSourceDisplayLabel,
  getMaterialSourceTypeLabel
} from '@/helpers/production/costFormatters'

const ACCOUNTING_COST_ROWS = [
  ['Materias primas', 'materialsCost'],
  ['Costes de proceso', 'processCost'],
  ['Costes de lote', 'productionCost']
]

const PROCESS_CATEGORY_ROWS = [
  ['Produccion proceso', 'processProductionCost', 'production'],
  ['Personal proceso', 'processLaborCost', 'labor'],
  ['Operativos proceso', 'processOperationalCost', 'operational'],
  ['Envases proceso', 'processPackagingCost', 'packaging']
]

const PRODUCTION_LEVEL_ROWS = [
  ['Produccion lote', 'productionLevelProductionCost', 'production'],
  ['Personal lote', 'productionLevelLaborCost', 'labor'],
  ['Operativos lote', 'productionLevelOperationalCost', 'operational'],
  ['Envases lote', 'productionLevelPackagingCost', 'packaging']
]

function hasValue(value) {
  return value !== null && value !== undefined
}

function hasRenderableCosts(costs) {
  if (!costs) return false
  return Object.values(costs).some((value) => value !== null && value !== undefined)
}

function CostMetricRow({ label, totalCost, costPerKg, emphasize = false }) {
  if (!hasValue(totalCost) && !hasValue(costPerKg)) return null

  return (
    <div className={`flex items-center justify-between gap-3 ${emphasize ? 'font-semibold text-foreground' : ''}`}>
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-3 text-right">
        {hasValue(costPerKg) && (
          <span className={emphasize ? 'font-semibold text-foreground' : 'text-foreground'}>
            {formatCostPerKg(costPerKg)}
          </span>
        )}
        {hasValue(totalCost) && (
          <span className="text-muted-foreground">{formatTotalCost(totalCost)}</span>
        )}
      </div>
    </div>
  )
}

function CostCategoryList({ title, rows, source }) {
  const visibleRows = rows.filter(([, key]) => hasValue(source?.[key]))
  if (visibleRows.length === 0) return null

  return (
    <div className="space-y-1.5 rounded-md border border-border/50 bg-muted/20 p-2">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </div>
      {visibleRows.map(([label, key, costType]) => (
        <div key={key} className="flex items-center justify-between gap-3 text-[11px]">
          <span className="text-muted-foreground">{label}</span>
          <div className="flex items-center gap-2">
            {costType && <Badge variant="outline" className="text-[10px]">{getCostTypeLabel(costType)}</Badge>}
            <span className="font-medium text-foreground">{formatTotalCost(source[key])}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function AccountingSummary({ nodeCosts }) {
  if (!hasRenderableCosts(nodeCosts)) return null

  return (
    <div className="pt-2 border-t border-border/50">
      <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
        Resumen Contable
      </div>
      <div className="space-y-2 rounded-md border border-border/50 bg-muted/20 p-3">
        <CostMetricRow
          label="Total nodo"
          totalCost={nodeCosts.totalCost}
          costPerKg={nodeCosts.averageCostPerKg}
          emphasize
        />
        {ACCOUNTING_COST_ROWS.map(([label, key]) => (
          <CostMetricRow key={key} label={label} totalCost={nodeCosts[key]} />
        ))}
        <div className="grid gap-2 md:grid-cols-2">
          <CostCategoryList title="Reparto proceso" rows={PROCESS_CATEGORY_ROWS} source={nodeCosts} />
          <CostCategoryList title="Reparto lote" rows={PRODUCTION_LEVEL_ROWS} source={nodeCosts} />
        </div>
      </div>
    </div>
  )
}

function AccountingLineCostTable({ output }) {
  const sections = [
    {
      title: 'Materias primas',
      rows: [
        {
          label: 'Total materiales',
          totalCost: output.costBreakdown?.materials?.totalCost ?? null,
          costPerKg: output.costBreakdown?.materials?.costPerKg ?? null
        }
      ].filter((row) => hasValue(row.totalCost) || hasValue(row.costPerKg))
    },
    {
      title: 'Costes de proceso',
      rows: [
        ['Produccion', output.costBreakdown?.processCosts?.production],
        ['Personal', output.costBreakdown?.processCosts?.labor],
        ['Operativos', output.costBreakdown?.processCosts?.operational],
        ['Envases', output.costBreakdown?.processCosts?.packaging],
        ['Total proceso', output.costBreakdown?.processCosts?.total]
      ]
        .filter(([, item]) => item && (hasValue(item.totalCost) || hasValue(item.costPerKg)))
        .map(([label, item]) => ({
          label,
          totalCost: item.totalCost,
          costPerKg: item.costPerKg
        }))
    },
    {
      title: 'Costes de lote',
      rows: [
        ['Produccion', output.costBreakdown?.productionCosts?.production],
        ['Personal', output.costBreakdown?.productionCosts?.labor],
        ['Operativos', output.costBreakdown?.productionCosts?.operational],
        ['Envases', output.costBreakdown?.productionCosts?.packaging],
        ['Total lote', output.costBreakdown?.productionCosts?.total]
      ]
        .filter(([, item]) => item && (hasValue(item.totalCost) || hasValue(item.costPerKg)))
        .map(([label, item]) => ({
          label,
          totalCost: item.totalCost,
          costPerKg: item.costPerKg
        }))
    }
  ].filter((section) => section.rows.length > 0)

  const sources = Array.isArray(output.costBreakdown?.materials?.sources) && output.costBreakdown.materials.sources.length > 0
    ? output.costBreakdown.materials.sources
    : output.sources

  return (
    <div className="space-y-3 rounded-lg border border-border/50 bg-muted/20 p-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Bloque</TableHead>
            <TableHead>Concepto</TableHead>
            <TableHead className="text-right">Coste/kg</TableHead>
            <TableHead className="text-right">Coste total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sections.map((section) => (
            section.rows.map((row, index) => (
              <TableRow key={`${section.title}-${row.label}`}>
                <TableCell className="font-medium">{index === 0 ? section.title : ''}</TableCell>
                <TableCell>{row.label}</TableCell>
                <TableCell className="text-right">{formatCostPerKg(row.costPerKg)}</TableCell>
                <TableCell className="text-right">{formatTotalCost(row.totalCost)}</TableCell>
              </TableRow>
            ))
          ))}
        </TableBody>
      </Table>

      {Array.isArray(sources) && sources.length > 0 && (
        <div className="rounded-md border border-border/50 bg-background/70 p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Fuentes de materia
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fuente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Peso</TableHead>
                <TableHead className="text-right">Cajas</TableHead>
                <TableHead className="text-right">%</TableHead>
                <TableHead className="text-right">Coste/kg</TableHead>
                <TableHead className="text-right">Coste total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sources.map((source, index) => (
                <TableRow key={`${source.productionOutputConsumptionId || source.productId || index}-source`}>
                  <TableCell className="font-medium">{getMaterialSourceDisplayLabel(source)}</TableCell>
                  <TableCell>
                    {getMaterialSourceTypeLabel(source.sourceType || source.source_type)}
                  </TableCell>
                  <TableCell className="text-right">{hasValue(source.contributedWeightKg) ? formatWeight(source.contributedWeightKg) : '-'}</TableCell>
                  <TableCell className="text-right">{hasValue(source.contributedBoxes) ? source.contributedBoxes : '-'}</TableCell>
                  <TableCell className="text-right">{formatContributionPercentage(source.contributionPercentage)}</TableCell>
                  <TableCell className="text-right">{formatCostPerKg(source.sourceCostPerKg)}</TableCell>
                  <TableCell className="text-right">{formatTotalCost(source.sourceTotalCost)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

function AccountingLinesTable({ outputs, expandedOutputs, onToggle }) {
  if (!Array.isArray(outputs) || outputs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
        No hay líneas contables disponibles.
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border/50">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Producto</TableHead>
            <TableHead className="text-right">Cajas</TableHead>
            <TableHead className="text-right">Peso</TableHead>
            <TableHead className="text-right">Coste/kg</TableHead>
            <TableHead className="text-right">Coste total</TableHead>
            <TableHead className="w-10 p-2 pr-3 text-right" aria-hidden />
          </TableRow>
        </TableHeader>
        <TableBody>
          {outputs.map((output) => {
            const isExpanded = !!expandedOutputs[output.id]
            const rowLabel = output.product?.name || `Output #${output.id}`
            return (
              <React.Fragment key={output.id}>
                <TableRow
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  aria-label={
                    isExpanded
                      ? `${rowLabel}, contraer detalle contable`
                      : `${rowLabel}, expandir detalle contable`
                  }
                  className="cursor-pointer focus-visible:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggle(output.id)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      e.stopPropagation()
                      onToggle(output.id)
                    }
                  }}
                >
                  <TableCell className="font-medium">{rowLabel}</TableCell>
                  <TableCell className="text-right">{output.boxes && output.boxes > 0 ? output.boxes : '-'}</TableCell>
                  <TableCell className="text-right">{formatWeight(output.weightKg || 0)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCostPerKg(output.costPerKg)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{formatTotalCost(output.totalCost)}</TableCell>
                  <TableCell className="w-10 p-2 pr-3 text-right text-muted-foreground" aria-hidden>
                    {isExpanded ? (
                      <ChevronDown className="inline-block h-4 w-4 align-middle" />
                    ) : (
                      <ChevronRight className="inline-block h-4 w-4 align-middle" />
                    )}
                  </TableCell>
                </TableRow>
                {isExpanded && (
                  <TableRow>
                    <TableCell colSpan={6} className="bg-muted/10 p-3">
                      <AccountingLineCostTable output={output} />
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

function AccountingDetailsDialog({
  open,
  onOpenChange,
  processName,
  nodeCosts,
  accountingOutputs,
  expandedOutputs,
  onToggle
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="4xl" className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Info extra contable</DialogTitle>
          <DialogDescription>
            {processName ? `Detalle contable del proceso ${processName}.` : 'Detalle contable del proceso.'}
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="summary">
          <TabsList>
            <TabsTrigger value="summary">Resumen</TabsTrigger>
            <TabsTrigger value="lines">Desglose por salida</TabsTrigger>
          </TabsList>
          <TabsContent value="summary">
            <AccountingSummary nodeCosts={nodeCosts} />
          </TabsContent>
          <TabsContent value="lines">
            <AccountingLinesTable
              outputs={accountingOutputs}
              expandedOutputs={expandedOutputs}
              onToggle={onToggle}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

export default function ProcessNode({ data }) {
  const {
    processName,
    isRoot,
    isFinal,
    isCompleted,
    totals,
    startedAt,
    finishedAt,
    inputProducts = [],
    outputProducts = [],
    nodeCosts = null,
    accountingOutputs = [],
    viewMode = 'simple',
    onNavigate,
    hasSalesOrStockChildren = false
  } = data

  const [isNavigating, setIsNavigating] = useState(false)
  const [expandedOutputs, setExpandedOutputs] = useState({})
  const [accountingDialogOpen, setAccountingDialogOpen] = useState(false)

  const hasWaste = totals?.waste > 0
  const hasYield = totals?.yield > 0
  const isDetailed = viewMode === 'detailed'
  const isAccounting = viewMode === 'accounting'
  const showProductTables = isDetailed || isAccounting

  const inputText = totals?.inputWeight && totals.inputWeight > 0
    ? `${formatWeight(totals.inputWeight)}${(totals?.inputBoxes && Number(totals.inputBoxes) > 0) ? ` (${totals.inputBoxes} cajas)` : ''}`
    : '-'

  const outputText = totals?.outputWeight && totals.outputWeight > 0
    ? `${formatWeight(totals.outputWeight)}${(totals?.outputBoxes && Number(totals.outputBoxes) > 0) ? ` (${totals.outputBoxes} cajas)` : ''}`
    : '-'

  const nodeColorClasses = isRoot
    ? 'border-primary/30 bg-primary/5 shadow-primary/10'
    : isFinal
    ? 'border-purple-500/30 bg-purple-500/5 shadow-purple-500/10'
    : 'border-border bg-card'

  const accountingSummaryVisible = useMemo(() => hasRenderableCosts(nodeCosts), [nodeCosts])

  const toggleOutput = (outputId) => {
    setExpandedOutputs((current) => ({
      ...current,
      [outputId]: !current[outputId]
    }))
  }

  return (
    <div className={`
      relative rounded-xl overflow-hidden
      ${isAccounting ? 'min-w-[420px] max-w-[480px]' : isDetailed ? 'min-w-[320px] max-w-[400px]' : 'min-w-[280px] max-w-[320px]'}
      border-2 ${nodeColorClasses}
      shadow-lg hover:shadow-xl transition-all duration-300
    `}>
      <div className="absolute inset-0 bg-gradient-to-br from-background/50 to-background/30 rounded-xl pointer-events-none" />

      <div className="relative flex items-center gap-2 px-4 pt-3 pb-2 border-b border-border/30">
        <div
          className={`w-2 h-2 rounded-full ${
            isCompleted
              ? 'bg-green-500'
              : 'bg-yellow-500 animate-pulse'
          }`}
          title={isCompleted ? 'Proceso completado' : 'Proceso en progreso'}
        />
        <h3 className={`font-semibold text-sm ${
          isRoot ? 'text-primary' : isFinal ? 'text-purple-600' : 'text-foreground'
        }`}>
          {processName}
        </h3>
        {isAccounting && (
          <Badge variant="secondary" className="ml-auto text-[10px] uppercase tracking-wide">
            Contabilidad
          </Badge>
        )}
      </div>

      <div className="relative bg-card/95 backdrop-blur-sm p-4 border border-border/50 rounded-lg m-1 shadow-inner">
        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Entrada:</span>
            <span className="font-medium text-foreground">{inputText}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Salida:</span>
            <span className="font-medium text-foreground">{outputText}</span>
          </div>

          {(hasWaste || hasYield) && (
            <div className={`pt-2 border-t border-border/50 ${
              hasWaste ? 'text-destructive' : 'text-green-600'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {hasWaste ? (
                    <TrendingDown className="h-3 w-3" />
                  ) : (
                    <TrendingUp className="h-3 w-3" />
                  )}
                  <span className="text-xs font-medium">
                    {hasWaste ? 'Merma' : 'Rendimiento'}:
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm">
                    {hasWaste
                      ? `-${formatDecimal(totals.wastePercentage || 0)}%`
                      : `+${formatDecimal(totals.yieldPercentage || 0)}%`
                    }
                  </div>
                  <div className="text-xs font-medium">
                    {hasWaste
                      ? `-${formatDecimalWeight(totals.waste)}`
                      : `+${formatDecimalWeight(totals.yield)}`
                    }
                  </div>
                </div>
              </div>
            </div>
          )}

          {showProductTables && inputProducts.length > 0 && (
            <div className="pt-2 border-t border-border/50">
              <div className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                Productos Entrada
              </div>
              <div className="w-full">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/30">
                      <th className="text-left py-1 px-1 text-[10px] font-medium text-muted-foreground">Producto</th>
                      <th className="text-right py-1 px-1 text-[10px] font-medium text-muted-foreground">Cajas</th>
                      <th className="text-right py-1 px-1 text-[10px] font-medium text-muted-foreground">Peso</th>
                      {isAccounting && (
                        <th className="text-right py-1 px-1 text-[10px] font-medium text-muted-foreground">Coste/kg</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {inputProducts.map((product, idx) => (
                      <tr key={idx} className="border-b border-border/20 last:border-b-0">
                        <td className="py-0.5 px-1 text-foreground font-medium">{product.name}</td>
                        <td className="py-0.5 px-1 text-muted-foreground text-right whitespace-nowrap">{product.boxes}</td>
                        <td className="py-0.5 px-1 text-muted-foreground text-right whitespace-nowrap">{formatWeight(product.weight)}</td>
                        {isAccounting && (
                          <td className="py-0.5 px-1 text-muted-foreground text-right whitespace-nowrap">
                            {formatCostPerKg(product.costPerKg)}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {showProductTables && outputProducts.length > 0 && (
            <div className="pt-2 border-t border-border/50">
              <div className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                Productos Salida
              </div>
              <div className="w-full">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/30">
                      <th className="text-left py-1 px-1 text-[10px] font-medium text-muted-foreground">Producto</th>
                      <th className="text-right py-1 px-1 text-[10px] font-medium text-muted-foreground">Cajas</th>
                      <th className="text-right py-1 px-1 text-[10px] font-medium text-muted-foreground">Peso</th>
                      {isAccounting && (
                        <th className="text-right py-1 px-1 text-[10px] font-medium text-muted-foreground">Coste/kg</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {outputProducts.map((product, idx) => (
                      <tr key={idx} className="border-b border-border/20 last:border-b-0">
                        <td className="py-0.5 px-1 text-foreground font-medium">{product.name}</td>
                        <td className="py-0.5 px-1 text-muted-foreground text-right whitespace-nowrap">
                          {product.boxes && product.boxes > 0 ? product.boxes : '-'}
                        </td>
                        <td className="py-0.5 px-1 text-muted-foreground text-right whitespace-nowrap">{formatWeight(product.weight)}</td>
                        {isAccounting && (
                          <td className="py-0.5 px-1 text-muted-foreground text-right whitespace-nowrap">
                            {formatCostPerKg(product.costPerKg)}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(startedAt || finishedAt) && (
            <div className="pt-2 border-t text-xs text-muted-foreground">
              {startedAt && (
                <div className="truncate" title={new Date(startedAt).toLocaleString()}>
                  Inicio: {new Date(startedAt).toLocaleDateString()}
                </div>
              )}
              {finishedAt && (
                <div className="truncate" title={new Date(finishedAt).toLocaleString()}>
                  Fin: {new Date(finishedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          )}
        </div>

        {(onNavigate || (isAccounting && (accountingSummaryVisible || accountingOutputs.length > 0))) && (
          <div className="mt-3 pt-3 border-t border-border/50 flex justify-end">
            {isAccounting && (accountingSummaryVisible || accountingOutputs.length > 0) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setAccountingDialogOpen(true)
                }}
                className="gap-2 mr-2"
              >
                Info extra
                <Info className="h-3.5 w-3.5" />
              </Button>
            )}
            {onNavigate && (
              <Button
                variant="default"
                size="sm"
                disabled={isNavigating}
                onClick={(e) => {
                  e.stopPropagation()
                  setIsNavigating(true)
                  onNavigate()
                }}
                className="gap-2"
              >
                {isNavigating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    Ver detalles
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>

      {isAccounting && (accountingSummaryVisible || accountingOutputs.length > 0) && (
        <AccountingDetailsDialog
          open={accountingDialogOpen}
          onOpenChange={setAccountingDialogOpen}
          processName={processName}
          nodeCosts={nodeCosts}
          accountingOutputs={accountingOutputs}
          expandedOutputs={expandedOutputs}
          onToggle={toggleOutput}
        />
      )}

      {!isRoot && (
        <Handle
          type="target"
          position={Position.Left}
          className={`w-3 h-3 border-2 border-background ${
            isFinal ? 'bg-purple-500' : 'bg-primary'
          }`}
          style={{ left: -6 }}
        />
      )}

      {(!isFinal || hasSalesOrStockChildren) && (
        <Handle
          type="source"
          position={Position.Right}
          className={`w-3 h-3 border-2 border-background ${
            isFinal && hasSalesOrStockChildren
              ? 'bg-purple-500'
              : 'bg-primary'
          }`}
          style={{ right: -6 }}
        />
      )}
    </div>
  )
}
