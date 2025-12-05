'use client'

import React from 'react'
import { Handle, Position } from '@xyflow/react'
import { formatWeight } from '@/helpers/production/formatters'

export default function StockNode({ data }) {
  const {
    stores = [],
    totalBoxes,
    totalNetWeight,
    summary,
    viewMode = 'simple'
  } = data

  const storesCount = summary?.storesCount || stores.length || 0
  const productsCount = summary?.productsCount || 0
  const isDetailed = viewMode === 'detailed'

  return (
    <div className={`
      relative rounded-xl overflow-hidden
      ${isDetailed ? 'min-w-[380px] max-w-[450px]' : 'min-w-[280px] max-w-[320px]'}
      border-2 border-blue-500/30 bg-blue-500/5 shadow-blue-500/10
      shadow-lg hover:shadow-xl transition-all duration-300
    `}>
      {/* Efecto de card dentro de card - capa externa */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-xl pointer-events-none" />
      
      {/* Header */}
      <div className="relative flex items-center gap-2 px-4 pt-3 pb-2 border-b border-blue-500/30">
        <h3 className="font-semibold text-sm text-blue-600">
          STOCK
        </h3>
        {productsCount > 0 && (
          <span className="text-xs text-muted-foreground">
            ({productsCount} {productsCount === 1 ? 'producto' : 'productos'})
          </span>
        )}
      </div>
      
      {/* Contenido principal */}
      <div className="relative bg-card/95 backdrop-blur-sm p-3 border border-blue-500/20 rounded-lg m-1 shadow-inner">
        {/* Totales - Tabla compacta */}
        <div className="mb-2">
          <table className="w-full text-xs border-collapse">
            <tbody>
              <tr>
                <td className="text-muted-foreground py-0.5 pr-2">Almacenes:</td>
                <td className="font-bold text-foreground text-right">{storesCount}</td>
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
        {!isDetailed && stores.length > 0 && (
          <div className="border-t border-border/30 pt-2 text-xs space-y-1">
            {stores.map((storeData, index) => {
              const store = storeData.store || {}
              return (
                <div key={store.id || index} className="flex justify-between items-center py-1">
                  <span className="font-medium text-foreground truncate flex-1">
                    {store.name || 'Sin nombre'}
                  </span>
                  <div className="text-muted-foreground ml-2 text-right">
                    <div>{storeData.totalBoxes || 0} cajas</div>
                    <div className="text-[10px]">{formatWeight(storeData.totalNetWeight || 0)}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Vista Detallada: Tabla completa con productos */}
        {isDetailed && stores.length > 0 && (
          <div className="max-h-[350px] overflow-y-auto border-t border-border/30 pt-2">
            <table className="w-full text-[10px] border-collapse">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left py-1 px-1 font-medium text-muted-foreground">Almacén</th>
                  <th className="text-left py-1 px-1 font-medium text-muted-foreground">Producto</th>
                  <th className="text-right py-1 px-1 font-medium text-muted-foreground">Cajas</th>
                  <th className="text-right py-1 px-1 font-medium text-muted-foreground">Peso</th>
                  <th className="text-right py-1 px-1 font-medium text-muted-foreground">Palets</th>
                </tr>
              </thead>
              <tbody>
                {stores.flatMap((storeData, storeIndex) => {
                  const store = storeData.store || {}
                  const storeProducts = storeData.products || []
                  const storeId = store.id || storeIndex
                  
                  // Si no hay productos, mostrar solo la fila del almacén
                  if (storeProducts.length === 0) {
                    return (
                      <tr key={storeId} className="bg-muted/30 border-b border-border/20">
                        <td className="py-1 px-1 font-medium text-foreground">
                          <span className="truncate">{store.name || 'Sin nombre'}</span>
                        </td>
                        <td className="py-1 px-1"></td>
                        <td className="py-1 px-1 text-right font-medium">{storeData.totalBoxes || 0}</td>
                        <td className="py-1 px-1 text-right">{formatWeight(storeData.totalNetWeight || 0)}</td>
                        <td className="py-1 px-1 text-right">-</td>
                      </tr>
                    )
                  }
                  
                  // Mostrar cada producto en su propia fila
                  return storeProducts.map((productData, productIdx) => {
                    const product = productData.product || {}
                    const pallets = productData.pallets || []
                    const isFirstProduct = productIdx === 0
                    
                    return (
                      <tr 
                        key={`${storeId}-${product.id || productIdx}`}
                        className={`border-b border-border/10 ${isFirstProduct ? 'bg-muted/20' : 'bg-muted/5'}`}
                      >
                        <td className="py-1 px-1 font-medium text-foreground">
                          {isFirstProduct && (
                            <span className="truncate">{store.name || 'Sin nombre'}</span>
                          )}
                        </td>
                        <td className="py-1 px-1 text-foreground truncate max-w-[140px]">
                          <span className="truncate">{product.name || 'Sin nombre'}</span>
                        </td>
                        <td className="py-1 px-1 text-right font-medium">{productData.totalBoxes || 0}</td>
                        <td className="py-1 px-1 text-right">{formatWeight(productData.totalNetWeight || 0)}</td>
                        <td className="py-1 px-1 text-right text-muted-foreground">{pallets.length || 0}</td>
                      </tr>
                    )
                  })
                })}
              </tbody>
            </table>
          </div>
        )}

        {stores.length === 0 && (
          <div className="text-xs text-muted-foreground text-center py-2">
            No hay almacenes
          </div>
        )}
      </div>

      {/* Handle de entrada (izquierda) */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 border-2 border-background bg-blue-500"
        style={{ left: -6 }}
      />
    </div>
  )
}
