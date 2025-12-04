'use client'

import React from 'react'
import { Handle, Position } from '@xyflow/react'
import { Warehouse, Package, Scale } from 'lucide-react'
import { formatWeight } from '@/helpers/production/formatters'

export default function StockNode({ data }) {
  const {
    product,
    stores = [],
    totalBoxes,
    totalNetWeight,
    summary
  } = data

  const storesCount = summary?.storesCount || stores.length || 0

  return (
    <div className={`
      relative rounded-xl overflow-hidden
      min-w-[280px] max-w-[320px]
      border-2 border-blue-500/30 bg-blue-500/5 shadow-blue-500/10
      shadow-lg hover:shadow-xl transition-all duration-300
    `}>
      {/* Efecto de card dentro de card - capa externa */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-xl pointer-events-none" />
      
      {/* Header con icono de almacén */}
      <div className="relative flex items-center gap-2 px-4 pt-3 pb-2 border-b border-blue-500/30">
        <Warehouse className="h-4 w-4 text-blue-600" />
        <h3 className="font-semibold text-sm text-blue-600">
          STOCK: {product?.name || 'Sin nombre'}
        </h3>
      </div>
      
      {/* Contenido principal */}
      <div className="relative bg-card/95 backdrop-blur-sm p-4 border border-blue-500/20 rounded-lg m-1 shadow-inner">
        {/* Totales */}
        <div className="space-y-2 text-xs mb-3 pb-3 border-b border-border/30">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Total Cajas:</span>
            <span className="font-bold text-foreground">
              {totalBoxes || summary?.boxesCount || 0}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Total Peso:</span>
            <span className="font-bold text-foreground">
              {formatWeight(totalNetWeight || summary?.netWeight || 0)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Almacenes:</span>
            <span className="font-bold text-foreground">{storesCount}</span>
          </div>
        </div>

        {/* Lista de almacenes */}
        {stores.length > 0 && (
          <div className="space-y-1.5 text-xs">
            {stores.map((storeData, index) => {
              const store = storeData.store || {}
              
              return (
                <div 
                  key={store.id || index}
                  className="flex justify-between items-center py-1.5 px-2 bg-muted/30 rounded"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Warehouse className="h-3 w-3 text-blue-600 flex-shrink-0" />
                    <span className="font-medium text-foreground truncate">
                      {store.name || 'Sin nombre'}
                    </span>
                    {store.temperature !== undefined && store.temperature !== null && (
                      <span className="text-muted-foreground text-[10px]">
                        {store.temperature}°C
                      </span>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className="font-semibold text-foreground">
                      {storeData.totalBoxes || 0} cajas
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {formatWeight(storeData.totalNetWeight || 0)}
                    </div>
                  </div>
                </div>
              )
            })}
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
