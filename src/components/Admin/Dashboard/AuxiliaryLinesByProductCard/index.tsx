'use client';

import { useMemo, useState } from 'react';
import { SearchX } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDecimalCurrency, formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';
import { actualYearRange } from '@/helpers/dates';
import { DateRangePicker } from '@/components/ui/dateRangePicker';
import Loader from '@/components/Utilities/Loader';
import { useAuxiliaryLinesByProductStats } from '@/hooks/useOrdersStats';

const initialDateRange = {
  from: actualYearRange.from,
  to: actualYearRange.to,
};

const chartConfig = {
  value: {
    label: 'Subtotal',
    color: 'var(--chart-1)',
  },
};

export function AuxiliaryLinesByProductCard() {
  const [range, setRange] = useState(initialDateRange);
  const { data, isLoading } = useAuxiliaryLinesByProductStats({ range });

  const chartData = useMemo(
    () =>
      data.map((item) => ({
        name: item.name,
        value: item.subtotal,
        quantity: item.quantity,
        unit: item.unit,
      })),
    [data]
  );

  if (isLoading && chartData.length === 0) {
    return (
      <Card className="w-full max-w-full overflow-hidden">
        <CardHeader className="space-y-4 pb-2">
          <Skeleton className="h-5 w-52" />
          <Skeleton className="h-8 w-full max-w-md" />
        </CardHeader>
        <CardContent className="mt-4 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-full overflow-hidden">
      <CardHeader className="space-y-4 pb-2">
        <div>
          <CardTitle>Otros Artículos — Ranking por Artículo</CardTitle>
          <CardDescription>Agrupado por importe (subtotal)</CardDescription>
        </div>
        <div className="w-full min-w-0">
          <DateRangePicker dateRange={range} onChange={setRange} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          {isLoading ? (
            <div className="flex h-full w-full items-center justify-center">
              <Loader />
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex h-full w-full flex-col items-center justify-center">
              <div className="relative">
                <div className="from-primary/20 to-secondary/20 absolute -inset-1 rounded-full bg-gradient-to-r opacity-70 blur-xl" />
                <div className="bg-background relative flex h-14 w-14 items-center justify-center rounded-full border shadow-xs">
                  <SearchX className="text-primary h-6 w-6" strokeWidth={1.5} />
                </div>
              </div>
              <h2 className="mt-3 text-lg font-medium tracking-tight">No hay datos</h2>
              <p className="text-muted-foreground mt-3 mb-2 max-w-[300px] text-center text-xs whitespace-normal">
                Ajusta el rango de fechas para ver el ranking de otros artículos.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(chartData.length * 45, 200)}>
              <ChartContainer config={chartConfig}>
                <BarChart
                  data={chartData}
                  layout="vertical"
                  barCategoryGap={12}
                  margin={{ right: 90, top: 8, bottom: 8 }}
                >
                  <CartesianGrid horizontal={false} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} hide />
                  <XAxis type="number" hide />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        indicator="line"
                        formatter={(value, _name, item) => {
                          const payload = item?.payload as
                            | { quantity?: number; unit?: string }
                            | undefined;
                          return (
                            <div className="flex w-full flex-col gap-0.5">
                              <span className="font-semibold">
                                {formatDecimalCurrency(Number(value))}
                              </span>
                              <span className="text-muted-foreground text-xs">
                                {formatDecimalWeight(Number(payload?.quantity ?? 0))}{' '}
                                {payload?.unit ?? ''}
                              </span>
                            </div>
                          );
                        }}
                      />
                    }
                  />
                  <Bar dataKey="value" fill={chartConfig.value.color} radius={4} barSize={28}>
                    <LabelList
                      dataKey="value"
                      position="right"
                      offset={8}
                      className="fill-foreground text-nowrap"
                      fontSize={12}
                      formatter={(value: number) => formatDecimalCurrency(value)}
                    />
                    <LabelList
                      dataKey="name"
                      position="insideLeft"
                      offset={8}
                      className="fill-background text-nowrap"
                      fontSize={12}
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
      <CardFooter className="text-muted-foreground flex items-center justify-between gap-2 text-sm">
        * Mostrando importe agrupado por artículo auxiliar
      </CardFooter>
    </Card>
  );
}
