'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { formatWeight } from '@/helpers/production/formatters';
import { formatCostPerKg, formatTotalCost } from '@/helpers/production/costFormatters';
import { RotateCcw, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function ReprocessedNode({ data }) {
  const { processes = [], totalBoxes, totalNetWeight, summary, viewMode = 'simple' } = data;

  const processesCount = summary?.processesCount || processes.length || 0;
  const productsCount = summary?.productsCount || 0;
  const isDetailed = viewMode === 'detailed' || viewMode === 'accounting';
  const isAccounting = viewMode === 'accounting';

  return (
    <div
      className={`relative overflow-hidden rounded-xl ${isDetailed ? 'max-w-[450px] min-w-[380px]' : 'max-w-[320px] min-w-[280px]'} border-2 border-orange-500/30 bg-orange-500/5 shadow-lg shadow-orange-500/10 transition-all duration-300 hover:shadow-xl`}
    >
      {/* Efecto de card dentro de card - capa externa */}
      <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-500/5" />

      {/* Header */}
      <div className="relative flex items-center gap-2 border-b border-orange-500/30 px-4 pt-3 pb-2">
        <RotateCcw className="h-4 w-4 text-orange-600" />
        <h3 className="text-sm font-semibold text-orange-600">REPROCESADO</h3>
        {processesCount > 0 && (
          <span className="text-muted-foreground text-xs">
            ({processesCount} {processesCount === 1 ? 'proceso' : 'procesos'})
          </span>
        )}
      </div>

      {/* Contenido principal */}
      <div className="bg-card/95 relative m-1 rounded-lg border border-orange-500/20 p-3 shadow-inner backdrop-blur-sm">
        {/* Totales - Tabla compacta */}
        <div className="mb-2">
          <table className="w-full border-collapse text-xs">
            <tbody>
              <tr>
                <td className="text-muted-foreground py-0.5 pr-2">Procesos:</td>
                <td className="text-foreground text-right font-bold">{processesCount}</td>
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
        {!isDetailed && processes.length > 0 && (
          <div className="border-border/30 space-y-1 border-t pt-2 text-xs">
            {processes.map((processData, index) => {
              const process = processData.process || {};
              const productionRecord = processData.productionRecord || {};
              const production = processData.production || productionRecord.production || {};
              const productionId = production?.id || productionRecord.productionId;
              const lot = production?.lot || (productionId ? `Prod-${productionId}` : null);

              return (
                <div key={process.id || index} className="space-y-1 py-1">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground flex-1 truncate font-medium">
                      {process.name || 'Sin nombre'}
                    </span>
                    <div className="text-muted-foreground ml-2 text-right">
                      <div>{processData.totalBoxes || 0} cajas</div>
                      <div className="text-[10px]">
                        {formatWeight(processData.totalNetWeight || 0)}
                      </div>
                    </div>
                  </div>
                  {productionId && lot && (
                    <div className="text-muted-foreground flex items-center gap-1 text-[10px]">
                      <span>Lote:</span>
                      <Link
                        href={`/admin/productions/${productionId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-0.5 text-orange-600 hover:text-orange-700 hover:underline"
                      >
                        {lot}
                        <ExternalLink className="h-2.5 w-2.5" />
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Vista Detallada: Tabla completa con productos */}
        {isDetailed && processes.length > 0 && (
          <div className="border-border/30 max-h-[350px] space-y-3 overflow-y-auto border-t pt-2">
            {processes.map((processData, processIndex) => {
              const process = processData.process || {};
              const processProducts = processData.products || [];
              const processId = process.id || processIndex;
              const productionRecord = processData.productionRecord || {};
              const production = processData.production || productionRecord.production || {};
              const productionId = production?.id || productionRecord.productionId;
              const lot = production?.lot || (productionId ? `Prod-${productionId}` : null);

              return (
                <div key={processId} className="space-y-1.5">
                  {/* Encabezado del proceso */}
                  <div className="bg-muted/30 border-border/20 flex items-center justify-between gap-2 rounded border-b px-1 py-1">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <span className="text-foreground truncate text-xs font-semibold">
                        {process.name || 'Sin nombre'}
                      </span>
                      {productionId && lot && (
                        <>
                          <span className="text-muted-foreground text-[9px]">•</span>
                          <Link
                            href={`/admin/productions/${productionId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-0.5 text-[9px] whitespace-nowrap text-orange-600 hover:text-orange-700 hover:underline"
                          >
                            {lot}
                            <ExternalLink className="h-2.5 w-2.5" />
                          </Link>
                        </>
                      )}
                    </div>
                    {processProducts.length === 0 && (
                      <div className="text-muted-foreground text-right text-[9px]">
                        <div>{processData.totalBoxes || 0} cajas</div>
                        <div>{formatWeight(processData.totalNetWeight || 0)}</div>
                        {isAccounting && (
                          <>
                            <div className="text-foreground font-medium">
                              {formatCostPerKg(processData.costPerKg)}
                            </div>
                            <div>{formatTotalCost(processData.costTotal)}</div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Tabla de productos */}
                  {processProducts.length > 0 && (
                    <table className="w-full border-collapse text-[10px]">
                      <thead>
                        <tr className="border-border/30 border-b">
                          <th className="text-muted-foreground px-1 py-1 text-left font-medium">
                            Producto
                          </th>
                          <th className="text-muted-foreground px-1 py-1 text-right font-medium">
                            Cajas
                          </th>
                          <th className="text-muted-foreground px-1 py-1 text-right font-medium">
                            Peso
                          </th>
                          {isAccounting && (
                            <th className="text-muted-foreground px-1 py-1 text-right font-medium">
                              Coste
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {processProducts.map((productData, productIdx) => {
                          const product = productData.product || {};

                          return (
                            <tr
                              key={`${processId}-${product.id || productIdx}`}
                              className="border-border/10 bg-muted/5 border-b"
                            >
                              <td className="text-foreground px-1 py-1 align-top leading-tight break-words whitespace-normal">
                                {product.name || 'Sin nombre'}
                              </td>
                              <td className="px-1 py-1 text-right font-medium whitespace-nowrap">
                                {productData.totalBoxes || 0}
                              </td>
                              <td className="px-1 py-1 text-right whitespace-nowrap">
                                {formatWeight(productData.totalNetWeight || 0)}
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
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {processes.length === 0 && (
          <div className="text-muted-foreground py-2 text-center text-xs">
            No hay procesos de reprocesado
          </div>
        )}
      </div>

      {/* Handle de entrada (izquierda) */}
      <Handle
        type="target"
        position={Position.Left}
        className="border-background h-3 w-3 border-2 bg-orange-500"
        style={{ left: -6 }}
      />
    </div>
  );
}
