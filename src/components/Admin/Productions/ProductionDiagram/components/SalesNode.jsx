'use client'

import React from 'react'
import { Handle, Position } from '@xyflow/react'
import { ShoppingCart, Package, Scale } from 'lucide-react'
import { formatWeight } from '@/helpers/production/formatters'

export default function SalesNode({ data }) {
  const {
    product,
    orders = [],
    totalBoxes,
    totalNetWeight,
    summary
  } = data

  const ordersCount = summary?.ordersCount || orders.length || 0

  return (
    <div className={`
      relative rounded-xl overflow-hidden
      min-w-[280px] max-w-[320px]
      border-2 border-green-500/30 bg-green-500/5 shadow-green-500/10
      shadow-lg hover:shadow-xl transition-all duration-300
    `}>
      {/* Efecto de card dentro de card - capa externa */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-xl pointer-events-none" />
      
      {/* Header con icono de venta */}
      <div className="relative flex items-center gap-2 px-4 pt-3 pb-2 border-b border-green-500/30">
        <ShoppingCart className="h-4 w-4 text-green-600" />
        <h3 className="font-semibold text-sm text-green-600">
          VENTA: {product?.name || 'Sin nombre'}
        </h3>
      </div>
      
      {/* Contenido principal */}
      <div className="relative bg-card/95 backdrop-blur-sm p-4 border border-green-500/20 rounded-lg m-1 shadow-inner">
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
            <span className="text-muted-foreground">Pedidos:</span>
            <span className="font-bold text-foreground">{ordersCount}</span>
          </div>
        </div>

        {/* Lista de pedidos */}
        {orders.length > 0 && (
          <div className="space-y-1.5 text-xs">
            {orders.map((orderData, index) => {
              const order = orderData.order || {}
              const customerName = order.customer?.name || 'Sin cliente'
              
              return (
                <div 
                  key={order.id || index}
                  className="flex justify-between items-center py-1.5 px-2 bg-muted/30 rounded"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="font-medium text-foreground truncate">
                      {order.formattedId || `#${order.id}`}
                    </span>
                    <span className="text-muted-foreground truncate hidden sm:inline">
                      {customerName}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className="font-semibold text-foreground">
                      {orderData.totalBoxes || 0} cajas
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {formatWeight(orderData.totalNetWeight || 0)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {orders.length === 0 && (
          <div className="text-xs text-muted-foreground text-center py-2">
            No hay pedidos
          </div>
        )}
      </div>

      {/* Handle de entrada (izquierda) */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 border-2 border-background bg-green-500"
        style={{ left: -6 }}
      />
    </div>
  )
}
