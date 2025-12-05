'use client'

import React from 'react'
import { Handle, Position } from '@xyflow/react'
import { formatWeight } from '@/helpers/production/formatters'
import { AlertTriangle } from 'lucide-react'

export default function RestantesNode({ data }) {
  const {
    products = [],
    summary,
    viewMode = 'simple'
  } = data

  const productsCount = summary?.productsCount || products.length || 0
  const totalRemainingBoxes = summary?.totalMissingBoxes || 0
  const totalRemainingWeight = summary?.totalMissingWeight || 0
  const isDetailed = viewMode === 'detailed'

  // Calcular si hay productos con restantes
  const hasRemainingProducts = products.some(p => p.missing && (p.missing.boxes > 0 || p.missing.weight > 0))

  return (
    <div className={`
      relative rounded-xl overflow-hidden
      ${isDetailed ? 'min-w-[380px] max-w-[450px]' : 'min-w-[280px] max-w-[320px]'}
      border-2 border-red-500/30 bg-red-500/5 shadow-red-500/10
      shadow-lg hover:shadow-xl transition-all duration-300
    `}>
      {/* Efecto de card dentro de card - capa externa */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-red-500/5 rounded-xl pointer-events-none" />
      
      {/* Header */}
      <div className="relative flex items-center gap-2 px-4 pt-3 pb-2 border-b border-red-500/30">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <h3 className="font-semibold text-sm text-red-600">
          RESTANTES
        </h3>
        {productsCount > 0 && (
          <span className="text-xs text-muted-foreground">
            ({productsCount} {productsCount === 1 ? 'producto' : 'productos'})
          </span>
        )}
      </div>
      
      {/* Contenido principal */}
      <div className="relative bg-card/95 backdrop-blur-sm p-3 border border-red-500/20 rounded-lg m-1 shadow-inner">
        {/* Totales - Tabla compacta */}
        <div className="mb-2">
          <table className="w-full text-xs border-collapse">
            <tbody>
              <tr>
                <td className="text-muted-foreground py-0.5 pr-2">Productos:</td>
                <td className="font-bold text-foreground text-right">{productsCount}</td>
              </tr>
              <tr>
                <td className="text-muted-foreground py-0.5 pr-2">Cajas Restantes:</td>
                <td className="font-bold text-red-600 text-right">{totalRemainingBoxes}</td>
              </tr>
              <tr>
                <td className="text-muted-foreground py-0.5 pr-2">Peso Restante:</td>
                <td className="font-bold text-red-600 text-right">{formatWeight(totalRemainingWeight)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Vista Simple: Solo productos con restantes */}
        {!isDetailed && products.length > 0 && (
          <div className="border-t border-border/30 pt-2 text-xs space-y-1">
            {products
              .filter(p => p.missing && (p.missing.boxes > 0 || p.missing.weight > 0))
              .map((productData, index) => {
                const product = productData.product || {}
                const remaining = productData.missing || {}
                return (
                  <div key={product.id || index} className="flex justify-between items-center py-1">
                    <span className="font-medium text-foreground truncate flex-1">
                      {product.name || 'Sin nombre'}
                    </span>
                    <div className="text-red-600 ml-2 text-right">
                      <div>{remaining.boxes || 0} cajas</div>
                      <div className="text-[10px]">{formatWeight(remaining.weight || 0)}</div>
                      {remaining.percentage > 0 && (
                        <div className="text-[9px] opacity-75">({remaining.percentage.toFixed(1)}%)</div>
                      )}
                    </div>
                  </div>
                )
              })}
            {!hasRemainingProducts && (
              <div className="text-xs text-muted-foreground text-center py-2">
                No hay restantes
              </div>
            )}
          </div>
        )}

        {/* Vista Detallada: Tabla completa con desglose */}
        {isDetailed && products.length > 0 && (
          <div className="max-h-[350px] overflow-y-auto border-t border-border/30 pt-2">
            <table className="w-full text-[10px] border-collapse">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left py-1 px-1 font-medium text-muted-foreground">Producto</th>
                  <th className="text-right py-1 px-1 font-medium text-muted-foreground">Producido</th>
                  <th className="text-right py-1 px-1 font-medium text-muted-foreground">En Venta</th>
                  <th className="text-right py-1 px-1 font-medium text-muted-foreground">En Stock</th>
                  <th className="text-right py-1 px-1 font-medium text-muted-foreground">Reprocesado</th>
                  <th className="text-right py-1 px-1 font-medium text-red-600">Restante</th>
                </tr>
              </thead>
              <tbody>
                {products.map((productData, index) => {
                  const product = productData.product || {}
                  const produced = productData.produced || {}
                  const inSales = productData.inSales || {}
                  const inStock = productData.inStock || {}
                  const reprocessed = productData.reprocessed || {}
                  const remaining = productData.missing || {}
                  const hasRemaining = remaining.boxes > 0 || remaining.weight > 0
                  
                  return (
                    <tr 
                      key={product.id || index}
                      className={`border-b border-border/10 ${hasRemaining ? 'bg-red-500/5' : 'bg-muted/5'}`}
                    >
                      <td className="py-1 px-1 font-medium text-foreground truncate max-w-[120px]">
                        <span className="truncate">{product.name || 'Sin nombre'}</span>
                      </td>
                      <td className="py-1 px-1 text-right text-muted-foreground">
                        <div>{produced.boxes || 0}</div>
                        <div className="text-[9px]">{formatWeight(produced.weight || 0)}</div>
                      </td>
                      <td className="py-1 px-1 text-right text-muted-foreground">
                        <div>{inSales.boxes || 0}</div>
                        <div className="text-[9px]">{formatWeight(inSales.weight || 0)}</div>
                      </td>
                      <td className="py-1 px-1 text-right text-muted-foreground">
                        <div>{inStock.boxes || 0}</div>
                        <div className="text-[9px]">{formatWeight(inStock.weight || 0)}</div>
                      </td>
                      <td className="py-1 px-1 text-right text-muted-foreground">
                        <div>{reprocessed.boxes || 0}</div>
                        <div className="text-[9px]">{formatWeight(reprocessed.weight || 0)}</div>
                      </td>
                      <td className="py-1 px-1 text-right font-medium text-red-600">
                        <div>{remaining.boxes || 0}</div>
                        <div className="text-[9px]">{formatWeight(remaining.weight || 0)}</div>
                        {remaining.percentage > 0 && (
                          <div className="text-[8px] opacity-75">({remaining.percentage.toFixed(1)}%)</div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {products.length === 0 && (
          <div className="text-xs text-muted-foreground text-center py-2">
            No hay productos para verificar
          </div>
        )}
      </div>

      {/* Handle de entrada (izquierda) */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 border-2 border-background bg-red-500"
        style={{ left: -6 }}
      />
    </div>
  )
}

