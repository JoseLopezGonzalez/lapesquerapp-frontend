'use client'

import React from 'react'
import { Handle, Position } from '@xyflow/react'
import { formatWeight } from '@/helpers/production/formatters'
import { RotateCcw, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function ReprocessedNode({ data }) {
  const {
    processes = [],
    totalBoxes,
    totalNetWeight,
    summary,
    viewMode = 'simple'
  } = data

  const processesCount = summary?.processesCount || processes.length || 0
  const productsCount = summary?.productsCount || 0
  const isDetailed = viewMode === 'detailed'

  return (
    <div className={`
      relative rounded-xl overflow-hidden
      ${isDetailed ? 'min-w-[380px] max-w-[450px]' : 'min-w-[280px] max-w-[320px]'}
      border-2 border-orange-500/30 bg-orange-500/5 shadow-orange-500/10
      shadow-lg hover:shadow-xl transition-all duration-300
    `}>
      {/* Efecto de card dentro de card - capa externa */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-orange-500/5 rounded-xl pointer-events-none" />
      
      {/* Header */}
      <div className="relative flex items-center gap-2 px-4 pt-3 pb-2 border-b border-orange-500/30">
        <RotateCcw className="h-4 w-4 text-orange-600" />
        <h3 className="font-semibold text-sm text-orange-600">
          REPROCESADO
        </h3>
        {processesCount > 0 && (
          <span className="text-xs text-muted-foreground">
            ({processesCount} {processesCount === 1 ? 'proceso' : 'procesos'})
          </span>
        )}
      </div>
      
      {/* Contenido principal */}
      <div className="relative bg-card/95 backdrop-blur-sm p-3 border border-orange-500/20 rounded-lg m-1 shadow-inner">
        {/* Totales - Tabla compacta */}
        <div className="mb-2">
          <table className="w-full text-xs border-collapse">
            <tbody>
              <tr>
                <td className="text-muted-foreground py-0.5 pr-2">Procesos:</td>
                <td className="font-bold text-foreground text-right">{processesCount}</td>
              </tr>
              <tr>
                <td className="text-muted-foreground py-0.5 pr-2">Total Cajas:</td>
                <td className="font-bold text-foreground text-right">{totalBoxes || summary?.boxesCount || 0}</td>
              </tr>
              <tr>
                <td className="text-muted-foreground py-0.5 pr-2">Total Peso:</td>
                <td className="font-bold text-foreground text-right">{formatWeight(totalNetWeight || summary?.netWeight || 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Vista Simple: Solo resumen */}
        {!isDetailed && processes.length > 0 && (
          <div className="border-t border-border/30 pt-2 text-xs space-y-1">
            {processes.map((processData, index) => {
              const process = processData.process || {}
              const productionRecord = processData.productionRecord || {}
              const production = processData.production || productionRecord.production || {}
              const productionId = production?.id || productionRecord.productionId
              const lot = production?.lot || (productionId ? `Prod-${productionId}` : null)
              
              return (
                <div key={process.id || index} className="space-y-1 py-1">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-foreground truncate flex-1">
                      {process.name || 'Sin nombre'}
                    </span>
                    <div className="text-muted-foreground ml-2 text-right">
                      <div>{processData.totalBoxes || 0} cajas</div>
                      <div className="text-[10px]">{formatWeight(processData.totalNetWeight || 0)}</div>
                    </div>
                  </div>
                  {productionId && lot && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <span>Lote:</span>
                      <Link 
                        href={`/admin/productions/${productionId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-orange-600 hover:text-orange-700 hover:underline flex items-center gap-0.5"
                      >
                        {lot}
                        <ExternalLink className="h-2.5 w-2.5" />
                      </Link>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Vista Detallada: Tabla completa con productos */}
        {isDetailed && processes.length > 0 && (
          <div className="max-h-[350px] overflow-y-auto border-t border-border/30 pt-2 space-y-3">
            {processes.map((processData, processIndex) => {
              const process = processData.process || {}
              const processProducts = processData.products || []
              const processId = process.id || processIndex
              const productionRecord = processData.productionRecord || {}
              const production = processData.production || productionRecord.production || {}
              const productionId = production?.id || productionRecord.productionId
              const lot = production?.lot || (productionId ? `Prod-${productionId}` : null)
              
              return (
                <div key={processId} className="space-y-1.5">
                  {/* Encabezado del proceso */}
                  <div className="flex items-center justify-between gap-2 px-1 py-1 bg-muted/30 rounded border-b border-border/20">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="font-semibold text-xs text-foreground truncate">
                        {process.name || 'Sin nombre'}
                      </span>
                      {productionId && lot && (
                        <>
                          <span className="text-muted-foreground text-[9px]">•</span>
                          <Link 
                            href={`/admin/productions/${productionId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-orange-600 hover:text-orange-700 hover:underline flex items-center gap-0.5 text-[9px] whitespace-nowrap"
                          >
                            {lot}
                            <ExternalLink className="h-2.5 w-2.5" />
                          </Link>
                        </>
                      )}
                    </div>
                    {processProducts.length === 0 && (
                      <div className="text-right text-[9px] text-muted-foreground">
                        <div>{processData.totalBoxes || 0} cajas</div>
                        <div>{formatWeight(processData.totalNetWeight || 0)}</div>
                      </div>
                    )}
                  </div>
                  
                  {/* Tabla de productos */}
                  {processProducts.length > 0 && (
                    <table className="w-full text-[10px] border-collapse">
                      <thead>
                        <tr className="border-b border-border/30">
                          <th className="text-left py-1 px-1 font-medium text-muted-foreground">Producto</th>
                          <th className="text-right py-1 px-1 font-medium text-muted-foreground">Cajas</th>
                          <th className="text-right py-1 px-1 font-medium text-muted-foreground">Peso</th>
                        </tr>
                      </thead>
                      <tbody>
                        {processProducts.map((productData, productIdx) => {
                          const product = productData.product || {}
                          
                          return (
                            <tr 
                              key={`${processId}-${product.id || productIdx}`}
                              className="border-b border-border/10 bg-muted/5"
                            >
                              <td className="py-1 px-1 text-foreground truncate max-w-[200px]">
                                <span className="truncate">{product.name || 'Sin nombre'}</span>
                              </td>
                              <td className="py-1 px-1 text-right font-medium">{productData.totalBoxes || 0}</td>
                              <td className="py-1 px-1 text-right">{formatWeight(productData.totalNetWeight || 0)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {processes.length === 0 && (
          <div className="text-xs text-muted-foreground text-center py-2">
            No hay procesos de reprocesado
          </div>
        )}
      </div>

      {/* Handle de entrada (izquierda) */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 border-2 border-background bg-orange-500"
        style={{ left: -6 }}
      />
    </div>
  )
}

