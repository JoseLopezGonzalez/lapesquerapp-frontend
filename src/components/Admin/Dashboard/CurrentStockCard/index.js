'use client';

import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  formatDecimal,
  formatDecimalCurrency,
  formatDecimalWeight,
  formatInteger,
} from '@/helpers/formats/numbers/formatNumbers';
import { useTotalStockStats } from '@/hooks/useStockStats';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

const LOW_COST_COVERAGE_THRESHOLD = 80;

export function CurrentStockCard() {
  const { data, isLoading } = useTotalStockStats();
  const totalStockCost = Number(data?.totalStockCost ?? 0);
  const stockCostPerKg = Number(data?.stockCostPerKg ?? 0);
  const costCoverageWeightPct = Number(data?.costCoverageWeightPct ?? 0);
  const costCoverageBoxesPct = Number(data?.costCoverageBoxesPct ?? 0);

  const isLowCoverage =
    costCoverageWeightPct < LOW_COST_COVERAGE_THRESHOLD ||
    costCoverageBoxesPct < LOW_COST_COVERAGE_THRESHOLD;

  if (isLoading)
    return (
      <Card className="relative h-full rounded-2xl border bg-gradient-to-t from-neutral-100 to-white p-4 shadow-sm dark:from-neutral-800 dark:to-neutral-900">
        <CardHeader className="p-0 pb-2">
          <div className="mb-2 flex items-center justify-between">
            <Skeleton className="h-4 w-28" />
          </div>
          <CardTitle>
            <div className="mt-2 flex flex-col gap-2">
              <Skeleton className="h-8 w-36" />
              <Skeleton className="h-3 w-40" />
            </div>
          </CardTitle>
        </CardHeader>
      </Card>
    );

  return (
    <Card className="relative h-full rounded-2xl border bg-gradient-to-t from-neutral-100 to-white p-4 shadow-sm dark:from-neutral-800 dark:to-neutral-900">
      <CardHeader className="p-0 pb-2">
        <div className="flex items-center justify-between">
          <CardDescription>Stock actual</CardDescription>
        </div>
        <CardTitle>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-medium tracking-tight">
                {formatDecimalWeight(data?.totalNetWeight)}
              </h1>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex cursor-pointer">
                    <Info className="text-muted-foreground hover:text-foreground h-4 w-4" />
                  </span>
                </TooltipTrigger>
                <TooltipContent className="w-64 p-5 text-sm">
                  <div className="grid gap-2">
                    <div className="text-foreground-300 text-[11px] font-semibold tracking-wider uppercase">
                      Coste valorado
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Importe total</span>
                      <span className="font-medium">{formatDecimalCurrency(totalStockCost)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Coste medio</span>
                      <span className="font-medium">{formatDecimal(stockCostPerKg)} €/kg</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Cobertura peso</span>
                      <span className="font-medium">{formatDecimal(costCoverageWeightPct)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Cobertura cajas</span>
                      <span className="font-medium">{formatDecimal(costCoverageBoxesPct)}%</span>
                    </div>
                    {isLowCoverage && (
                      <div className="text-foreground-300 text-xs italic">
                        Cobertura baja: el importe es orientativo.
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="mt-1 text-xs text-neutral-500 italic dark:text-neutral-400">
              {formatInteger(data?.totalPallets)} palets, {formatInteger(data?.totalBoxes)} cajas
              {data?.totalStores != null && ` · ${data.totalStores} almacenes`}
            </div>
          </div>
        </CardTitle>
      </CardHeader>
    </Card>
  );
}
