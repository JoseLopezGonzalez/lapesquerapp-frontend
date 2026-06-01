'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { formatWeight } from '@/helpers/production/formatters';
import { formatCostPerKg, formatTotalCost } from '@/helpers/production/costFormatters';
import { formatDecimal } from '@/helpers/formats/numbers/formatNumbers';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

function hasValue(value) {
  return value !== null && value !== undefined;
}

function formatPercentage(value) {
  if (!hasValue(value)) return '-';
  return `${formatDecimal(value)}%`;
}

function SalesMetricRow({ label, primaryValue, secondaryValue, tertiaryValue = null }) {
  if (!hasValue(primaryValue) && !hasValue(secondaryValue) && !hasValue(tertiaryValue)) return null;

  return (
    <tr>
      <td className="text-muted-foreground py-0.5 pr-2">{label}:</td>
      <td className="text-right">
        <div className="text-foreground font-bold">
          {hasValue(primaryValue) ? formatCostPerKg(primaryValue) : '-'}
        </div>
        {hasValue(secondaryValue) && (
          <div className="text-muted-foreground text-[10px]">{formatTotalCost(secondaryValue)}</div>
        )}
        {hasValue(tertiaryValue) && (
          <div className="text-muted-foreground text-[10px]">{formatPercentage(tertiaryValue)}</div>
        )}
      </td>
    </tr>
  );
}

export default function SalesNode({ data }) {
  const { orders = [], totalBoxes, totalNetWeight, summary, viewMode = 'simple' } = data;

  const ordersCount = summary?.ordersCount || orders.length || 0;
  const productsCount = summary?.productsCount || 0;
  const isDetailed = viewMode === 'detailed' || viewMode === 'accounting';
  const isAccounting = viewMode === 'accounting';

  return (
    <div
      className={`relative overflow-hidden rounded-xl ${isDetailed ? 'max-w-[620px] min-w-[520px]' : 'max-w-[340px] min-w-[300px]'} border-2 border-green-500/30 bg-green-500/5 shadow-lg shadow-green-500/10 transition-all duration-300 hover:shadow-xl`}
    >
      <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5" />

      <div className="relative flex items-center gap-2 border-b border-green-500/30 px-4 pt-3 pb-2">
        <h3 className="text-sm font-semibold text-green-600">VENTAS</h3>
        {productsCount > 0 && (
          <span className="text-muted-foreground text-xs">
            ({productsCount} {productsCount === 1 ? 'producto' : 'productos'})
          </span>
        )}
      </div>

      <div className="bg-card/95 relative m-1 rounded-lg border border-green-500/20 p-3 shadow-inner backdrop-blur-sm">
        <div className="mb-2">
          <table className="w-full border-collapse text-xs">
            <tbody>
              <tr>
                <td className="text-muted-foreground py-0.5 pr-2">Pedidos:</td>
                <td className="text-foreground text-right font-bold">{ordersCount}</td>
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
                  <SalesMetricRow
                    label="Venta"
                    primaryValue={summary?.salePricePerKg}
                    secondaryValue={summary?.saleTotal ?? summary?.saleSubtotal}
                  />
                  <SalesMetricRow
                    label="Coste"
                    primaryValue={summary?.costPerKg}
                    secondaryValue={summary?.costTotal}
                  />
                  <SalesMetricRow
                    label="Margen"
                    primaryValue={summary?.marginPerKgExTax}
                    secondaryValue={summary?.marginTotalExTax}
                    tertiaryValue={summary?.marginPercentageExTax}
                  />
                </>
              )}
            </tbody>
          </table>
        </div>

        {!isDetailed && orders.length > 0 && (
          <div className="border-border/30 space-y-1 border-t pt-2 text-xs">
            {orders.map((orderData, index) => {
              const order = orderData.order || {};
              const orderId = order.id;
              return (
                <div
                  key={order.id || index}
                  className="flex items-start justify-between gap-2 py-1"
                >
                  {orderId ? (
                    <Link
                      href={`/admin/orders/${orderId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex flex-1 items-center gap-1 truncate font-medium text-green-600 hover:text-green-700 hover:underline"
                    >
                      {order.formattedId || `#${order.id}`}
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    </Link>
                  ) : (
                    <span className="text-foreground flex-1 truncate font-medium">
                      {order.formattedId || `#${order.id}`}
                    </span>
                  )}
                  <div className="text-right">
                    <div className="text-muted-foreground">
                      {orderData.totalBoxes || 0} cajas ·{' '}
                      {formatWeight(orderData.totalNetWeight || 0)}
                    </div>
                    {isAccounting && (
                      <>
                        <div className="text-foreground font-medium">
                          {formatCostPerKg(orderData.salePricePerKg)}
                        </div>
                        <div className="text-muted-foreground text-[10px]">
                          Coste {formatCostPerKg(orderData.costPerKg)}
                        </div>
                        <div className="text-muted-foreground text-[10px]">
                          Margen {formatCostPerKg(orderData.marginPerKgExTax)}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {isDetailed && orders.length > 0 && (
          <div className="border-border/30 max-h-[380px] overflow-y-auto border-t pt-2">
            <table className="w-full border-collapse text-[10px]">
              <thead>
                <tr className="border-border/30 border-b">
                  <th className="text-muted-foreground px-1 py-1 text-left font-medium">Pedido</th>
                  <th className="text-muted-foreground px-1 py-1 text-left font-medium">
                    Producto
                  </th>
                  <th className="text-muted-foreground px-1 py-1 text-right font-medium">Cajas</th>
                  <th className="text-muted-foreground px-1 py-1 text-right font-medium">Peso</th>
                  {isAccounting && (
                    <th className="text-muted-foreground px-1 py-1 text-right font-medium">
                      Venta
                    </th>
                  )}
                  {isAccounting && (
                    <th className="text-muted-foreground px-1 py-1 text-right font-medium">
                      Coste
                    </th>
                  )}
                  {isAccounting && (
                    <th className="text-muted-foreground px-1 py-1 text-right font-medium">
                      Margen
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {orders.flatMap((orderData, orderIndex) => {
                  const order = orderData.order || {};
                  const orderProducts = orderData.products || [];
                  const orderId = order.id || orderIndex;

                  if (orderProducts.length === 0) {
                    return (
                      <tr key={orderId} className="bg-muted/30 border-border/20 border-b">
                        <td className="px-1 py-1 align-middle font-medium">
                          {order.id ? (
                            <Link
                              href={`/admin/orders/${order.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1 text-green-600 hover:text-green-700 hover:underline"
                            >
                              {order.formattedId || `#${order.id}`}
                              <ExternalLink className="h-2.5 w-2.5" />
                            </Link>
                          ) : (
                            <span className="text-foreground">
                              {order.formattedId || `#${order.id}`}
                            </span>
                          )}
                        </td>
                        <td className="text-muted-foreground px-1 py-1 align-middle break-words whitespace-normal">
                          -
                        </td>
                        <td className="px-1 py-1 text-right align-middle font-medium whitespace-nowrap">
                          {orderData.totalBoxes || 0}
                        </td>
                        <td className="px-1 py-1 text-right align-middle whitespace-nowrap">
                          {formatWeight(orderData.totalNetWeight || 0)}
                        </td>
                        {isAccounting && (
                          <td className="px-1 py-1 text-right align-middle whitespace-nowrap">
                            <div className="text-foreground font-medium">
                              {formatCostPerKg(orderData.salePricePerKg)}
                            </div>
                            <div className="text-muted-foreground">
                              {formatTotalCost(orderData.saleTotal ?? orderData.saleSubtotal)}
                            </div>
                          </td>
                        )}
                        {isAccounting && (
                          <td className="px-1 py-1 text-right align-middle whitespace-nowrap">
                            <div className="text-foreground font-medium">
                              {formatCostPerKg(orderData.costPerKg)}
                            </div>
                            <div className="text-muted-foreground">
                              {formatTotalCost(orderData.costTotal)}
                            </div>
                          </td>
                        )}
                        {isAccounting && (
                          <td className="px-1 py-1 text-right align-middle whitespace-nowrap">
                            <div className="text-foreground font-medium">
                              {formatCostPerKg(orderData.marginPerKgExTax)}
                            </div>
                            <div className="text-muted-foreground">
                              {formatTotalCost(orderData.marginTotalExTax)}
                            </div>
                            <div className="text-muted-foreground">
                              {formatPercentage(orderData.marginPercentageExTax)}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  }

                  return orderProducts.map((productData, productIdx) => {
                    const product = productData.product || {};
                    const isFirstProduct = productIdx === 0;

                    return (
                      <tr
                        key={`${orderId}-${product.id || productIdx}`}
                        className={`border-border/10 border-b ${isFirstProduct ? 'bg-muted/20' : 'bg-muted/5'}`}
                      >
                        <td className="px-1 py-1 align-middle font-medium">
                          {isFirstProduct &&
                            (order.id ? (
                              <Link
                                href={`/admin/orders/${order.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1 truncate text-green-600 hover:text-green-700 hover:underline"
                              >
                                {order.formattedId || `#${order.id}`}
                                <ExternalLink className="h-2.5 w-2.5 flex-shrink-0" />
                              </Link>
                            ) : (
                              <span className="text-foreground truncate">
                                {order.formattedId || `#${order.id}`}
                              </span>
                            ))}
                        </td>
                        <td className="text-foreground px-1 py-1 align-middle leading-tight break-words whitespace-normal">
                          {product.name || 'Sin nombre'}
                        </td>
                        <td className="px-1 py-1 text-right align-middle font-medium whitespace-nowrap">
                          {productData.totalBoxes || 0}
                        </td>
                        <td className="px-1 py-1 text-right align-middle whitespace-nowrap">
                          {formatWeight(productData.totalNetWeight || 0)}
                        </td>
                        {isAccounting && (
                          <td className="px-1 py-1 text-right align-middle whitespace-nowrap">
                            <div className="text-foreground font-medium">
                              {formatCostPerKg(productData.salePricePerKg)}
                            </div>
                            <div className="text-muted-foreground">
                              {formatTotalCost(productData.saleTotal ?? productData.saleSubtotal)}
                            </div>
                          </td>
                        )}
                        {isAccounting && (
                          <td className="px-1 py-1 text-right align-middle whitespace-nowrap">
                            <div className="text-foreground font-medium">
                              {formatCostPerKg(productData.costPerKg)}
                            </div>
                            <div className="text-muted-foreground">
                              {formatTotalCost(productData.costTotal)}
                            </div>
                          </td>
                        )}
                        {isAccounting && (
                          <td className="px-1 py-1 text-right align-middle whitespace-nowrap">
                            <div className="text-foreground font-medium">
                              {formatCostPerKg(productData.marginPerKgExTax)}
                            </div>
                            <div className="text-muted-foreground">
                              {formatTotalCost(productData.marginTotalExTax)}
                            </div>
                            <div className="text-muted-foreground">
                              {formatPercentage(productData.marginPercentageExTax)}
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

        {orders.length === 0 && (
          <div className="text-muted-foreground py-2 text-center text-xs">No hay pedidos</div>
        )}
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="border-background h-3 w-3 border-2 bg-green-500"
        style={{ left: -6 }}
      />
    </div>
  );
}
