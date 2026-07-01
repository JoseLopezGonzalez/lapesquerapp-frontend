'use client';

import { useMemo, useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { AreaChart, Area, CartesianGrid, XAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuxiliaryLinesChartData } from '@/hooks/useOrdersStats';
import { formatDecimalCurrency } from '@/helpers/formats/numbers/formatNumbers';
import { SearchX, Loader2 } from 'lucide-react';
import { actualYearRange } from '@/helpers/dates';
import { DateRangePicker } from '@/components/ui/dateRangePicker';

const initialDateRange = {
  from: actualYearRange.from,
  to: actualYearRange.to,
};

export function AuxiliaryLinesChartCard() {
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('month');
  const [range, setRange] = useState(initialDateRange);

  const { data: chartData = [], isLoading } = useAuxiliaryLinesChartData({ range, groupBy });

  const totalSubtotal = useMemo(
    () => chartData.reduce((sum, item) => sum + (item.subtotal || 0), 0),
    [chartData]
  );

  return (
    <Card className="box-border w-full max-w-full min-w-0 overflow-hidden">
      <CardHeader className="w-full max-w-full min-w-0 space-y-4 pb-2">
        <div className="flex w-full min-w-0 flex-col gap-1">
          <CardTitle>Otros Artículos — Evolución</CardTitle>
          <CardDescription>Serie temporal de importes (subtotal) de otros artículos.</CardDescription>
        </div>
      </CardHeader>

      <CardContent className="w-full max-w-full min-w-0 space-y-4 overflow-x-hidden">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Tabs
            onValueChange={(value: string) => setGroupBy(value as 'day' | 'week' | 'month')}
            value={groupBy}
          >
            <TabsList>
              <TabsTrigger value="day">Día</TabsTrigger>
              <TabsTrigger value="week">Semana</TabsTrigger>
              <TabsTrigger value="month">Mes</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="w-full min-w-0 md:w-auto">
            <DateRangePicker dateRange={range} onChange={setRange} />
          </div>
        </div>

        <div className="box-border h-[250px] w-full max-w-full min-w-0 overflow-hidden">
          {isLoading ? (
            <div className="flex h-full w-full flex-col items-center justify-center">
              <Loader2 className="text-primary h-8 w-8 animate-spin" />
              <p className="text-muted-foreground mt-4 text-sm">Cargando datos...</p>
            </div>
          ) : chartData.length > 0 ? (
            <ChartContainer
              config={{
                subtotal: {
                  label: '€',
                  color: 'var(--chart-1)',
                },
              }}
              className="!aspect-auto h-full w-full max-w-full min-w-0 overflow-hidden"
            >
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="fillAuxiliarySubtotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>

                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={16}
                  interval="preserveStartEnd"
                  tickFormatter={(value: string) => {
                    if (groupBy === 'month')
                      return new Date(`${value}-01`).toLocaleDateString('es-ES', {
                        month: 'short',
                        year: '2-digit',
                      });
                    if (groupBy === 'week') return value.replace('W', 'S');
                    return new Date(value).toLocaleDateString('es-ES', {
                      month: 'short',
                      day: 'numeric',
                    });
                  }}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(rawValue: unknown) => {
                        const value = String(rawValue);
                        return groupBy === 'month'
                          ? new Date(`${value}-01`).toLocaleDateString('es-ES', {
                              month: 'long',
                              year: 'numeric',
                            })
                          : groupBy === 'week'
                            ? `Semana ${value.split('W')[1]}`
                            : new Date(value).toLocaleDateString('es-ES', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              });
                      }}
                      formatter={(value) => (
                        <div className="flex w-full items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-sm"
                              style={{ backgroundColor: 'var(--chart-1)' }}
                            />
                            <span className="text-muted-foreground">Otros artículos</span>
                          </div>
                          <span className="font-semibold">
                            {formatDecimalCurrency(Number(value))}
                          </span>
                        </div>
                      )}
                    />
                  }
                />
                <Area
                  dataKey="subtotal"
                  type="natural"
                  fill="url(#fillAuxiliarySubtotal)"
                  stroke="var(--chart-1)"
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center">
              <div className="relative">
                <div className="from-primary/20 to-secondary/20 absolute -inset-1 rounded-full bg-gradient-to-r opacity-70 blur-xl" />
                <div className="bg-background relative flex h-14 w-14 items-center justify-center rounded-full border shadow-xs">
                  <SearchX className="text-primary h-6 w-6" strokeWidth={1.5} />
                </div>
              </div>
              <h2 className="mt-3 text-lg font-medium tracking-tight">Sin datos</h2>
              <p className="text-muted-foreground mt-3 mb-2 max-w-[300px] text-center text-xs whitespace-normal">
                Ajusta el rango de fechas para ver la evolución de otros artículos.
              </p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="bg-muted/50 flex flex-row items-center justify-between gap-2 rounded-b-xl border-t p-4">
        <span className="text-muted-foreground flex text-sm">
          {!isLoading && chartData.length > 0
            ? `Total: ${formatDecimalCurrency(totalSubtotal)}`
            : !isLoading
              ? '* Análisis de otros artículos del pedido.'
              : ''}
        </span>
      </CardFooter>
    </Card>
  );
}
