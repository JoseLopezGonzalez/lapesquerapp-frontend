'use client'

import { useEffect, useState } from "react"
import { ChevronDownIcon, SearchX, FileSpreadsheet } from "lucide-react"
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatDecimalCurrency, formatDecimalWeight } from "@/helpers/formats/numbers/formatNumbers"
import { getSpeciesOptions } from "@/services/speciesService"
import { useSession } from "next-auth/react"
import { getOrderRankingStats } from "@/services/orderService"
import { Skeleton } from "@/components/ui/skeleton"
import { actualYearRange } from "@/helpers/dates"
import { Button } from "@/components/ui/button"
import { DateRangePicker } from "@/components/ui/dateRangePicker"
import Loader from "@/components/Utilities/Loader"
import * as XLSX from "xlsx"
import { saveAs } from "file-saver"
import toast from "react-hot-toast"
import { getToastTheme } from "@/customs/reactHotToast"
import { PiMicrosoftExcelLogoFill } from "react-icons/pi"

const initialDateRange = {
    from: actualYearRange.from,
    to: actualYearRange.to,
}

export function OrderRankingChart() {
    const [groupBy, setGroupBy] = useState("client")
    const [valueType, setValueType] = useState("totalAmount")
    const [speciesId, setSpeciesId] = useState("all")
    const [speciesOptions, setSpeciesOptions] = useState([])
    const [isLoadingFirst, setIsLoadingFirst] = useState(true)
    const [isLoading, setIsLoading] = useState(true)
    const [chartData, setChartData] = useState([])
    const [fullData, setFullData] = useState([])
    const [range, setRange] = useState(initialDateRange)
    const { data: session, status } = useSession()

    const accessToken = session?.user?.accessToken

    const chartConfig = {
        totalAmount: {
            value: {
                label: "Importe",
                color: "var(--chart-1)",
            },
            formatter: formatDecimalCurrency,
        },
        totalQuantity: {
            value: {
                label: "Cantidad",
                color: "var(--chart-1)",
            },
            formatter: formatDecimalWeight,
        },
    }[valueType]

    useEffect(() => {
        if (status !== "authenticated") return
        if (!range.from || !range.to || !groupBy || !valueType) return

        setIsLoading(true)

        const params = {
            groupBy,
            valueType,
            dateFrom: range.from.toLocaleDateString("sv-SE"),
            dateTo: range.to.toLocaleDateString("sv-SE"),
            speciesId,
        }

        getOrderRankingStats(params, accessToken)
            .then((data) => {
                // Manejar diferentes formatos de respuesta
                let safeData = []
                if (Array.isArray(data)) {
                    safeData = data
                } else if (data && typeof data === 'object') {
                    // Si es un objeto, intentar extraer un array
                    if (Array.isArray(data.data)) {
                        safeData = data.data
                    } else if (Array.isArray(data.results)) {
                        safeData = data.results
                    } else {
                        safeData = []
                    }
                } else {
                    safeData = []
                }
                
                setFullData(safeData) // guardamos todos
                const formattedData = safeData.slice(0, 5)
                console.log("📊 Setting chartData:", formattedData, "Length:", formattedData.length)
                setChartData(formattedData)
            })
            .catch((err) => {
                console.error("Error al obtener ranking de pedidos:", err)
                setChartData([])
                setFullData([])
            })
            .finally(() => {
                setIsLoading(false)
                setIsLoadingFirst(false)
            })
    }, [groupBy, valueType, speciesId, status,  range, accessToken])

    useEffect(() => {
        if (status !== "authenticated") return

        const token = session.user.accessToken
        getSpeciesOptions(token)
            .then(setSpeciesOptions)
            .catch((error) => {
                console.error("Error fetchWithTenanting species options:", error)
                setSpeciesOptions([])
            })
    }, [status, session])

    const handleExportToExcel = () => {
        if (fullData.length === 0) {
            toast.error("No hay datos para exportar", getToastTheme())
            return
        }

        const rows = fullData.map((item) => ({
            Agrupación: item.name,
            [valueType === "totalAmount" ? "Importe (€)" : "Cantidad (kg)"]: item.value,
        }))

        const worksheet = XLSX.utils.json_to_sheet(rows)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "RankingPedidos")

        const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
        const blob = new Blob([buffer], { type: "application/octet-stream" })

        const fileName = `ranking_pedidos_${groupBy}_${valueType}.xlsx`
        saveAs(blob, fileName)
    }

    if (isLoadingFirst) return (
        <Card className="w-full max-w-full overflow-hidden">
            <CardHeader className="pb-2 space-y-4">
                <div className="flex flex-row items-center justify-between gap-4">
                    <div>
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-4 w-64 mt-1" />
                    </div>
                    <Skeleton className="h-8 w-40 hidden 3xl:block" />
                </div>
                <Skeleton className="h-8 w-full max-w-md" />
                <div className="grid grid-cols-1 sm:grid-cols-2 3xl:grid-cols-3 gap-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </div>
            </CardHeader>
            <CardContent className="space-y-4 mt-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between gap-4">
                        <Skeleton className="h-5 w-1/3" />
                        <Skeleton className="h-3 w-2/3" />
                    </div>
                ))}
            </CardContent>
            <CardFooter className="flex items-center justify-between gap-2 text-sm">
                <Skeleton className="h-4 w-64 hidden 3xl:block" />
                <Skeleton className="h-8 w-40" />
            </CardFooter>
        </Card>
    )

    return (
        <Card className="w-full max-w-full overflow-hidden">
            <CardHeader className="pb-2 space-y-4">
                <div className="flex flex-row items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-base">Ranking Pedidos</CardTitle>
                        <CardDescription>
                            Agrupado por {valueType === "totalAmount" ? "importe total" : "cantidad total"}
                        </CardDescription>
                    </div>
                    <div className="items-center gap-4 hidden 3xl:flex">
                        <Tabs value={groupBy} onValueChange={setGroupBy}>
                            <TabsList>
                                <TabsTrigger value="client">Clientes</TabsTrigger>
                                <TabsTrigger value="country">Países</TabsTrigger>
                                <TabsTrigger value="product">Productos</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </div>

                <div className="items-center gap-4 flex 3xl:hidden">
                    <Tabs value={groupBy} onValueChange={setGroupBy}>
                        <TabsList>
                            <TabsTrigger value="client">Clientes</TabsTrigger>
                            <TabsTrigger value="country">Países</TabsTrigger>
                            <TabsTrigger value="product">Productos</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 3xl:grid-cols-3">
                    <div className="w-full col-span-1 sm:col-span-2">
                        <DateRangePicker dateRange={range} onChange={setRange} />
                    </div>
                    <Select value={speciesId} onValueChange={setSpeciesId}>
                        <SelectTrigger className="sm:col-span-2 3xl:col-span-1">
                            <SelectValue placeholder="Todas las especies" />
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
            </CardHeader>

            <CardContent>
                <div className="h-[250px] w-full">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full w-full">
                            <Loader />
                        </div>
                    ) : !chartData || !Array.isArray(chartData) || chartData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center w-full h-full">
                            <div className="flex flex-col items-center justify-center w-full h-full">
                                <div className="relative">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-xl opacity-70" />
                                    <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-background border shadow-xs">
                                        <SearchX className="h-6 w-6 text-primary" strokeWidth={1.5} />
                                    </div>
                                </div>
                                <h2 className="mt-3 text-lg font-medium tracking-tight">No hay datos</h2>
                                <p className="mt-3 mb-2 text-center text-muted-foreground max-w-[300px] text-xs whitespace-normal">
                                    Ajusta el rango de fechas, selecciona una especie o cambia el tipo de agrupación para ver los datos.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={Math.max(chartData.length * 45, 200)}>
                            <ChartContainer config={chartConfig}>
                                <BarChart
                                    data={chartData}
                                    layout="vertical"
                                    barCategoryGap={12}
                                    margin={{ right: 90, top: 8, bottom: 8 }}
                                >
                                    <CartesianGrid horizontal={false} />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} hide />
                                    <XAxis type="number" hide />
                                    <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                                    <Bar dataKey="value" fill={chartConfig.value.color} radius={4} barSize={28}>
                                        <LabelList
                                            dataKey="value"
                                            position="right"
                                            offset={8}
                                            className="fill-foreground text-nowrap"
                                            fontSize={12}
                                            formatter={chartConfig.formatter}
                                        />
                                        <LabelList
                                            dataKey="name"
                                            position="insideLeft"
                                            offset={8}
                                            className="fill-background text-nowrap"
                                            fontSize={12}
                                            formatter={(name) => name}
                                        />
                                    </Bar>
                                </BarChart>
                            </ChartContainer>
                        </ResponsiveContainer>
                    )}
                </div>
            </CardContent>

            <CardFooter className="flex items-center justify-between gap-2 text-sm">
                <div className="text-muted-foreground hidden 3xl:flex items-center gap-1">
                    * Mostrando {valueType === "totalAmount" ? "importe" : "cantidad"} agrupado por{" "}
                    {groupBy === "client" ? "cliente" : groupBy === "country" ? "país" : "producto"}
                </div>
                <div className="flex items-center gap-2">
                    <Select value={valueType} onValueChange={setValueType}>
                        <SelectTrigger className="w-[160px] h-8 text-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="totalAmount">Importe - €</SelectItem>
                            <SelectItem value="totalQuantity">Cantidad - kg</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleExportToExcel}
                    >
                        <PiMicrosoftExcelLogoFill className="w-4 h-4 text-green-700" />
                        {/* Exportar Excel */}
                    </Button>
                </div>
            </CardFooter>
        </Card>
    )
}
