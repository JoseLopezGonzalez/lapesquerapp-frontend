"use client"

import { useEffect, useState } from "react"
import { Pie, PieChart } from "recharts"
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
import { Input } from "@/components/ui/input"
import { formatDecimalWeight } from "@/helpers/formats/numbers/formatNumbers"

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

const today = new Date()
const firstDayOfCurrentYear = new Date(today.getFullYear(), 0, 1)


export function SalesBySalespersonPieChart() {
    const { data: session, status } = useSession()
    const [chartData, setChartData] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [dateFrom, setDateFrom] = useState(firstDayOfCurrentYear.toLocaleDateString('sv-SE'))
    const [dateTo, setDateTo] = useState(today.toLocaleDateString('sv-SE'))



    useEffect(() => {
        if (status !== "authenticated") return
        if (!dateFrom || !dateTo) return

        setIsLoading(true)
        const token = session.user.accessToken

        getSalesBySalesperson({ dateFrom, dateTo }, token)
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
    }, [status, dateFrom, dateTo])

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
        <Card className="flex flex-col w-full h-fit">
            <CardHeader className="items-start space-y-4">
                <div className="flex justify-between flex-col sm:flex-row w-full gap-4">
                    <div>
                        <CardTitle className="text-base">Ranking ventas</CardTitle>
                        <CardDescription>
                            Fechas seleccionadas
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1">
                {isLoading ? (
                    <div className="flex items-center justify-center h-48">
                        <Loader />
                    </div>
                ) : (
                    <ChartContainer
                        config={chartConfig}
                        className="mx-auto aspect-square max-h-[300px]"
                    >
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
                    </ChartContainer>
                )}
            </CardContent>
        </Card>
    )
}
