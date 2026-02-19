'use client';

import { useState, useMemo } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
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
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';
import { RadialBar, RadialBarChart } from 'recharts';
import { formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';
import { PiChartLineUp } from 'react-icons/pi';
import { useSpeciesOptions } from '@/hooks/useSpeciesOptions';
import { useDailyCalibersBySpecies } from '@/hooks/useDailyCalibersBySpecies';

const todayYmd = () => new Date().toISOString().slice(0, 10);

const CHART_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

export function DailyCalibersBySpeciesCard() {
    const [date, setDate] = useState(todayYmd);
    const [speciesId, setSpeciesId] = useState('all');

    const { data: speciesOptions = [], isLoading: speciesLoading } = useSpeciesOptions();
    const { data, isLoading, error } = useDailyCalibersBySpecies(date, speciesId);

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
                <CardHeader>
                    <div>
                        <CardTitle className="text-base">
                            <Skeleton className="h-6 w-48" />
                        </CardTitle>
                        <CardDescription>
                            <Skeleton className="h-4 w-64 mt-2" />
                        </CardDescription>
                    </div>
                    <div className="flex flex-row gap-2 mt-2">
                        <Skeleton className="h-10 flex-1" />
                        <Skeleton className="h-10 flex-1" />
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 mt-2 w-full mb-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="space-y-1">
                            <div className="flex justify-between items-center">
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
        <Card className="w-full max-w-full overflow-hidden min-w-0 box-border">
            <CardHeader className="p-3 md:p-6 space-y-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div>
                        <CardTitle className="text-base md:text-lg">
                            Calibres diarios por especie
                        </CardTitle>
                        <CardDescription className="text-sm mt-1">
                            Desglose diario de pesos por calibre para la fecha seleccionada.
                        </CardDescription>
                    </div>
                    {!error && (
                        <p className="text-xl font-semibold tabular-nums text-foreground shrink-0 mt-1 sm:mt-0">
                            {formatDecimalWeight(totalKg)}
                        </p>
                    )}
                </div>
                <div className="flex flex-row gap-2 w-full">
                    <Select
                        value={speciesId}
                        onValueChange={setSpeciesId}
                        className="flex-1 min-w-0"
                    >
                        <SelectTrigger className="h-10">
                            <SelectValue placeholder="Seleccionar especie" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas las especies</SelectItem>
                            {speciesOptions.map((opt) => (
                                <SelectItem key={opt.id} value={String(opt.id)}>
                                    {opt.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-auto min-w-[140px] h-10"
                    />
                </div>
            </CardHeader>

            <CardContent className="px-3 md:px-6 pb-4 md:pb-6 space-y-4">
                {error && (
                    <div className="flex flex-col items-center justify-center py-8 min-h-[200px]">
                        <p className="text-destructive text-sm text-center px-4">
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
                                <div className="flex justify-between items-center">
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
                                                    <span className="font-mono font-medium tabular-nums text-foreground shrink-0">
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
                        <div className="space-y-4">
                            {calibers.map((item) => (
                                <div key={item.product_id} className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-foreground truncate">
                                            {item.name}
                                        </span>
                                        <div className="text-sm text-muted-foreground font-mono flex gap-2 items-center flex-shrink-0">
                                            <span>{formatDecimalWeight(item.weight_kg)}</span>
                                            <span className="text-xs">
                                                ({typeof item.percentage === 'number' ? item.percentage.toFixed(1) : 0}%)
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
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
                    <div className="flex flex-col items-center justify-center py-8 min-h-[200px]">
                        <div className="relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-xl opacity-70" />
                            <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-background border shadow-xs">
                                <PiChartLineUp className="h-6 w-6 text-primary" strokeWidth={1.5} />
                            </div>
                        </div>
                        <h2 className="mt-4 text-lg font-medium tracking-tight">
                            No hay datos
                        </h2>
                        <p className="mt-2 text-center text-muted-foreground max-w-[280px] text-xs whitespace-normal">
                            Prueba a filtrar por otro día o especie.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
