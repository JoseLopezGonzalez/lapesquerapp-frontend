'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { formatWeight } from '@/helpers/production/formatters';
import { formatCostPerKg, formatTotalCost } from '@/helpers/production/costFormatters';

export default function StockNode({ data }) {
  const { stores = [], totalBoxes, totalNetWeight, summary, viewMode = 'simple' } = data;

  const storesCount = summary?.storesCount || stores.length || 0;
  const productsCount = summary?.productsCount || 0;
  const isDetailed = viewMode === 'detailed' || viewMode === 'accounting';
  const isAccounting = viewMode === 'accounting';

  return (
    <div
      className={`relative overflow-hidden rounded-xl ${isDetailed ? 'max-w-[450px] min-w-[380px]' : 'max-w-[320px] min-w-[280px]'} border-2 border-blue-500/30 bg-blue-500/5 shadow-lg shadow-blue-500/10 transition-all duration-300 hover:shadow-xl`}
    >
      {/* Efecto de card dentro de card - capa externa */}
      <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5" />

      {/* Header */}
      <div className="relative flex items-center gap-2 border-b border-blue-500/30 px-4 pt-3 pb-2">
        <h3 className="text-sm font-semibold text-blue-600">STOCK</h3>
        {productsCount > 0 && (
          <span className="text-muted-foreground text-xs">
            ({productsCount} {productsCount === 1 ? 'producto' : 'productos'})
          </span>
        )}
      </div>

      {/* Contenido principal */}
      <div className="bg-card/95 relative m-1 rounded-lg border border-blue-500/20 p-3 shadow-inner backdrop-blur-sm">
        {/* Totales - Tabla compacta */}
        <div className="mb-2">
          <table className="w-full border-collapse text-xs">
            <tbody>
              <tr>
                <td className="text-muted-foreground py-0.5 pr-2">Almacenes:</td>
                <td className="text-foreground text-right font-bold">{storesCount}</td>
              </tr>
              <tr>
                <td className="text-muted-foreground py-0.5 pr-2">Total Cajas:</td>
                <td className="text-foreground text-right font-bold">
                  {totalBoxes || summary?.boxesCount || 0}
                </td>
              </tr>
              <tr>
                <td className="text-muted-foreground py-0.5 pr-2">Total Peso:</td>
                <td className="text-foreground text-right font-bold">
                  {formatWeight(totalNetWeight || summary?.netWeight || 0)}
                </td>
              </tr>
              {isAccounting && (
                <>
                  <tr>
                    <td className="text-muted-foreground py-0.5 pr-2">Coste/kg:</td>
                    <td className="text-foreground text-right font-bold">
                      {formatCostPerKg(summary?.costPerKg)}
                    </td>
                  </tr>
                  <tr>
                    <td className="text-muted-foreground py-0.5 pr-2">Coste total:</td>
                    <td className="text-foreground text-right">
                      {formatTotalCost(summary?.costTotal)}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Vista Simple: Solo resumen */}
        {!isDetailed && stores.length > 0 && (
          <div className="border-border/30 space-y-1 border-t pt-2 text-xs">
            {stores.map((storeData, index) => {
              const store = storeData.store || {};
              return (
                <div key={store.id || index} className="flex items-center justify-between py-1">
                  <span className="text-foreground flex-1 truncate font-medium">
                    {store.name || 'Sin nombre'}
                  </span>
                  <div className="text-muted-foreground ml-2 text-right">
                    <div>{storeData.totalBoxes || 0} cajas</div>
                    <div className="text-[10px]">{formatWeight(storeData.totalNetWeight || 0)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Vista Detallada: Tabla completa con productos */}
        {isDetailed && stores.length > 0 && (
          <div className="border-border/30 max-h-[350px] overflow-y-auto border-t pt-2">
            <table className="w-full border-collapse text-[10px]">
              <thead>
                <tr className="border-border/30 border-b">
                  <th className="text-muted-foreground px-1 py-1 text-left font-medium">Almacén</th>
                  <th className="text-muted-foreground px-1 py-1 text-left font-medium">
                    Producto
                  </th>
                  <th className="text-muted-foreground px-1 py-1 text-right font-medium">Cajas</th>
                  <th className="text-muted-foreground px-1 py-1 text-right font-medium">Peso</th>
                  <th className="text-muted-foreground px-1 py-1 text-right font-medium">Palets</th>
                  {isAccounting && (
                    <th className="text-muted-foreground px-1 py-1 text-right font-medium">
                      Coste
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {stores.flatMap((storeData, storeIndex) => {
                  const store = storeData.store || {};
                  const storeProducts = storeData.products || [];
                  const storeId = store.id || storeIndex;

                  // Si no hay productos, mostrar solo la fila del almacén
                  if (storeProducts.length === 0) {
                    return (
                      <tr key={storeId} className="bg-muted/30 border-border/20 border-b">
                        <td className="text-foreground px-1 py-1 font-medium">
                          <span className="truncate">{store.name || 'Sin nombre'}</span>
                        </td>
                        <td className="px-1 py-1"></td>
                        <td className="px-1 py-1 text-right font-medium">
                          {storeData.totalBoxes || 0}
                        </td>
                        <td className="px-1 py-1 text-right">
                          {formatWeight(storeData.totalNetWeight || 0)}
                        </td>
                        <td className="px-1 py-1 text-right">-</td>
                        {isAccounting && (
                          <td className="px-1 py-1 text-right">
                            <div className="font-medium whitespace-nowrap">
                              {formatCostPerKg(storeData.costPerKg)}
                            </div>
                            <div className="text-muted-foreground text-[9px] whitespace-nowrap">
                              {formatTotalCost(storeData.costTotal)}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  }

                  // Mostrar cada producto en su propia fila
                  return storeProducts.map((productData, productIdx) => {
                    const product = productData.product || {};
                    const pallets = productData.pallets || [];
                    const isFirstProduct = productIdx === 0;

                    return (
                      <tr
                        key={`${storeId}-${product.id || productIdx}`}
                        className={`border-border/10 border-b ${isFirstProduct ? 'bg-muted/20' : 'bg-muted/5'}`}
                      >
                        <td className="text-foreground px-1 py-1 font-medium">
                          {isFirstProduct && (
                            <span className="truncate">{store.name || 'Sin nombre'}</span>
                          )}
                        </td>
                        <td className="text-foreground px-1 py-1">
                          {product.name || 'Sin nombre'}
                        </td>
                        <td className="px-1 py-1 text-right font-medium whitespace-nowrap">
                          {productData.totalBoxes || 0}
                        </td>
                        <td className="px-1 py-1 text-right whitespace-nowrap">
                          {formatWeight(productData.totalNetWeight || 0)}
                        </td>
                        <td className="text-muted-foreground px-1 py-1 text-right whitespace-nowrap">
                          {pallets.length || 0}
                        </td>
                        {isAccounting && (
                          <td className="px-1 py-1 text-right">
                            <div className="font-medium whitespace-nowrap">
                              {formatCostPerKg(productData.costPerKg)}
                            </div>
                            <div className="text-muted-foreground text-[9px] whitespace-nowrap">
                              {formatTotalCost(productData.costTotal)}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  });
                })}
              </tbody>
            </table>
          </div>
        )}

        {stores.length === 0 && (
          <div className="text-muted-foreground py-2 text-center text-xs">No hay almacenes</div>
        )}
      </div>

      {/* Handle de entrada (izquierda) */}
      <Handle
        type="target"
        position={Position.Left}
        className="border-background h-3 w-3 border-2 bg-blue-500"
        style={{ left: -6 }}
      />
    </div>
  );
}
