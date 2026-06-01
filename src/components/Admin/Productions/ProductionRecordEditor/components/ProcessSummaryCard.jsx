'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Scale, Calculator, TrendingDown, TrendingUp } from 'lucide-react';
import {
  formatDecimalWeight,
  formatDecimal,
  formatInteger,
} from '@/helpers/formats/numbers/formatNumbers';
import { useProductionRecordContextOptional } from '@/context/ProductionRecordContext';

/**
 * Tarjeta de resumen del proceso con estadísticas
 * Usa el contexto para obtener el record automáticamente
 */
export const ProcessSummaryCard = ({ record: recordProp = null }) => {
  // Obtener del contexto (opcional)
  const context = useProductionRecordContextOptional();
  const record = context?.record || recordProp;
  if (
    !record ||
    (record.totalInputWeight === undefined && record.totalOutputWeight === undefined)
  ) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="text-primary h-5 w-5" />
          Resumen del Proceso
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-3 text-sm lg:grid-cols-5">
          <div>
            <p className="text-muted-foreground mb-1 flex items-center gap-1 text-xs">
              <Package className="h-3 w-3" />
              Cajas entrada
            </p>
            <p className="text-lg font-bold">{formatInteger(record.totalInputBoxes || 0)}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1 flex items-center gap-1 text-xs">
              <Scale className="h-3 w-3" />
              Peso entrada
            </p>
            <p className="text-lg font-bold">{formatDecimalWeight(record.totalInputWeight || 0)}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1 flex items-center gap-1 text-xs">
              <Package className="h-3 w-3" />
              Cajas salida
            </p>
            <p className="text-lg font-bold">{formatInteger(record.totalOutputBoxes || 0)}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1 flex items-center gap-1 text-xs">
              <Scale className="h-3 w-3" />
              Peso salida
            </p>
            <p className="text-lg font-bold">
              {formatDecimalWeight(record.totalOutputWeight || 0)}
            </p>
          </div>
          {(record.waste !== undefined && record.waste > 0) ||
          (record.yield !== undefined && record.yield > 0) ? (
            <div
              className={
                record.waste > 0
                  ? 'bg-destructive/10 border-destructive/20 rounded-lg border p-2'
                  : 'rounded-lg border border-green-500/20 bg-green-500/10 p-2'
              }
            >
              <div className="mb-1 flex items-center gap-1.5">
                {record.waste > 0 ? (
                  <TrendingDown className="text-destructive h-3 w-3" />
                ) : (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                )}
                <p className="text-muted-foreground text-xs font-medium">
                  {record.waste > 0 ? 'Merma' : 'Rendimiento'}
                </p>
              </div>
              <p className="text-base font-bold">
                {record.waste > 0
                  ? formatDecimalWeight(record.waste)
                  : formatDecimalWeight(record.yield)}
              </p>
              <p className="text-muted-foreground text-xs">
                {record.waste > 0
                  ? `${formatDecimal(record.wastePercentage || 0)}%`
                  : `${formatDecimal(record.yieldPercentage || 0)}%`}
              </p>
            </div>
          ) : (
            <div className="bg-muted/30 flex items-center justify-center rounded-lg border border-dashed p-2">
              <p className="text-muted-foreground text-xs">Sin datos</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
