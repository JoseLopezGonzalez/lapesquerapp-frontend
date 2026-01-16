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
import { TrendingUp, Truck } from "lucide-react"
import { getTransportChartData } from "@/services/orderService"
import { formatDecimalWeight } from "@/helpers/formats/numbers/formatNumbers"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"

const today = new Date()
const firstDayOfCurrentYear = new Date(today.getFullYear(), 0, 1)

export function TransportRadarChart() {
    const { data: session, status } = useSession()
    const [from, setFrom] = useState(firstDayOfCurrentYear.toLocaleDateString('sv-SE'))
    const [to, setTo] = useState(today.toLocaleDateString('sv-SE'))
    const [data, setData] = useState([])
    const [isLoading, setIsLoading] = useState(false)

    // console.log(data)

    const accessToken = session?.user?.accessToken


    useEffect(() => {
        if (status !== "authenticated") return
        if (!from || !to) return

        setIsLoading(true)

        getTransportChartData({
            token: accessToken,
            from,
            to,
        })
            .then(setData)
            .catch((err) => console.error("Error al obtener datos de transporte:", err))
            .finally(() => setIsLoading(false))
    }, [status, from, to, accessToken])

    const chartConfig = {
        netWeight: {
            label: "Kg transportados",
            color: "var(--chart-1)",
        },
    }

    return (
        <Card className="w-full max-w-full overflow-hidden">
            <CardHeader className="items-center">
                <div className="flex items-center gap-2 justify-between w-full">
                    <div className="flex flex-col items-startgap-2">
                        <CardTitle>Empresas de transporte</CardTitle>
                        <CardDescription>Cantidades transportadas por transportistas</CardDescription>
                    </div>
                </div>

            </CardHeader>

            <CardContent className="flex flex-col items-center gap-4">
                <div className="flex sm:flex-row flex-col items-center gap-2 w-full justify-center">
                    <Input
                        type="date"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                        className=" text-sm w-fit"
                    />
                    <Input
                        type="date"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        className=" text-sm w-fit"
                    />
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
