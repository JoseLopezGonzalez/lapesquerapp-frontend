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
import { Input } from "@/components/ui/input"
import { formatDecimalWeight } from "@/helpers/formats/numbers/formatNumbers"
import { SearchX } from "lucide-react"

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

    const accessToken = session?.user?.accessToken

    useEffect(() => {
        if (status !== "authenticated") return
        if (!dateFrom || !dateTo) return

        setIsLoading(true)

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
    }, [status, dateFrom, dateTo, accessToken])

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
            <CardHeader className="items-start space-y-4">
                <div className="flex justify-between flex-col sm:flex-row w-full gap-4">
                    <div>
                        <CardTitle className="text-base">Ranking ventas</CardTitle>
                        <CardDescription>
                            Fechas seleccionadas
                        </CardDescription>
                    </div>
                    {/* <div className="hidden 3xl:flex gap-2">
                        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                    </div> */}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full justify-center items-center">
                    <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-fit" />
                    <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-fit" />
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
