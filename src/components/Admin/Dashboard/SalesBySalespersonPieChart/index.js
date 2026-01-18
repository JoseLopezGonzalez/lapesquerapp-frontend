"use client"

import { useEffect, useState } from "react"
import { Pie, PieChart, ResponsiveContainer } from "recharts"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { useSession } from "next-auth/react"
import { getSalesBySalesperson } from "@/services/orderService"
import Loader from "@/components/Utilities/Loader"
import { formatDecimalWeight } from "@/helpers/formats/numbers/formatNumbers"
import { SearchX } from "lucide-react"
import { actualYearRange } from "@/helpers/dates"
import { DateRangePicker } from "@/components/ui/dateRangePicker"

const pieColors = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
    "var(--chart-6)",
    "var(--chart-7)",
    "var(--chart-8)",
]

const initialDateRange = {
    from: actualYearRange.from,
    to: actualYearRange.to,
}

export function SalesBySalespersonPieChart() {
    const { data: session, status } = useSession()
    const [chartData, setChartData] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [range, setRange] = useState(initialDateRange)

    const accessToken = session?.user?.accessToken

    useEffect(() => {
        if (status !== "authenticated") return
        if (!range.from || !range.to) return

        setIsLoading(true)

        const dateFrom = range.from.toLocaleDateString('sv-SE')
        const dateTo = range.to.toLocaleDateString('sv-SE')

        getSalesBySalesperson({ dateFrom, dateTo }, accessToken)
            .then((data) => {
                const colored = data.map((item, index) => ({
                    ...item,
                    fill: pieColors[index % pieColors.length],
                }))
                setChartData(colored)
            })
            .catch((error) => {
                console.error("Error al obtener datos:", error)
                setChartData([])
            })
            .finally(() => setIsLoading(false))
    }, [status, range, accessToken])

    const chartConfig = {
        quantity: {
            label: "Cantidad",
        },
        ...chartData.reduce((acc, item) => {
            acc[item.name] = {
                label: item.name,
                color: item.fill,
            }
            return acc
        }, {}),
    }

    return (
        <Card className="w-full max-w-full overflow-hidden">
            <CardHeader className="items-start space-y-4 p-3 md:p-6">
                <div className="flex justify-between flex-col sm:flex-row w-full gap-4">
                    <div>
                        <CardTitle className="text-base md:text-lg">Ranking ventas</CardTitle>
                        <CardDescription className="text-sm">
                            Ranking de ventas por comercial
                        </CardDescription>
                    </div>
                </div>
                <div className="w-full">
                    <DateRangePicker dateRange={range} onChange={setRange} />
                </div>
            </CardHeader>

            <CardContent className="flex-1 ">
                {isLoading ? (
                    <div className="flex items-center justify-center h-48">
                        <Loader />
                    </div>
                ) : !chartData || !Array.isArray(chartData) || chartData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center w-full h-full min-h-[300px]">
                        <div className="flex flex-col items-center justify-center w-full h-full">
                            <div className="relative">
                                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-xl opacity-70" />
                                <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-background border shadow-xs">
                                    <SearchX className="h-6 w-6 text-primary" strokeWidth={1.5} />
                                </div>
                            </div>
                            <h2 className="mt-3 text-lg font-medium tracking-tight">No hay datos</h2>
                            <p className="mt-3 mb-2 text-center text-muted-foreground max-w-[300px] text-xs whitespace-normal">
                                Ajusta el rango de fechas para ver el ranking de ventas por comercial.
                            </p>
                        </div>
                    </div>
                ) : (
                    <ChartContainer
                        config={chartConfig}
                        className="mx-auto aspect-square max-h-[300px] "
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <ChartTooltip
                                    content={
                                        <ChartTooltipContent
                                            formatter={(value, name, { payload }) => {
                                                const color = payload?.fill ?? "#000"
                                                return (
                                                    <div className="w-full flex justify-between items-center gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className="h-2.5 w-2.5 rounded-sm"
                                                                style={{ backgroundColor: color }}
                                                            />
                                                            <span className="text-muted-foreground">{name}</span>
                                                        </div>
                                                        <span className="text-xs text-muted-foreground font-medium">
                                                            {(
                                                                (value / chartData.reduce((acc, item) => acc + item.quantity, 0)) *
                                                                100
                                                            ).toFixed(2)}
                                                            %
                                                        </span>
                                                        <span className="font-semibold">
                                                            {formatDecimalWeight(value)}
                                                        </span>
                                                    </div>
                                                )
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
                                    content={
                                        <ChartLegendContent nameKey="name"

                                        />
                                    }
                                    className="flex flex-wrap gap-2 justify-center"
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                )}
            </CardContent>
        </Card>
    )
}
