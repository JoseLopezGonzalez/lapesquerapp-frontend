"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
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
import { TrendingUp } from "lucide-react"
import { getTransportChartData } from "@/services/orderService"
import { formatDecimalWeight } from "@/helpers/formats/numbers/formatNumbers"
import { Skeleton } from "@/components/ui/skeleton"

const today = new Date()
const firstDayOfCurrentYear = new Date(today.getFullYear(), 0, 1)

export function TransportRadarChart() {
    const { data: session, status } = useSession()
    const [from, setFrom] = useState(firstDayOfCurrentYear.toLocaleDateString('sv-SE'))
    const [to, setTo] = useState(today.toLocaleDateString('sv-SE'))
    const [data, setData] = useState([])
    const [isLoading, setIsLoading] = useState(false)

    console.log(data)

    useEffect(() => {
        if (status !== "authenticated") return
        if (!from || !to) return

        setIsLoading(true)

        getTransportChartData({
            token: session.user.accessToken,
            from,
            to,
        })
            .then(setData)
            .catch((err) => console.error("Error al obtener datos de transporte:", err))
            .finally(() => setIsLoading(false))
    }, [status, from, to])

    const chartConfig = {
        netWeight: {
            label: "Kg transportados",
            color: "var(--chart-1)",
        },
    }

    return (
        <Card>
            <CardHeader className="items-center">
                <div className="flex items-center gap-2 justify-between w-full">
                    <div className="flex flex-col items-startgap-2">
                        <CardTitle>Empresas de transporte</CardTitle>
                        <CardDescription>Cantidades transportadas por transportistas</CardDescription>
                    </div>
                </div>

            </CardHeader>

            <CardContent className="flex flex-col items-center gap-4">
                <div className="flex gap-2 w-full justify-center">
                    <input
                        type="date"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                        className="rounded-md border px-2 py-1 text-sm"
                    />
                    <input
                        type="date"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        className="rounded-md border px-2 py-1 text-sm"
                    />
                </div>

                {isLoading ? (
                    <Skeleton className="mx-auto h-[250px] w-full max-w-[300px] rounded-xl" />
                ) : (
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
                            {/* <PolarRadiusAxis /> */}
                            <Radar
                                dataKey="netWeight"
                                fill="var(--color-netWeight)"
                                fillOpacity={0.6}
                                dot={{ r: 4, fillOpacity: 1 }}
                            />
                        </RadarChart>

                    </ChartContainer>
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
