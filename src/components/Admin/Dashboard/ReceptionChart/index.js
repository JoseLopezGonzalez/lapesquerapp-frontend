'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { AreaChart, Area, CartesianGrid, XAxis } from 'recharts';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSpeciesOptions } from '@/hooks/useSpeciesOptions';
import { useProductCategoryOptions, useProductFamilyOptions } from '@/hooks/useProductOptions';
import { useReceptionChartData } from '@/hooks/useDashboardCharts';
import {
  formatDecimalCurrency,
  formatDecimalWeight,
} from '@/helpers/formats/numbers/formatNumbers';
import { SearchX, Loader2 } from 'lucide-react';
import { actualYearRange } from '@/helpers/dates';
import { DateRangePicker } from '@/components/ui/dateRangePicker';

const initialDateRange = {
  from: actualYearRange.from,
  to: actualYearRange.to,
};

export function ReceptionChart() {
  const [speciesId, setSpeciesId] = useState('all');
  const [categoryId, setCategoryId] = useState('all');
  const [familyId, setFamilyId] = useState('all');
  const [unit, setUnit] = useState('quantity');
  const [groupBy, setGroupBy] = useState('month');
  const [range, setRange] = useState(initialDateRange);

  const { data: speciesOptions = [], isLoading: speciesLoading } = useSpeciesOptions();
  const { data: categoryOptions = [], isLoading: categoryLoading } = useProductCategoryOptions();
  const { data: familyOptions = [], isLoading: familyLoading } = useProductFamilyOptions();
  const { data: chartData = [], isLoading } = useReceptionChartData({
    range,
    speciesId,
    categoryId,
    familyId,
    unit,
    groupBy,
  });

  const totalKg = useMemo(() => {
    if (unit !== 'quantity' || !chartData || chartData.length === 0) return 0;
    return chartData.reduce((sum, item) => sum + (item.value || 0), 0);
  }, [chartData, unit]);

  const totalAmount = useMemo(() => {
    if (unit !== 'amount' || !chartData || chartData.length === 0) return 0;
    return chartData.reduce((sum, item) => sum + (item.value || 0), 0);
  }, [chartData, unit]);

  return (
    <Card className="box-border w-full max-w-full min-w-0 overflow-hidden">
      <CardHeader className="w-full max-w-full min-w-0 space-y-4 pb-2">
        <div className="flex w-full min-w-0 flex-col gap-1">
          <CardTitle>Recepciones</CardTitle>
          <CardDescription>
            Comparativa de recepciones en {unit === 'quantity' ? 'kilogramos' : 'euros'}.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="w-full max-w-full min-w-0 space-y-4 overflow-x-hidden">
        <Tabs onValueChange={setGroupBy} value={groupBy}>
          <TabsList className="w-auto">
            <TabsTrigger value="day">Día</TabsTrigger>
            <TabsTrigger value="week">Semana</TabsTrigger>
            <TabsTrigger value="month">Mes</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="3xl:grid-cols-6 mb-6 box-border flex w-full flex-col gap-3 md:grid md:grid-cols-2 md:gap-2">
          <div className="3xl:col-span-4 box-border w-full min-w-0 md:col-span-6">
            <div className="box-border w-full min-w-0">
              <DateRangePicker dateRange={range} onChange={setRange} />
            </div>
          </div>
          <div className="3xl:col-span-2 box-border w-full min-w-0 md:col-span-6">
            <Select
              value={speciesId}
              onValueChange={setSpeciesId}
              className="box-border w-full"
              disabled={speciesLoading}
            >
              <SelectTrigger className="box-border h-12 w-full max-w-full min-w-0 md:h-auto">
                <SelectValue placeholder="Seleccionar especie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las especies</SelectItem>
                {speciesOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="3xl:col-span-3 box-border w-full min-w-0 md:col-span-3">
            <Select
              value={categoryId}
              onValueChange={setCategoryId}
              className="box-border w-full"
              disabled={categoryLoading}
            >
              <SelectTrigger className="box-border h-12 w-full max-w-full min-w-0 md:h-auto">
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categoryOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="3xl:col-span-3 box-border w-full min-w-0 md:col-span-3">
            <Select
              value={familyId}
              onValueChange={setFamilyId}
              className="box-border w-full"
              disabled={familyLoading}
            >
              <SelectTrigger className="box-border h-12 w-full max-w-full min-w-0 md:h-auto">
                <SelectValue placeholder="Seleccionar familia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las familias</SelectItem>
                {familyOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                value: {
                  label: unit === 'quantity' ? 'Kg' : '€',
                  color: 'var(--chart-1)',
                },
              }}
              className="!aspect-auto h-full w-full max-w-full min-w-0 overflow-hidden"
            >
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
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
                  tickFormatter={(value) => {
                    // Formateo condicional según tipo
                    if (groupBy === 'month')
                      return new Date(value + '-01').toLocaleDateString('es-ES', {
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
                      labelFormatter={(value) =>
                        groupBy === 'month'
                          ? new Date(value + '-01').toLocaleDateString('es-ES', {
                              month: 'long',
                              year: 'numeric',
                            })
                          : groupBy === 'week'
                            ? `Semana ${value.split('W')[1]}`
                            : new Date(value).toLocaleDateString('es-ES', {
                                weekday: 'long', // lunes, martes, etc.
                                day: 'numeric', // 2
                                month: 'long', // julio
                                year: 'numeric', // 2025
                              })
                      }
                      formatter={(value, name, { payload }) => {
                        const color = payload?.fill ?? 'var(--chart-1)';
                        return (
                          <div className="flex w-full items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className="h-2.5 w-2.5 rounded-sm"
                                style={{ backgroundColor: color }}
                              />
                              <span className="text-muted-foreground">Recepciones</span>
                            </div>

                            <span className="font-semibold">
                              {unit === 'quantity'
                                ? formatDecimalWeight(value)
                                : formatDecimalCurrency(value)}
                            </span>
                          </div>
                        );
                      }}
                    />
                  }
                />
                <Area
                  dataKey="value"
                  type="natural"
                  fill="url(#fillValue)"
                  stroke="var(--chart-1)"
                />
                {/*  <ChartLegend content={<ChartLegendContent />} /> */}
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center">
              <div className="flex h-full w-full flex-col items-center justify-center">
                <div className="relative">
                  <div className="from-primary/20 to-secondary/20 absolute -inset-1 rounded-full bg-gradient-to-r opacity-70 blur-xl" />
                  <div className="bg-background relative flex h-14 w-14 items-center justify-center rounded-full border shadow-xs">
                    <SearchX className="text-primary h-6 w-6" strokeWidth={1.5} />
                  </div>
                </div>
                <h2 className="mt-3 text-lg font-medium tracking-tight">Sin datos</h2>
                <p className="text-muted-foreground mt-3 mb-2 max-w-[300px] text-center text-xs whitespace-normal">
                  Ajusta el rango de fechas, selecciona una especie, categoría o familia para ver
                  los datos.
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="bg-muted/50 flex flex-row items-center justify-between gap-2 rounded-b-xl border-t p-4">
        <span className="text-muted-foreground flex text-sm">
          {!isLoading && unit === 'quantity' && chartData.length > 0
            ? `Total: ${formatDecimalWeight(totalKg)}`
            : !isLoading && unit === 'amount' && chartData.length > 0
              ? `Total: ${formatDecimalCurrency(totalAmount)}`
              : !isLoading
                ? '* Análisis de las recepciones de materia prima.'
                : ''}
        </span>
        <Select value={unit} onValueChange={setUnit}>
          <SelectTrigger className="h-8 w-[160px] text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="quantity">Cantidad - Kg</SelectItem>
            <SelectItem value="amount">Importe - €</SelectItem>
          </SelectContent>
        </Select>
      </CardFooter>
    </Card>
  );
}
