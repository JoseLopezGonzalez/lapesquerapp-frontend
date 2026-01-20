"use client"

import { useEffect, useState, useMemo } from "react"
import { useSession } from "next-auth/react"
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from "@/components/ui/card"
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
import { getProductCategoryOptions } from "@/services/productCategoryService"
import { getProductFamilyOptions } from "@/services/productFamilyService"
import { formatDecimalCurrency, formatDecimalWeight } from "@/helpers/formats/numbers/formatNumbers"
import { SearchX, Loader2 } from "lucide-react"
import { actualYearRange } from "@/helpers/dates"
import { DateRangePicker } from "@/components/ui/dateRangePicker"

const initialDateRange = {
    from: actualYearRange.from,
    to: actualYearRange.to,
}

export function SalesChart() {
    const { data: session, status } = useSession()

    const [speciesId, setSpeciesId] = useState("all")
    const [speciesOptions, setSpeciesOptions] = useState([])
    const [speciesLoading, setSpeciesLoading] = useState(true)
    const [categoryId, setCategoryId] = useState("all")
    const [categoryOptions, setCategoryOptions] = useState([])
    const [categoryLoading, setCategoryLoading] = useState(true)
    const [familyId, setFamilyId] = useState("all")
    const [familyOptions, setFamilyOptions] = useState([])
    const [familyLoading, setFamilyLoading] = useState(true)
    const [unit, setUnit] = useState("quantity")
    const [groupBy, setGroupBy] = useState("month") // NEW
    const [range, setRange] = useState(initialDateRange)
    const [chartData, setChartData] = useState([])
    const [isLoading, setIsLoading] = useState(false)

    const accessToken = session?.user?.accessToken

    // Calcular el total de kilogramos desde los datos del backend
    const totalKg = useMemo(() => {
        if (unit !== "quantity" || !chartData || chartData.length === 0) return 0
        return chartData.reduce((sum, item) => sum + (item.value || 0), 0)
    }, [chartData, unit])

    // Calcular el total de importe desde los datos del backend
    const totalAmount = useMemo(() => {
        if (unit !== "amount" || !chartData || chartData.length === 0) return 0
        return chartData.reduce((sum, item) => sum + (item.value || 0), 0)
    }, [chartData, unit])

    useEffect(() => {
        if (status !== "authenticated") return

        setSpeciesLoading(true)
        setCategoryLoading(true)
        setFamilyLoading(true)

        Promise.all([
            getSpeciesOptions(accessToken)
                .then(setSpeciesOptions)
                .catch((err) => console.error("Error al cargar especies:", err))
                .finally(() => setSpeciesLoading(false)),
            getProductCategoryOptions(accessToken)
                .then(setCategoryOptions)
                .catch((err) => console.error("Error al cargar categorías:", err))
                .finally(() => setCategoryLoading(false)),
            getProductFamilyOptions(accessToken)
                .then(setFamilyOptions)
                .catch((err) => console.error("Error al cargar familias:", err))
                .finally(() => setFamilyLoading(false))
        ])
    }, [status, accessToken])

    useEffect(() => {
        if (status !== "authenticated") return
        if (!range.from || !range.to) return

        setIsLoading(true)

        getSalesChartData({
            token: session.user.accessToken,
            speciesId,
            categoryId,
            familyId,
            from: range.from.toLocaleDateString("sv-SE"),
            to: range.to.toLocaleDateString("sv-SE"),
            unit,
            groupBy, // NEW
        })
            .then(setChartData)
            .catch((err) => console.error("Error al obtener ventas:", err))
            .finally(() => setIsLoading(false))
    }, [speciesId, categoryId, familyId, range, unit, status, groupBy]) // NEW

    return (
        <Card className="w-full max-w-full overflow-hidden min-w-0 box-border">
            <CardHeader className="w-full min-w-0 max-w-full p-3 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:justify-between w-full min-w-0">
                    <div className="grid flex-1 gap-1 min-w-0">
                        <CardTitle className="text-base md:text-lg">Ventas</CardTitle>
                        <CardDescription className="text-sm">
                            Comparativa de ventas en {unit === "quantity" ? "kilogramos" : "euros"}.
                        </CardDescription>
                    </div>
                    <Tabs onValueChange={setGroupBy} className="hidden 3xl:flex" value={groupBy}>
                        <TabsList>
                            <TabsTrigger value="day">Día</TabsTrigger>
                            <TabsTrigger value="week">Semana</TabsTrigger>
                            <TabsTrigger value="month">Mes</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
                <Tabs onValueChange={setGroupBy} className="3xl:hidden mt-3" value={groupBy}>
                    <TabsList className="w-auto">
                        <TabsTrigger value="day">Día</TabsTrigger>
                        <TabsTrigger value="week">Semana</TabsTrigger>
                        <TabsTrigger value="month">Mes</TabsTrigger>
                    </TabsList>
                </Tabs>


            </CardHeader>

            <CardContent className="px-3 md:px-6 w-full min-w-0 max-w-full overflow-x-hidden">



                <div className="flex flex-col md:grid md:grid-cols-2 gap-3 md:gap-2 mb-6 3xl:grid-cols-6 w-full box-border">
                    <div className="w-full min-w-0 box-border md:col-span-6 3xl:col-span-4">
                        <div className="w-full min-w-0 box-border">
                            <DateRangePicker dateRange={range} onChange={setRange} />
                        </div>
                    </div>
                <div className="w-full min-w-0 box-border md:col-span-6 3xl:col-span-2">
                    <Select value={speciesId} onValueChange={setSpeciesId} className="w-full box-border">
                        <SelectTrigger className="w-full min-w-0 box-border h-12 md:h-auto max-w-full" loading={speciesLoading}>
                            <SelectValue placeholder="Seleccionar especie" loading={speciesLoading} />
                        </SelectTrigger>
                        <SelectContent loading={speciesLoading}>
                            <SelectItem value="all">Todas las especies</SelectItem>
                            {speciesOptions.map((option) => (
                                <SelectItem key={option.id} value={option.id}>
                                    {option.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    </div>
                    <div className="w-full min-w-0 box-border md:col-span-3 3xl:col-span-3">
                    <Select value={categoryId} onValueChange={setCategoryId} className="w-full box-border">
                        <SelectTrigger className="w-full min-w-0 box-border h-12 md:h-auto max-w-full" loading={categoryLoading}>
                            <SelectValue placeholder="Seleccionar categoría" loading={categoryLoading} />
                        </SelectTrigger>
                        <SelectContent loading={categoryLoading}>
                            <SelectItem value="all">Todas las categorías</SelectItem>
                            {categoryOptions.map((option) => (
                                <SelectItem key={option.id} value={option.id}>
                                    {option.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    </div>
                    <div className="w-full min-w-0 box-border md:col-span-3 3xl:col-span-3">
                    <Select value={familyId} onValueChange={setFamilyId} className="w-full box-border">
                        <SelectTrigger className="w-full min-w-0 box-border h-12 md:h-auto max-w-full" loading={familyLoading}>
                            <SelectValue placeholder="Seleccionar familia" loading={familyLoading} />
                        </SelectTrigger>
                        <SelectContent loading={familyLoading}>
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

                <div className="h-[250px] w-full min-w-0 max-w-full overflow-hidden box-border">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center w-full h-full">
                            <Loader2 className="h-8 w-8 text-primary animate-spin" />
                            <p className="mt-4 text-sm text-muted-foreground">Cargando datos...</p>
                        </div>
                    ) : chartData.length > 0 ? (
                        <ChartContainer
                            config={{
                                value: {
                                    label: unit === "quantity" ? "Kg" : "€",
                                    color: "var(--chart-1)",
                                },
                            }}
                            className="h-full w-full min-w-0 max-w-full overflow-hidden !aspect-auto"
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
                        <div className="flex flex-col items-center justify-center w-full h-full">
                            <div className="flex flex-col items-center justify-center w-full h-full">
                                <div className="relative">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-xl opacity-70" />
                                    <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-background border shadow-xs">
                                        <SearchX className="h-6 w-6 text-primary" strokeWidth={1.5} />
                                    </div>
                                </div>
                                <h2 className="mt-3 text-lg font-medium tracking-tight">Sin datos</h2>
                                <p className="mt-3 mb-2 text-center text-muted-foreground max-w-[300px] text-xs whitespace-normal">
                                    Ajusta el rango de fechas, selecciona una especie, categoría o familia para ver los datos.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter className=" flex items-center justify-between flex-col xl-2xl:flex-row gap-2">
                <span className="text-sm text-muted-foreground flex">
                    {!isLoading && unit === "quantity" && chartData.length > 0
                        ? `Total: ${formatDecimalWeight(totalKg)}`
                        : !isLoading && unit === "amount" && chartData.length > 0
                        ? `Total: ${formatDecimalCurrency(totalAmount)}`
                        : !isLoading
                        ? "* Análisis de las ventas de productos."
                        : ""}
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
