'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Toggle } from '@/components/ui/toggle';
import { TrendingUp, TrendingDown, Info, Calendar } from 'lucide-react';
import { useOrdersTotalAmountStats } from '@/hooks/useOrdersStats';
import { formatDecimalCurrency } from '@/helpers/formats/numbers/formatNumbers';

interface OrdersTotalAmountStats {
  value: number | null;
  subtotal: number;
  tax: number;
  comparisonValue: number | null;
  comparisonSubtotal: number | null;
  comparisonTax: number | null;
  percentageChange: number | null;
  range: { from: string; to: string; fromPrev: string; toPrev: string };
}

const formatDateRange = (from: string, to: string) => {
  const f = new Date(from).toLocaleDateString('es-ES');
  const t = new Date(to).toLocaleDateString('es-ES');
  return `${f} → ${t}`;
};

export function TotalAmountSoldCard() {
  const [includeAuxiliary, setIncludeAuxiliary] = useState(false);
  const { data, isLoading } = useOrdersTotalAmountStats({ includeAuxiliary }) as {
    data: OrdersTotalAmountStats | null;
    isLoading: boolean;
  };

  const percentage = data?.percentageChange;
  const hasValidPercentage = typeof percentage === 'number' && !isNaN(percentage);
  const isUp = hasValidPercentage && (percentage as number) > 0;
  const isDown = hasValidPercentage && (percentage as number) < 0;
  const TrendIcon = isUp ? TrendingUp : isDown ? TrendingDown : null;
  const trendColor = isUp ? 'text-green-600' : isDown ? 'text-red-600' : '';

  if (isLoading) {
    return (
      <Card className="relative h-full rounded-2xl border bg-gradient-to-t from-neutral-100 to-white p-4 shadow-sm dark:from-neutral-800 dark:to-neutral-900">
        <CardHeader className="p-0 pb-2">
          <div className="mb-2 flex items-center justify-between">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-4 w-12" />
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
  }

  return (
    <Card className="h-full rounded-2xl border bg-gradient-to-t from-neutral-100 to-white p-4 shadow-sm dark:from-neutral-800 dark:to-neutral-900">
      <CardHeader className="p-0 pb-2">
        <div className="flex items-center justify-between">
          <CardDescription>Importe Total de Ventas</CardDescription>
          <div className="flex items-center gap-1">
            <Toggle
              pressed={includeAuxiliary}
              onPressedChange={setIncludeAuxiliary}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              Incluir auxiliares
            </Toggle>
            {hasValidPercentage && TrendIcon && (
              <Badge
                variant="outline"
                className={`flex items-center gap-1 px-2 py-1 text-xs ${trendColor}`}
              >
                <TrendIcon className="h-3 w-3" />
                {(percentage as number) > 0 ? '+' : ''}
                {(percentage as number).toFixed(1)}%
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-start gap-2">
          <CardTitle>
            {data?.value !== null ? (
              <div>
                <h1 className="text-3xl font-medium tracking-tight">
                  {formatDecimalCurrency(data?.subtotal ?? 0)}
                </h1>
                <div className="mt-1 text-xs text-neutral-500 italic dark:text-neutral-400">
                  {formatDecimalCurrency(data?.value ?? 0)} con IVA
                  {includeAuxiliary ? ' (incl. auxiliares)' : ''}
                </div>
              </div>
            ) : (
              <span className="text-muted-foreground text-base">Sin datos</span>
            )}
          </CardTitle>
          {data?.value !== null && data?.range && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="mt-1.5 shrink-0 cursor-pointer">
                  <Info className="text-muted-foreground hover:text-foreground h-4 w-4" />
                </span>
              </TooltipTrigger>
              <TooltipContent className="w-64 p-5 text-sm">
                <div className="grid gap-2">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-foreground-300 text-[11px] font-semibold tracking-wider uppercase">
                      Año en curso
                    </span>
                    <span className="text-foreground-300 ml-1 flex items-center gap-1 text-xs">
                      <Calendar className="h-3 w-3" />
                      {formatDateRange(data.range.from, data.range.to)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Importe</span>
                    <span className="font-medium">{formatDecimalCurrency(data.value ?? 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span className="font-medium">{formatDecimalCurrency(data.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>IVA</span>
                    <span className="font-medium">{formatDecimalCurrency(data.tax)}</span>
                  </div>

                  <Separator className="bg-foreground-300 my-2" />
                  {data.comparisonValue ? (
                    <div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-foreground-300 text-[11px] font-semibold tracking-wider uppercase">
                          Año anterior
                        </span>
                        <span className="text-foreground-300 ml-1 flex items-center gap-1 text-xs">
                          <Calendar className="h-3 w-3" />
                          {formatDateRange(data.range.fromPrev, data.range.toPrev)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Importe</span>
                        <span className="font-medium">
                          {formatDecimalCurrency(data.comparisonValue)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span className="font-medium">
                          {formatDecimalCurrency(data.comparisonSubtotal ?? 0)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>IVA</span>
                        <span className="font-medium">
                          {formatDecimalCurrency(data.comparisonTax ?? 0)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-foreground-300 text-xs italic">
                      No hay datos de años anteriores
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </CardHeader>
    </Card>
  );
}
