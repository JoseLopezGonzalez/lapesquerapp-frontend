'use client';

import { useState } from 'react';
import { Pie, PieChart, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { useSalesBySalesperson } from '@/hooks/useOrdersStats';
import { formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';
import Loader from '@/components/Utilities/Loader';
import { SearchX } from 'lucide-react';
import { actualYearRange } from '@/helpers/dates';
import { DateRangePicker } from '@/components/ui/dateRangePicker';

const initialDateRange = {
  from: actualYearRange.from,
  to: actualYearRange.to,
};

export function SalesBySalespersonPieChart() {
  const [range, setRange] = useState(initialDateRange);
  const { data: chartData = [], isLoading } = useSalesBySalesperson(range);

  const chartConfig = {
    quantity: {
      label: 'Cantidad',
    },
    ...chartData.reduce((acc, item) => {
      acc[item.name] = {
        label: item.name,
        color: item.fill,
      };
      return acc;
    }, {}),
  };

  return (
    <Card className="w-full max-w-full overflow-hidden">
      <CardHeader className="items-start space-y-4 pb-2">
        <div className="flex w-full flex-col justify-between gap-4 sm:flex-row">
          <div>
            <CardTitle>Ranking ventas</CardTitle>
            <CardDescription>Ranking de ventas por comercial</CardDescription>
          </div>
        </div>
        <div className="w-full">
          <DateRangePicker dateRange={range} onChange={setRange} />
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader />
          </div>
        ) : !chartData || !Array.isArray(chartData) || chartData.length === 0 ? (
          <div className="flex h-full min-h-[300px] w-full flex-col items-center justify-center">
            <div className="flex h-full w-full flex-col items-center justify-center">
              <div className="relative">
                <div className="from-primary/20 to-secondary/20 absolute -inset-1 rounded-full bg-gradient-to-r opacity-70 blur-xl" />
                <div className="bg-background relative flex h-14 w-14 items-center justify-center rounded-full border shadow-xs">
                  <SearchX className="text-primary h-6 w-6" strokeWidth={1.5} />
                </div>
              </div>
              <h2 className="mt-3 text-lg font-medium tracking-tight">No hay datos</h2>
              <p className="text-muted-foreground mt-3 mb-2 max-w-[300px] text-center text-xs whitespace-normal">
                Ajusta el rango de fechas para ver el ranking de ventas por comercial.
              </p>
            </div>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name, { payload }) => {
                        const color = payload?.fill ?? '#000';
                        return (
                          <div className="flex w-full items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className="h-2.5 w-2.5 rounded-sm"
                                style={{ backgroundColor: color }}
                              />
                              <span className="text-muted-foreground">{name}</span>
                            </div>
                            <span className="text-muted-foreground text-xs font-medium">
                              {(
                                (value / chartData.reduce((acc, item) => acc + item.quantity, 0)) *
                                100
                              ).toFixed(2)}
                              %
                            </span>
                            <span className="font-semibold">{formatDecimalWeight(value)}</span>
                          </div>
                        );
                      }}
                      hideLabel
                    />
                  }
                />
                <Pie
                  data={chartData}
                  dataKey="quantity"
                  nameKey="name"
                  outerRadius={100}
                  innerRadius={50}
                  paddingAngle={2}
                />
                <ChartLegend
                  content={<ChartLegendContent nameKey="name" />}
                  className="flex flex-wrap justify-center gap-2"
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
