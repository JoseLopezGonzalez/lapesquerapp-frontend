'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/Shadcn/Combobox';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { RadialBar, RadialBarChart } from 'recharts';
import { formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';
import { PiChartLineUp } from 'react-icons/pi';
import { useSpeciesOptions } from '@/hooks/useSpeciesOptions';
import { useDailyCalibersBySpecies } from '@/hooks/useDailyCalibersBySpecies';

const todayYmd = () => new Date().toISOString().slice(0, 10);

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

const SPECIES_ALL_OPTION = {
  value: 'all',
  label: 'Todas las especies',
};

export function DailyCalibersBySpeciesCard() {
  const [date, setDate] = useState(todayYmd);
  const [speciesId, setSpeciesId] = useState('all');

  const { data: speciesOptions = [], isLoading: speciesLoading } = useSpeciesOptions();
  const { data, isLoading, error } = useDailyCalibersBySpecies(date, speciesId);

  const speciesComboboxOptions = useMemo(
    () => [
      SPECIES_ALL_OPTION,
      ...speciesOptions.map((opt) => ({
        value: String(opt.id),
        label: opt.name,
      })),
    ],
    [speciesOptions]
  );

  const totalKg = data?.total_weight_kg ?? 0;
  const calibers = data?.calibers ?? [];
  const hasCalibers = calibers.length > 0;

  const { chartData, chartConfig } = useMemo(() => {
    const weightKey = 'weight_kg';
    const config = {
      [weightKey]: { label: 'Peso (kg)' },
    };
    const data = calibers.map((c, i) => {
      const key = `caliber_${i}`;
      config[key] = {
        label: c.name,
        color: CHART_COLORS[i % CHART_COLORS.length],
      };
      return {
        name: c.name,
        [weightKey]: c.weight_kg,
        fill: `var(--color-${key})`,
      };
    });
    return { chartData: data, chartConfig: config };
  }, [calibers]);

  if (speciesLoading) {
    return (
      <Card className="w-full max-w-full overflow-hidden">
        <CardHeader className="space-y-4 pb-2">
          <div>
            <CardTitle>
              <Skeleton className="h-6 w-48" />
            </CardTitle>
            <CardDescription>
              <Skeleton className="mt-2 h-4 w-64" />
            </CardDescription>
          </div>
          <div className="flex flex-row gap-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/4" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="box-border w-full max-w-full min-w-0 overflow-hidden">
      <CardHeader className="space-y-4 pb-2">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div>
            <CardTitle>Calibres diarios por especie</CardTitle>
            <CardDescription>Desglose diario de pesos por calibre.</CardDescription>
          </div>
        </div>
        <div className="flex w-full flex-row gap-2">
          <div className="min-w-0 flex-1">
            <Combobox
              options={speciesComboboxOptions}
              placeholder="Seleccionar especie"
              searchPlaceholder="Buscar especie..."
              notFoundMessage="No se encontraron especies"
              value={speciesId}
              onChange={(value) => setSpeciesId(value || 'all')}
              className="h-10"
            />
          </div>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-10 w-auto min-w-[140px]"
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="flex min-h-[200px] flex-col items-center justify-center py-8">
            <p className="text-destructive px-4 text-center text-sm">
              {error.status === 403
                ? 'No tienes permiso para ver recepciones.'
                : error.status === 422 && error.data?.errors
                  ? Object.values(error.data.errors).flat().join(' ')
                  : error.message || 'Error al cargar los datos.'}
            </p>
          </div>
        )}

        {!error && isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        )}

        {!error && !isLoading && hasCalibers && (
          <>
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[250px] w-full"
            >
              <RadialBarChart data={chartData} innerRadius={30} outerRadius={110}>
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      hideLabel
                      nameKey="name"
                      formatter={(value, _name, item, _index, payload) => (
                        <div className="flex w-full items-center gap-2">
                          <div
                            className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                            style={{ backgroundColor: payload?.fill || item?.color }}
                          />
                          <span className="text-muted-foreground flex-1 truncate">
                            {payload?.name ?? item?.name}
                          </span>
                          <span className="text-foreground shrink-0 font-mono font-medium tabular-nums">
                            {formatDecimalWeight(value)}
                          </span>
                        </div>
                      )}
                    />
                  }
                />
                <RadialBar dataKey="weight_kg" background />
              </RadialBarChart>
            </ChartContainer>
            <div className="max-h-[200px] min-h-0 space-y-4 overflow-auto pr-2">
              {calibers.map((item) => (
                <div key={item.product_id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground truncate text-sm font-medium">
                      {item.name}
                    </span>
                    <div className="text-muted-foreground flex flex-shrink-0 items-center gap-2 font-mono text-sm">
                      <span>{formatDecimalWeight(item.weight_kg)}</span>
                      <span className="text-xs">
                        ({typeof item.percentage === 'number' ? item.percentage.toFixed(1) : 0}%)
                      </span>
                    </div>
                  </div>
                  <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                    <div
                      className="bg-primary h-full transition-all duration-500 ease-out"
                      style={{
                        width: `${Math.min(100, item.percentage ?? 0)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {!error && !isLoading && !hasCalibers && (
          <div className="flex min-h-[200px] flex-col items-center justify-center py-8">
            <div className="relative">
              <div className="from-primary/20 to-secondary/20 absolute -inset-1 rounded-full bg-gradient-to-r opacity-70 blur-xl" />
              <div className="bg-background relative flex h-14 w-14 items-center justify-center rounded-full border shadow-xs">
                <PiChartLineUp className="text-primary h-6 w-6" strokeWidth={1.5} />
              </div>
            </div>
            <h2 className="mt-4 text-lg font-medium tracking-tight">No hay datos</h2>
            <p className="text-muted-foreground mt-2 max-w-[280px] text-center text-xs whitespace-normal">
              Prueba a filtrar por otro día o especie.
            </p>
          </div>
        )}
      </CardContent>
      {!error && (
        <CardFooter className="bg-muted/50 flex flex-row items-center justify-between gap-2 border-t px-4 py-3 text-sm">
          <span className="text-muted-foreground">Total</span>
          <span className="text-foreground font-semibold tabular-nums">
            {formatDecimalWeight(totalKg)}
          </span>
        </CardFooter>
      )}
    </Card>
  );
}
