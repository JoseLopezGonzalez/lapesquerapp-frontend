"use client"

import { useState } from "react"
import {
    RadarChart,
    Radar,
    PolarAngleAxis,
    PolarGrid,
    PolarRadiusAxis,
} from "recharts"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { TrendingUp, Truck } from "lucide-react"
import { useTransportChartData } from "@/hooks/useDashboardCharts"
import { formatDecimalWeight } from "@/helpers/formats/numbers/formatNumbers"
import { Skeleton } from "@/components/ui/skeleton"
import { actualYearRange } from "@/helpers/dates"
import { DateRangePicker } from "@/components/ui/dateRangePicker"

const initialDateRange = {
    from: actualYearRange.from,
    to: actualYearRange.to,
}

export function TransportRadarChart() {
    const [range, setRange] = useState(initialDateRange)
    const { data = [], isLoading } = useTransportChartData(range)

    const chartConfig = {
        netWeight: {
            label: "Kg transportados",
            color: "var(--chart-1)",
        },
    }

    return (
        <Card className="w-full max-w-full overflow-hidden">
            <CardHeader className="items-center p-3 md:p-6">
                <div className="flex items-center gap-2 justify-between w-full">
                    <div className="flex flex-col items-start gap-2">
                        <CardTitle className="text-base md:text-lg">Empresas de transporte</CardTitle>
                        <CardDescription className="text-sm">Cantidades transportadas por transportistas</CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex flex-col items-center gap-4 px-3 md:px-6">
                <div className="w-full">
                    <DateRangePicker dateRange={range} onChange={setRange} />
                </div>

                {isLoading ? (
                    <Skeleton className="mx-auto h-[250px] w-full max-w-[300px] rounded-xl" />
                ) : data.length > 0 ? (
                    <ChartContainer
                        config={chartConfig}
                        className="mx-auto  w-full max-w-[300px] aspect-square"
                        style={{
                            '--color-netWeight': 'var(--chart-1)',
                        }}
                    >

                        <RadarChart data={data}>
                            <ChartTooltip
                                cursor={false}
                                content={
                                    <ChartTooltipContent
                                        formatter={(value, name, { payload }) => {
                                            const color = payload?.fill ?? "var(--chart-1)"
                                            return (
                                                <div className="w-full flex justify-between items-center gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className="h-2.5 w-2.5 rounded-sm"
                                                            style={{ backgroundColor: color }}
                                                        />
                                                        <span className="text-muted-foreground">Cantidad Transportada</span>
                                                    </div>

                                                    <span className="font-semibold">

                                                        {formatDecimalWeight(value)}

                                                    </span>
                                                </div>
                                            )
                                        }}
                                    />
                                }
                            />
                            <PolarGrid />
                            <PolarAngleAxis
                                dataKey="name"
                                tickFormatter={(name) =>
                                    name
                                        .split(/\s+/)         // separa por espacios
                                        .map((word) => word[0]) // toma solo la primera letra de cada palabra
                                        .join("")              // une las letras
                                }
                            />
                            <Radar
                                dataKey="netWeight"
                                fill="var(--color-netWeight)"
                                fillOpacity={0.6}
                                dot={{ r: 4, fillOpacity: 1 }}
                            />
                        </RadarChart>

                    </ChartContainer>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 min-h-[250px] w-full">
                        <div className="relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-xl opacity-70" />
                            <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-background border shadow-xs">
                                <Truck className="h-6 w-6 text-primary" strokeWidth={1.5} />
                            </div>
                        </div>
                        <h2 className="mt-4 text-lg font-medium tracking-tight">No hay datos de transporte</h2>
                        <p className="mt-2 text-center text-muted-foreground max-w-[280px] text-xs whitespace-normal">
                            No se encontraron datos de transporte para el rango de fechas seleccionado. Ajusta las fechas para ver los datos.
                        </p>
                    </div>
                )}
            </CardContent>


            {/*  <CardFooter className="flex-col gap-2 text-sm">
                <div className="flex items-center gap-2 leading-none font-medium">
                    Ranking de uso de transportistas <TrendingUp className="h-4 w-4" />
                </div>
                <div className="text-muted-foreground flex items-center gap-2 leading-none">
                    Periodo: {from} – {to}
                </div>
            </CardFooter> */}
        </Card>
    )
}
