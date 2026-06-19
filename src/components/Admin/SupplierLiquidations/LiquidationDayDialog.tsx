'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronDown, ChevronRight, Package, Truck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { LiquidationReception, LiquidationDispatch } from '@/types/supplierLiquidation';

export interface LiquidationDayData {
  receptions: LiquidationReception[];
  dispatches: LiquidationDispatch[];
}

interface LiquidationDayDialogProps {
  dateStr: string;
  data: LiquidationDayData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatWeight(value: number | undefined | null): string {
  return (
    new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value ?? 0) + ' kg'
  );
}

function formatCurrency(value: number | undefined | null): string {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value ?? 0);
}

function formatPricePerKg(value: number | undefined | null): string {
  return (
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value ?? 0) +
    '/kg'
  );
}

export function LiquidationDayDialog({
  dateStr,
  data,
  open,
  onOpenChange,
}: LiquidationDayDialogProps) {
  const [expandedReceptions, setExpandedReceptions] = useState<Set<number>>(new Set());
  const [expandedDispatches, setExpandedDispatches] = useState<Set<number>>(new Set());

  const dayTitle = format(parseISO(dateStr), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });

  const toggleReception = (id: number) =>
    setExpandedReceptions((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleDispatch = (id: number) =>
    setExpandedDispatches((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const { receptions, dispatches } = data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="2xl" className="flex max-h-[80vh] flex-col">
        <DialogHeader>
          <DialogTitle className="capitalize">{dayTitle}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="-mx-6 min-h-0 flex-1 px-6">
          <div className="space-y-4 pb-4">
            {/* Recepciones */}
            {receptions.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                    Recepciones
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {receptions.length}
                  </Badge>
                </div>

                <div className="space-y-1">
                  {receptions.map((reception) => {
                    const isExpanded = expandedReceptions.has(reception.id);
                    const isLiquidated = !!reception.supplier_liquidation_id;

                    return (
                      <div
                        key={reception.id}
                        className={cn(
                          'overflow-hidden rounded-md border',
                          isLiquidated && 'opacity-60'
                        )}
                      >
                        <button
                          className="flex w-full items-center gap-2 bg-blue-50/70 px-3 py-2 text-left transition-colors hover:bg-blue-100/70 dark:bg-blue-950/20 dark:hover:bg-blue-950/40"
                          onClick={() => toggleReception(reception.id)}
                        >
                          {isExpanded ? (
                            <ChevronDown className="text-muted-foreground h-4 w-4 shrink-0" />
                          ) : (
                            <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
                          )}
                          <span className="flex-1 text-sm font-semibold">
                            Recepción #{reception.id}
                          </span>
                          {isLiquidated && (
                            <Badge
                              variant="outline"
                              className="border-amber-400 text-xs text-amber-600 dark:text-amber-400"
                            >
                              Liq. #{reception.supplier_liquidation_id}
                            </Badge>
                          )}
                          <span className="text-muted-foreground text-xs">
                            {formatWeight(reception.calculated_total_net_weight)}
                          </span>
                          <span className="text-xs font-medium">
                            {formatCurrency(reception.calculated_total_amount)}
                          </span>
                        </button>

                        {isExpanded && reception.products && reception.products.length > 0 && (
                          <div className="divide-y divide-border/50 bg-blue-50/30 dark:bg-blue-950/10">
                            {reception.products.map((product, i) => (
                              <div
                                key={product.id ?? i}
                                className="flex items-center gap-2 px-3 py-1.5 text-xs"
                              >
                                <span className="text-muted-foreground pl-4">└─</span>
                                <span className="text-muted-foreground flex-1">
                                  {product.product?.name ?? '—'}
                                </span>
                                <span>{formatWeight(product.net_weight)}</span>
                                <span className="text-muted-foreground">
                                  {formatPricePerKg(product.price)}
                                </span>
                                <span className="font-medium">{formatCurrency(product.amount)}</span>
                              </div>
                            ))}
                            <div className="flex items-center gap-2 bg-blue-100/50 px-3 py-1.5 text-xs font-semibold dark:bg-blue-900/20">
                              <span className="flex-1 pl-4">Total</span>
                              <span>{formatWeight(reception.calculated_total_net_weight)}</span>
                              <span className="text-muted-foreground">
                                {reception.average_price
                                  ? formatPricePerKg(reception.average_price)
                                  : '—'}
                              </span>
                              <span>{formatCurrency(reception.calculated_total_amount)}</span>
                            </div>
                            {reception.declared_total_net_weight != null && (
                              <div className="text-muted-foreground flex items-center gap-2 px-3 py-1.5 text-xs">
                                <span className="flex-1 pl-4">Total Declarado</span>
                                <span>{formatWeight(reception.declared_total_net_weight)}</span>
                                <span />
                                <span>{formatCurrency(reception.declared_total_amount)}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {receptions.length > 0 && dispatches.length > 0 && <Separator />}

            {/* Salidas de cebo */}
            {dispatches.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-sm font-semibold text-orange-700 dark:text-orange-400">
                    Salidas de Cebo
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {dispatches.length}
                  </Badge>
                </div>

                <div className="space-y-1">
                  {dispatches.map((dispatch) => {
                    const isExpanded = expandedDispatches.has(dispatch.id);
                    const isLiquidated = !!dispatch.supplier_liquidation_id;

                    return (
                      <div
                        key={dispatch.id}
                        className={cn(
                          'overflow-hidden rounded-md border',
                          isLiquidated && 'opacity-60'
                        )}
                      >
                        <button
                          className="flex w-full items-center gap-2 bg-orange-50/70 px-3 py-2 text-left transition-colors hover:bg-orange-100/70 dark:bg-orange-950/20 dark:hover:bg-orange-950/40"
                          onClick={() => toggleDispatch(dispatch.id)}
                        >
                          {isExpanded ? (
                            <ChevronDown className="text-muted-foreground h-4 w-4 shrink-0" />
                          ) : (
                            <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
                          )}
                          <span className="flex-1 text-sm font-semibold">
                            Salida #{dispatch.id}
                          </span>
                          {dispatch.export_type && (
                            <Badge
                              variant={dispatch.export_type === 'a3erp' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {dispatch.export_type === 'a3erp' ? 'A3ERP' : 'FACILCOM'}
                            </Badge>
                          )}
                          {isLiquidated && (
                            <Badge
                              variant="outline"
                              className="border-amber-400 text-xs text-amber-600 dark:text-amber-400"
                            >
                              Liq. #{dispatch.supplier_liquidation_id}
                            </Badge>
                          )}
                          <span className="text-muted-foreground text-xs">
                            {formatWeight(dispatch.total_net_weight)}
                          </span>
                          <span className="text-xs font-medium">
                            {formatCurrency(dispatch.total_amount)}
                          </span>
                        </button>

                        {isExpanded && dispatch.products && dispatch.products.length > 0 && (
                          <div className="divide-y divide-border/50 bg-orange-50/30 dark:bg-orange-950/10">
                            {dispatch.products.map((product, i) => {
                              let amountWithIva = product.amount;
                              if (
                                (dispatch.iva_amount ?? 0) > 0 &&
                                (dispatch.base_amount ?? 0) > 0
                              ) {
                                amountWithIva +=
                                  (product.amount / dispatch.base_amount!) * dispatch.iva_amount!;
                              }
                              return (
                                <div
                                  key={product.id ?? i}
                                  className="flex items-center gap-2 px-3 py-1.5 text-xs"
                                >
                                  <span className="text-muted-foreground pl-4">└─</span>
                                  <span className="text-muted-foreground flex-1">
                                    {product.product?.name ?? '—'}
                                  </span>
                                  <span>{formatWeight(product.net_weight)}</span>
                                  <span className="text-muted-foreground">
                                    {formatPricePerKg(product.price)}
                                  </span>
                                  <span className="font-medium">{formatCurrency(product.amount)}</span>
                                  <span className="font-medium">{formatCurrency(amountWithIva)}</span>
                                </div>
                              );
                            })}
                            <div className="flex items-center gap-2 bg-orange-100/50 px-3 py-1.5 text-xs font-semibold dark:bg-orange-900/20">
                              <span className="flex-1 pl-4">Total</span>
                              <span>{formatWeight(dispatch.total_net_weight)}</span>
                              <span />
                              <span>
                                {formatCurrency(dispatch.base_amount ?? dispatch.total_amount)}
                              </span>
                              <span>{formatCurrency(dispatch.total_amount)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
