'use client';

import { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import { Loader2, SearchX } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { DateRangePicker } from '@/components/ui/dateRangePicker';
import { Combobox } from '@/components/Shadcn/Combobox';
import { useOrdersProfitabilityTimeline } from '@/hooks/useOrdersStats';
import { useProductOptions } from '@/hooks/useProductOptions';
import { actualYearRange } from '@/helpers/dates';
import { formatDecimal, formatDecimalCurrency } from '@/helpers/formats/numbers/formatNumbers';

const initialDateRange = {
  from: actualYearRange.from,
  to: actualYearRange.to,
};

const PRODUCT_ALL_OPTION = {
  value: 'all',
  label: 'Todos los productos',
};

const metricConfig = {
  grossMargin: {
    label: 'Margen bruto',
    color: 'var(--chart-1)',
    formatter: (value) => (typeof value === 'number' ? formatDecimalCurrency(value) : '—'),
  },
  marginPercentage: {
    label: 'Margen %',
    color: 'var(--chart-2)',
    formatter: (value) => (typeof value === 'number' ? `${formatDecimal(value)} %` : '—'),
  },
  totalRevenue: {
    label: 'Importe',
    color: 'var(--chart-3)',
    formatter: (value) => (typeof value === 'number' ? formatDecimalCurrency(value) : '—'),
  },
};

function getFooterSummary(series = []) {
  return series.reduce(
    (acc, item) => {
      acc.ordersCount += item.ordersCount || 0;
      acc.totalRevenue += item.totalRevenue || 0;
      return acc;
    },
    { ordersCount: 0, totalRevenue: 0 }
  );
}

export function OrdersProfitabilityTimelineCard() {
  const [range, setRange] = useState(initialDateRange);
  const [granularity, setGranularity] = useState('month');
  const [metric, setMetric] = useState('grossMargin');
  const [productId, setProductId] = useState('all');
  const { productOptions, loading: productsLoading } = useProductOptions();
  const { data, isLoading } = useOrdersProfitabilityTimeline({ range, granularity, productId });

  const comboboxOptions = useMemo(() => [PRODUCT_ALL_OPTION, ...productOptions], [productOptions]);
  const selectedMetric = metricConfig[metric];
  const chartData = useMemo(
    () =>
      (data?.series ?? []).map((item) => ({
        ...item,
        value: typeof item[metric] === 'number' ? item[metric] : null,
      })),
    [data?.series, metric]
  );
  const summary = useMemo(() => getFooterSummary(data?.series ?? []), [data?.series]);

  return (
    <Card className="w-full max-w-full overflow-hidden">
      <CardHeader className="space-y-4 pb-2">
        <div className="flex flex-col gap-1">
          <CardTitle>Evolución de rentabilidad</CardTitle>
          <CardDescription>
            Seguimiento temporal de margen, importe y rentabilidad del periodo.
          </CardDescription>
        </div>

        <Tabs value={granularity} onValueChange={setGranularity}>
          <TabsList className="w-auto">
            <TabsTrigger value="day">Día</TabsTrigger>
            <TabsTrigger value="week">Semana</TabsTrigger>
            <TabsTrigger value="month">Mes</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-1 gap-2">
          <DateRangePicker dateRange={range} onChange={setRange} />
          <Combobox
            options={comboboxOptions}
            placeholder="Todos los productos"
            searchPlaceholder="Buscar producto..."
            notFoundMessage="No se encontraron productos"
            value={productId}
            onChange={(value) => setProductId(value || 'all')}
            loading={productsLoading}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="h-[280px] w-full max-w-full min-w-0 overflow-hidden">
          {isLoading ? (
            <div className="flex h-full w-full flex-col items-center justify-center">
              <Loader2 className="text-primary h-8 w-8 animate-spin" />
              <p className="text-muted-foreground mt-4 text-sm">Cargando datos...</p>
            </div>
          ) : chartData.length > 0 ? (
            <ChartContainer
              config={{
                value: {
                  label: selectedMetric.label,
                  color: selectedMetric.color,
                },
              }}
              className="!aspect-auto h-full w-full max-w-full min-w-0 overflow-hidden"
            >
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="profitabilityTimelineFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={selectedMetric.color} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={selectedMetric.color} stopOpacity={0.12} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="period"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={16}
                  interval="preserveStartEnd"
                  tickFormatter={(_, index) => chartData[index]?.periodLabel ?? ''}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.periodLabel ?? ''}
                      formatter={(value, _name, item) => {
                        const payload = item?.payload;
                        return (
                          <div className="grid w-full gap-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-muted-foreground">{selectedMetric.label}</span>
                              <span className="font-semibold">
                                {selectedMetric.formatter(value)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-muted-foreground">Pedidos</span>
                              <span className="font-medium">{payload?.ordersCount ?? 0}</span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-muted-foreground">Importe</span>
                              <span className="font-medium">
                                {metricConfig.totalRevenue.formatter(payload?.totalRevenue)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-muted-foreground">Coste</span>
                              <span className="font-medium">
                                {metricConfig.grossMargin.formatter(payload?.totalCost)}
                              </span>
                            </div>
                          </div>
                        );
                      }}
                    />
                  }
                />
                <Area
                  dataKey="value"
                  type="natural"
                  stroke={selectedMetric.color}
                  fill="url(#profitabilityTimelineFill)"
                  connectNulls={metric === 'totalRevenue'}
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
              <p className="text-muted-foreground mt-3 mb-2 max-w-[320px] text-center text-xs">
                Ajusta el rango de fechas o el producto para ver la evolución de rentabilidad.
              </p>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="bg-muted/50 flex flex-col gap-2 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-muted-foreground text-sm">
          {!isLoading && chartData.length > 0
            ? `${summary.ordersCount} pedidos · ${formatDecimalCurrency(summary.totalRevenue)} de importe`
            : !isLoading
              ? '* Serie continua del periodo seleccionado.'
              : ''}
        </span>
        <Select value={metric} onValueChange={setMetric}>
          <SelectTrigger className="h-8 w-full text-sm sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="grossMargin">Margen bruto</SelectItem>
            <SelectItem value="marginPercentage">Margen %</SelectItem>
            <SelectItem value="totalRevenue">Importe</SelectItem>
          </SelectContent>
        </Select>
      </CardFooter>
    </Card>
  );
}
