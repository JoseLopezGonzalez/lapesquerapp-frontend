"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select"
import {
    AreaChart,
    Area,
    CartesianGrid,
    XAxis,
} from "recharts"
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getSalesChartData } from "@/services/orderService"
import { getSpeciesOptions } from "@/services/speciesService"
import { formatDecimalCurrency, formatDecimalWeight } from "@/helpers/formats/numbers/formatNumbers"

const today = new Date()
const firstDayOfCurrentYear = new Date(today.getFullYear(), 0, 1)

export function SalesChart() {
    const { data: session, status } = useSession()

    const [speciesId, setSpeciesId] = useState("all")
    const [speciesOptions, setSpeciesOptions] = useState([])
    const [unit, setUnit] = useState("quantity")
    const [groupBy, setGroupBy] = useState("month") // NEW
    const [dateFrom, setDateFrom] = useState(firstDayOfCurrentYear.toLocaleDateString('sv-SE'))
    const [dateTo, setDateTo] = useState(today.toLocaleDateString('sv-SE'))
    const [chartData, setChartData] = useState([])
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (status !== "authenticated") return

        const token = session.user.accessToken
        getSpeciesOptions(token)
            .then(setSpeciesOptions)
            .catch((err) => console.error("Error al cargar especies:", err))
    }, [status])

    useEffect(() => {
        if (status !== "authenticated") return

        setIsLoading(true)

        getSalesChartData({
            token: session.user.accessToken,
            speciesId,
            from: dateFrom,
            to: dateTo,
            unit,
            groupBy, // NEW
        })
            .then(setChartData)
            .catch((err) => console.error("Error al obtener ventas:", err))
            .finally(() => setIsLoading(false))
    }, [speciesId, dateFrom, dateTo, unit, status, groupBy]) // NEW

    return (
        <Card className="w-full max-w-full overflow-hidden">
            <CardHeader className=" w-full ">
                <div className="flex items-center gap-2 justify-between w-full">
                    <div className="grid flex-1 gap-1">
                        <CardTitle>Ventas por especie</CardTitle>
                        <CardDescription>
                            Comparativa de ventas en {unit === "quantity" ? "kilogramos" : "euros"}.
                        </CardDescription>
                    </div>
                    <Tabs onValueChange={setGroupBy} className="" value={groupBy}>
                        <TabsList>
                            <TabsTrigger value="day">Día</TabsTrigger>
                            <TabsTrigger value="week">Semana</TabsTrigger>
                            <TabsTrigger value="month">Mes</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>



            </CardHeader>

            <CardContent className="px-6">



                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-6">


                    <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                    <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                    <Select value={speciesId} onValueChange={setSpeciesId}>
                        <SelectTrigger>
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

                <div className="h-[250px] w-full">
                    {isLoading ? (
                        <Skeleton className="h-full w-full" />
                    ) : chartData.length > 0 ? (
                        <ChartContainer
                            config={{
                                value: {
                                    label: unit === "quantity" ? "Kg" : "€",
                                    color: "var(--chart-1)",
                                },
                            }}
                            className="h-full w-full"
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
                                    minTickGap={32}
                                    tickFormatter={(value) => {
                                        // Formateo condicional según tipo
                                        if (groupBy === "month") return new Date(value + "-01").toLocaleDateString("es-ES", { month: "short", year: "2-digit" })
                                        if (groupBy === "week") return value.replace("W", "S")
                                        return new Date(value).toLocaleDateString("es-ES", {
                                            month: "short",
                                            day: "numeric",
                                        })
                                    }}
                                />
                                <ChartTooltip
                                    cursor={false}
                                    content={
                                        <ChartTooltipContent
                                            labelFormatter={(value) =>
                                                groupBy === "month"
                                                    ? new Date(value + "-01").toLocaleDateString("es-ES", { month: "long", year: "numeric" })
                                                    : groupBy === "week"
                                                        ? `Semana ${value.split("W")[1]}`
                                                        : new Date(value).toLocaleDateString("es-ES", {
                                                            weekday: "long",    // lunes, martes, etc.
                                                            day: "numeric",     // 2
                                                            month: "long",      // julio
                                                            year: "numeric",    // 2025
                                                        })
                                            }
                                            formatter={(value, name, { payload }) => {
                                                const color = payload?.fill ?? "var(--chart-1)"
                                                return (
                                                    <div className="w-full flex justify-between items-center gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className="h-2.5 w-2.5 rounded-sm"
                                                                style={{ backgroundColor: color }}
                                                            />
                                                            <span className="text-muted-foreground">Ventas</span>
                                                        </div>

                                                        <span className="font-semibold">
                                                            {unit === "quantity"
                                                                ? formatDecimalWeight(value)
                                                                : formatDecimalCurrency(value)}
                                                        </span>
                                                    </div>
                                                )
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
                        <div className="text-sm text-muted-foreground text-center mt-10">
                            Sin datos en este periodo
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter className=" flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                    * Análisis de las ventas de productos.
                </span>
                <Select value={unit} onValueChange={setUnit}>
                    <SelectTrigger className="w-[160px] h-8 text-sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="quantity">Cantidad - Kg</SelectItem>
                        <SelectItem value="amount">Importe - €</SelectItem>
                    </SelectContent>
                </Select>
            </CardFooter>
        </Card>
    )
}
