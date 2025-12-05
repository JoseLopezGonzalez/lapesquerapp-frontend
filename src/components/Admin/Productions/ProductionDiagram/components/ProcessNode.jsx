'use client'

import React from 'react'
import { Handle, Position } from '@xyflow/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingDown, TrendingUp, ArrowRight } from 'lucide-react'
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
    onNavigate,
    hasSalesOrStockChildren = false
  } = data

  const hasWaste = totals?.waste > 0
  const hasYield = totals?.yield > 0
  const isDetailed = viewMode === 'detailed'
  
  // Construir texto de entrada y salida sin renderizar 0s
  const inputText = totals?.inputWeight && totals.inputWeight > 0
    ? `${formatWeight(totals.inputWeight)}${(totals?.inputBoxes && Number(totals.inputBoxes) > 0) ? ` (${totals.inputBoxes} cajas)` : ''}`
    : '-'
  
  const outputText = totals?.outputWeight && totals.outputWeight > 0
    ? `${formatWeight(totals.outputWeight)}${(totals?.outputBoxes && Number(totals.outputBoxes) > 0) ? ` (${totals.outputBoxes} cajas)` : ''}`
    : '-'
  
  // Debug: verificar si el nodo final tiene hijos de venta/stock
  if (isFinal) {
    console.log(`Nodo final "${processName}" (${data.recordId}): hasSalesOrStockChildren=${hasSalesOrStockChildren}`);
  }

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
      
      {/* Header con indicador de estado - en el card externo */}
      <div className="relative flex items-center gap-2 px-4 pt-3 pb-2 border-b border-border/30">
        {/* Indicador visual del estado de completado */}
        <div 
          className={`w-2 h-2 rounded-full ${
            isCompleted 
              ? 'bg-green-500' 
              : 'bg-yellow-500 animate-pulse'
          }`} 
          title={isCompleted ? 'Proceso completado' : 'Proceso en progreso'} 
        />
        <h3 className={`font-semibold text-sm ${
          isRoot ? 'text-primary' : isFinal ? 'text-green-600' : 'text-foreground'
        }`}>
          {processName}
        </h3>
      </div>
      
      {/* Contenido principal con efecto de profundidad */}
      <div className="relative bg-card/95 backdrop-blur-sm p-4 border border-border/50 rounded-lg m-1 shadow-inner">

      {/* Métricas */}
      <div className="space-y-2 text-xs">
        {/* Entrada */}
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Entrada:</span>
          <span className="font-medium text-foreground">
            {inputText}
          </span>
        </div>

        {/* Salida */}
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Salida:</span>
          <span className="font-medium text-foreground">
            {outputText}
          </span>
        </div>

        {/* Merma o Rendimiento */}
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

        {/* Productos de entrada (solo en modo detallado) */}
        {isDetailed && inputProducts.length > 0 && (
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
                  </tr>
                </thead>
                <tbody>
                  {inputProducts.map((product, idx) => (
                    <tr key={idx} className="border-b border-border/20 last:border-b-0">
                      <td className="py-0.5 px-1 text-foreground font-medium truncate max-w-[120px]">{product.name}</td>
                      <td className="py-0.5 px-1 text-muted-foreground text-right whitespace-nowrap">{product.boxes}</td>
                      <td className="py-0.5 px-1 text-muted-foreground text-right whitespace-nowrap">{formatWeight(product.weight)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Productos de salida (solo en modo detallado) */}
        {isDetailed && outputProducts.length > 0 && (
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
                  </tr>
                </thead>
                <tbody>
                  {outputProducts.map((product, idx) => (
                    <tr key={idx} className="border-b border-border/20 last:border-b-0">
                      <td className="py-0.5 px-1 text-foreground font-medium truncate max-w-[120px]">{product.name}</td>
                      <td className="py-0.5 px-1 text-muted-foreground text-right whitespace-nowrap">
                        {product.boxes && product.boxes > 0 ? product.boxes : '-'}
                      </td>
                      <td className="py-0.5 px-1 text-muted-foreground text-right whitespace-nowrap">{formatWeight(product.weight)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

      {/* Handle de entrada (izquierda) - solo si no es raíz */}
      {!isRoot && (
        <Handle
          type="target"
          position={Position.Left}
          className={`w-3 h-3 border-2 border-background ${
            isFinal ? 'bg-green-500' : 'bg-primary'
          }`}
          style={{ left: -6 }}
        />
      )}

      {/* Handle de salida (derecha) - si no es final, o si es final pero tiene hijos de venta/stock */}
      {(!isFinal || hasSalesOrStockChildren) && (
        <Handle
          type="source"
          position={Position.Right}
          className={`w-3 h-3 border-2 border-background ${
            isFinal && hasSalesOrStockChildren 
              ? 'bg-green-500' 
              : (isRoot ? 'bg-primary' : 'bg-primary')
          }`}
          style={{ right: -6 }}
        />
      )}
    </div>
  )
}

