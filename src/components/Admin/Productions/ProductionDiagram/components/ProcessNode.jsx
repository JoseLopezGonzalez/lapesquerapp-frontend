'use client'

import React from 'react'
import { Handle, Position } from '@xyflow/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, Clock, TrendingDown, TrendingUp, ArrowRight } from 'lucide-react'
import { formatWeight } from '@/helpers/production/formatters'
import { formatDecimal, formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers'

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
    viewMode = 'simple',
    onNavigate
  } = data

  const hasWaste = totals?.waste > 0
  const hasYield = totals?.yield > 0
  const isDetailed = viewMode === 'detailed'

  // Colores distintivos según el tipo de nodo
  const nodeColorClasses = isRoot
    ? 'border-primary/30 bg-primary/5 shadow-primary/10'
    : isFinal
    ? 'border-green-500/30 bg-green-500/5 shadow-green-500/10'
    : 'border-border bg-card'

  return (
    <div className={`
      relative rounded-xl overflow-hidden
      ${isDetailed ? 'min-w-[320px] max-w-[400px]' : 'min-w-[280px] max-w-[320px]'}
      border-2 ${nodeColorClasses}
      shadow-lg hover:shadow-xl transition-all duration-300
    `}>
      {/* Efecto de card dentro de card - capa externa */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/50 to-background/30 rounded-xl pointer-events-none" />
      
      {/* Contenido principal con efecto de profundidad */}
      <div className="relative bg-card/95 backdrop-blur-sm p-4 border border-border/50 rounded-lg m-1 shadow-inner">

      {/* Header con indicador de tipo de nodo */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          {/* Indicador visual del tipo de nodo */}
          {isRoot && (
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" title="Nodo raíz" />
          )}
          {isFinal && (
            <div className="w-2 h-2 rounded-full bg-green-500" title="Nodo final" />
          )}
          {!isRoot && !isFinal && (
            <div className="w-2 h-2 rounded-full bg-muted-foreground/30" title="Nodo intermedio" />
          )}
          <h3 className={`font-semibold text-sm ${
            isRoot ? 'text-primary' : isFinal ? 'text-green-600' : 'text-foreground'
          }`}>
            {processName}
          </h3>
        </div>
        <Badge
          variant={isCompleted ? 'default' : 'outline'}
          className={isCompleted ? 'bg-green-500 hover:bg-green-600 border-green-600' : 'border-border'}
          title={isCompleted ? 'Completado' : 'En progreso'}
        >
          {isCompleted ? (
            <CheckCircle className="h-3 w-3" />
          ) : (
            <Clock className="h-3 w-3" />
          )}
        </Badge>
      </div>

      {/* Métricas */}
      <div className="space-y-2 text-xs">
        {/* Entrada */}
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Entrada:</span>
          <span className="font-medium text-foreground">
            {formatWeight(totals?.inputWeight || 0)} ({totals?.inputBoxes || 0} cajas)
          </span>
        </div>

        {/* Salida */}
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Salida:</span>
          <span className="font-medium text-foreground">
            {formatWeight(totals?.outputWeight || 0)} ({totals?.outputBoxes || 0} cajas)
          </span>
        </div>

        {/* Merma o Rendimiento */}
        {(hasWaste || hasYield) && (
          <div className={`pt-2 border-t flex items-center justify-between ${
            hasWaste ? 'text-destructive' : 'text-green-600'
          }`}>
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
            <span className="font-bold text-sm">
              {hasWaste
                ? `-${formatDecimalWeight(totals.waste)} (-${formatDecimal(totals.wastePercentage || 0)}%)`
                : `+${formatDecimalWeight(totals.yield)} (+${formatDecimal(totals.yieldPercentage || 0)}%)`
              }
            </span>
          </div>
        )}

        {/* Productos de entrada (solo en modo detallado) */}
        {isDetailed && inputProducts.length > 0 && (
          <div className="pt-2 border-t">
            <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
              Productos Entrada
            </div>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {inputProducts.map((product, idx) => (
                <div key={idx} className="text-xs flex justify-between items-start gap-2 bg-muted/30 rounded px-2 py-1">
                  <span className="text-foreground font-medium truncate flex-1">{product.name}</span>
                  <span className="text-muted-foreground text-right whitespace-nowrap">
                    {formatWeight(product.weight)}
                    <br />
                    <span className="text-[10px]">({product.boxes} cajas)</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Productos de salida (solo en modo detallado) */}
        {isDetailed && outputProducts.length > 0 && (
          <div className="pt-2 border-t">
            <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
              Productos Salida
            </div>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {outputProducts.map((product, idx) => (
                <div key={idx} className="text-xs flex justify-between items-start gap-2 bg-muted/30 rounded px-2 py-1">
                  <span className="text-foreground font-medium truncate flex-1">{product.name}</span>
                  <span className="text-muted-foreground text-right whitespace-nowrap">
                    {formatWeight(product.weight)}
                    <br />
                    <span className="text-[10px]">({product.boxes} cajas)</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fechas (opcional, más compacto) */}
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

        {/* Botón de navegación */}
        {onNavigate && (
          <div className="mt-3 pt-3 border-t border-border/50 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onNavigate()
              }}
              className="gap-2"
            >
              Ver detalles
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Handle de entrada (arriba) - solo si no es raíz */}
      {!isRoot && (
        <Handle
          type="target"
          position={Position.Top}
          className={`w-3 h-3 border-2 border-background ${
            isFinal ? 'bg-green-500' : 'bg-primary'
          }`}
          style={{ top: -6 }}
        />
      )}

      {/* Handle de salida (abajo) - solo si no es final */}
      {!isFinal && (
        <Handle
          type="source"
          position={Position.Bottom}
          className={`w-3 h-3 border-2 border-background ${
            isRoot ? 'bg-primary' : 'bg-primary'
          }`}
          style={{ bottom: -6 }}
        />
      )}
    </div>
  )
}

