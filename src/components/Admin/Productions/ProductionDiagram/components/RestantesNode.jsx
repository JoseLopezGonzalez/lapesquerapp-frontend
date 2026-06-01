'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { formatWeight } from '@/helpers/production/formatters';
import { AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';

export default function RestantesNode({ data }) {
  const { products = [], summary, viewMode = 'simple' } = data;

  const productsCount = summary?.productsCount || products.length || 0;
  const isDetailed = viewMode === 'detailed' || viewMode === 'accounting';

  // Calcular totales de faltantes y sobrantes desde el summary o desde los productos
  // NOTA: Los valores del summary ya vienen calculados correctamente como valores absolutos
  // Si no vienen en el summary, calcular desde los productos donde:
  // - Valores positivos del balance = sobrantes (hay más producto del esperado)
  // - Valores negativos del balance = faltantes (hay menos producto del esperado)

  // Usar valores del summary directamente si existen
  let faltantesBoxes = summary?.totalMissingBoxes || 0;
  let faltantesWeight = summary?.totalMissingWeight || 0;
  let sobrantesBoxes = summary?.totalSurplusBoxes || 0;
  let sobrantesWeight = summary?.totalSurplusWeight || 0;

  // Si no vienen en el summary, calcular desde los productos
  if (
    faltantesBoxes === 0 &&
    faltantesWeight === 0 &&
    sobrantesBoxes === 0 &&
    sobrantesWeight === 0 &&
    products.length > 0
  ) {
    let calculatedFaltantesBoxes = 0;
    let calculatedFaltantesWeight = 0;
    let calculatedSobrantesBoxes = 0;
    let calculatedSobrantesWeight = 0;

    products.forEach((p) => {
      const balance = p.balance || {};
      const boxes = balance.boxes || 0;
      const weight = balance.weight || 0;

      // Valores positivos = faltantes (hay más producto del esperado, falta contabilizar)
      // Valores negativos = sobrantes (hay menos producto del esperado, sobra producto)
      if (boxes > 0 || weight > 0) {
        calculatedFaltantesBoxes += boxes;
        calculatedFaltantesWeight += weight;
      } else if (boxes < 0 || weight < 0) {
        calculatedSobrantesBoxes += Math.abs(boxes);
        calculatedSobrantesWeight += Math.abs(weight);
      }
    });

    faltantesBoxes = calculatedFaltantesBoxes;
    faltantesWeight = calculatedFaltantesWeight;
    sobrantesBoxes = calculatedSobrantesBoxes;
    sobrantesWeight = calculatedSobrantesWeight;
  }

  // Calcular si hay productos con balance (faltantes o sobras)
  const hasBalanceProducts = products.some((p) => {
    const balance = p.balance || {};
    return balance.boxes !== 0 || balance.weight !== 0;
  });

  // Determinar colores según si hay faltantes, sobrantes o ambos
  const hasFaltantes = faltantesBoxes > 0 || faltantesWeight > 0;
  const hasSobrantes = sobrantesBoxes > 0 || sobrantesWeight > 0;

  // Colores según el tipo de balance (prioridad: faltantes > sobrantes > equilibrado)
  const borderColor = hasFaltantes
    ? 'border-red-500/30 bg-red-500/5 shadow-red-500/10'
    : hasSobrantes
      ? 'border-yellow-500/30 bg-yellow-500/5 shadow-yellow-500/10'
      : 'border-gray-500/30 bg-gray-500/5 shadow-gray-500/10';
  const headerBorderColor = hasFaltantes
    ? 'border-red-500/30'
    : hasSobrantes
      ? 'border-yellow-500/30'
      : 'border-gray-500/30';
  const gradientColor = hasFaltantes
    ? 'from-red-500/10 to-red-500/5'
    : hasSobrantes
      ? 'from-yellow-500/10 to-yellow-500/5'
      : 'from-gray-500/10 to-gray-500/5';

  return (
    <div
      className={`relative overflow-hidden rounded-xl ${isDetailed ? 'max-w-[450px] min-w-[380px]' : 'max-w-[320px] min-w-[280px]'} border-2 ${borderColor} shadow-lg transition-all duration-300 hover:shadow-xl`}
    >
      {/* Efecto de card dentro de card - capa externa */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradientColor} pointer-events-none rounded-xl`}
      />

      {/* Header */}
      <div
        className={`relative flex items-center gap-2 border-b px-4 pt-3 pb-2 ${headerBorderColor}`}
      >
        {hasFaltantes ? (
          <TrendingDown className="h-4 w-4 text-red-600" />
        ) : hasSobrantes ? (
          <TrendingUp className="h-4 w-4 text-yellow-600" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-gray-600" />
        )}
        <h3
          className={`text-sm font-semibold ${hasFaltantes ? 'text-red-600' : hasSobrantes ? 'text-yellow-600' : 'text-gray-600'}`}
        >
          BALANCE
        </h3>
        {productsCount > 0 && (
          <span className="text-muted-foreground text-xs">
            ({productsCount} {productsCount === 1 ? 'producto' : 'productos'})
          </span>
        )}
      </div>

      {/* Contenido principal */}
      <div
        className={`bg-card/95 relative border p-3 backdrop-blur-sm ${hasFaltantes ? 'border-red-500/20' : hasSobrantes ? 'border-yellow-500/20' : 'border-gray-500/20'} m-1 rounded-lg shadow-inner`}
      >
        {/* Totales - Tabla compacta */}
        <div className="mb-2">
          <table className="w-full border-collapse text-xs">
            <tbody>
              <tr>
                <td className="text-muted-foreground py-0.5 pr-2">Productos:</td>
                <td className="text-foreground text-right font-bold">{productsCount}</td>
              </tr>
              {/* Faltantes - Siempre mostrar */}
              <tr>
                <td className="text-muted-foreground py-0.5 pr-2">Cajas Faltantes:</td>
                <td
                  className={`text-right font-bold ${hasFaltantes ? 'text-red-600' : 'text-muted-foreground'}`}
                >
                  {hasFaltantes ? '-' : ''}
                  {faltantesBoxes}
                </td>
              </tr>
              <tr>
                <td className="text-muted-foreground py-0.5 pr-2">Peso Faltante:</td>
                <td
                  className={`text-right font-bold ${hasFaltantes ? 'text-red-600' : 'text-muted-foreground'}`}
                >
                  {hasFaltantes ? '-' : ''}
                  {formatWeight(faltantesWeight)}
                </td>
              </tr>
              {/* Sobrantes - Siempre mostrar */}
              <tr>
                <td className="text-muted-foreground py-0.5 pr-2">Cajas Sobrantes:</td>
                <td
                  className={`text-right font-bold ${hasSobrantes ? 'text-yellow-600' : 'text-muted-foreground'}`}
                >
                  {sobrantesBoxes}
                </td>
              </tr>
              <tr>
                <td className="text-muted-foreground py-0.5 pr-2">Peso Sobrante:</td>
                <td
                  className={`text-right font-bold ${hasSobrantes ? 'text-yellow-600' : 'text-muted-foreground'}`}
                >
                  {formatWeight(sobrantesWeight)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Vista Simple: Solo productos con balance */}
        {!isDetailed && products.length > 0 && (
          <div className="border-border/30 space-y-1 border-t pt-2 text-xs">
            {products
              .filter((p) => {
                const balance = p.balance || {};
                return balance.boxes !== 0 || balance.weight !== 0;
              })
              .map((productData, index) => {
                const product = productData.product || {};
                const balance = productData.balance || {};
                // Valores positivos = faltantes, valores negativos = sobrantes
                const isProductFaltante = balance.weight > 0;
                const isProductSobrante = balance.weight < 0;
                const productTextColor = isProductFaltante
                  ? 'text-red-600'
                  : isProductSobrante
                    ? 'text-yellow-600'
                    : 'text-gray-600';

                return (
                  <div
                    key={product.id || index}
                    className="flex items-start justify-between gap-2 py-1"
                  >
                    <span className="text-foreground min-w-0 flex-1 leading-tight font-medium break-words whitespace-normal">
                      {product.name || 'Sin nombre'}
                    </span>
                    <div className={`${productTextColor} shrink-0 text-right`}>
                      <div className="whitespace-nowrap">
                        {isProductFaltante ? '-' : ''}
                        {Math.abs(balance.boxes || 0)} cajas
                      </div>
                      <div className="text-[10px] whitespace-nowrap">
                        {isProductFaltante ? '-' : ''}
                        {formatWeight(Math.abs(balance.weight || 0))}
                      </div>
                      {balance.percentage !== undefined &&
                        balance.percentage !== null &&
                        balance.percentage !== 0 && (
                          <div className="text-[9px] whitespace-nowrap opacity-75">
                            ({Math.abs(balance.percentage).toFixed(1)}%)
                          </div>
                        )}
                    </div>
                  </div>
                );
              })}
            {!hasBalanceProducts && (
              <div className="text-muted-foreground py-2 text-center text-xs">
                Balance equilibrado
              </div>
            )}
          </div>
        )}

        {/* Vista Detallada: Tabla completa con desglose */}
        {isDetailed && products.length > 0 && (
          <div className="border-border/30 max-h-[350px] overflow-y-auto border-t pt-2">
            <table className="w-full border-collapse text-[10px]">
              <thead>
                <tr className="border-border/30 border-b">
                  <th className="text-muted-foreground px-1 py-1 text-left font-medium">
                    Producto
                  </th>
                  <th className="text-muted-foreground px-1 py-1 text-right font-medium">
                    Producido
                  </th>
                  <th className="text-muted-foreground px-1 py-1 text-right font-medium">
                    En Venta
                  </th>
                  <th className="text-muted-foreground px-1 py-1 text-right font-medium">
                    En Stock
                  </th>
                  <th className="text-muted-foreground px-1 py-1 text-right font-medium">
                    Reprocesado
                  </th>
                  <th className="text-muted-foreground px-1 py-1 text-right font-medium">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((productData, index) => {
                  const product = productData.product || {};
                  const produced = productData.produced || {};
                  const inSales = productData.inSales || {};
                  const inStock = productData.inStock || {};
                  const reprocessed = productData.reprocessed || {};
                  const balance = productData.balance || {};
                  const hasBalance = balance.boxes !== 0 || balance.weight !== 0;
                  // Valores positivos = faltantes, valores negativos = sobrantes
                  const isProductFaltante = balance.weight > 0;
                  const isProductSobrante = balance.weight < 0;
                  const balanceTextColor = isProductFaltante
                    ? 'text-red-600'
                    : isProductSobrante
                      ? 'text-yellow-600'
                      : 'text-gray-600';
                  const balanceBgColor = isProductFaltante
                    ? 'bg-red-500/5'
                    : isProductSobrante
                      ? 'bg-yellow-500/5'
                      : 'bg-muted/5';

                  return (
                    <tr
                      key={product.id || index}
                      className={`border-border/10 border-b ${balanceBgColor}`}
                    >
                      <td className="text-foreground px-1 py-1 align-top leading-tight font-medium break-words whitespace-normal">
                        {product.name || 'Sin nombre'}
                      </td>
                      <td className="text-muted-foreground px-1 py-1 text-right">
                        <div className="whitespace-nowrap">{produced.boxes || 0}</div>
                        <div className="text-[9px] whitespace-nowrap">
                          {formatWeight(produced.weight || 0)}
                        </div>
                      </td>
                      <td className="text-muted-foreground px-1 py-1 text-right">
                        <div className="whitespace-nowrap">{inSales.boxes || 0}</div>
                        <div className="text-[9px] whitespace-nowrap">
                          {formatWeight(inSales.weight || 0)}
                        </div>
                      </td>
                      <td className="text-muted-foreground px-1 py-1 text-right">
                        <div className="whitespace-nowrap">{inStock.boxes || 0}</div>
                        <div className="text-[9px] whitespace-nowrap">
                          {formatWeight(inStock.weight || 0)}
                        </div>
                      </td>
                      <td className="text-muted-foreground px-1 py-1 text-right">
                        <div className="whitespace-nowrap">{reprocessed.boxes || 0}</div>
                        <div className="text-[9px] whitespace-nowrap">
                          {formatWeight(reprocessed.weight || 0)}
                        </div>
                      </td>
                      <td className={`px-1 py-1 text-right font-medium ${balanceTextColor}`}>
                        <div className="whitespace-nowrap">
                          {isProductFaltante ? '-' : ''}
                          {Math.abs(balance.boxes || 0)}
                        </div>
                        <div className="text-[9px] whitespace-nowrap">
                          {isProductFaltante ? '-' : ''}
                          {formatWeight(Math.abs(balance.weight || 0))}
                        </div>
                        {balance.percentage !== undefined &&
                          balance.percentage !== null &&
                          balance.percentage !== 0 && (
                            <div className="text-[8px] whitespace-nowrap opacity-75">
                              ({Math.abs(balance.percentage).toFixed(1)}%)
                            </div>
                          )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {products.length === 0 && (
          <div className="text-muted-foreground py-2 text-center text-xs">
            No hay productos para verificar
          </div>
        )}
      </div>

      {/* Handle de entrada (izquierda) */}
      <Handle
        type="target"
        position={Position.Left}
        className={`border-background h-3 w-3 border-2 ${hasFaltantes ? 'bg-red-500' : hasSobrantes ? 'bg-yellow-500' : 'bg-gray-500'}`}
        style={{ left: -6 }}
      />
    </div>
  );
}
