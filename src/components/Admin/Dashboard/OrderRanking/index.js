'use client'

import { use, useEffect, useState } from "react"
import { SearchX } from "lucide-react"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"

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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    formatDecimalCurrency,
    formatDecimalWeight,
} from "@/helpers/formats/numbers/formatNumbers"
import { getSpeciesOptions } from "@/services/speciesService"
import { useSession } from "next-auth/react"
import { getOrderRanking } from "@/services/orderService"
import Loader from "@/components/Utilities/Loader"

const today = new Date()
const firstDayOfCurrentYear = new Date(today.getFullYear(), 0, 1)

export function OrderRankingChart() {
    const [groupBy, setGroupBy] = useState("client")
    const [valueType, setValueType] = useState("totalAmount")
    const [speciesId, setSpeciesId] = useState("all")
    const [speciesOptions, setSpeciesOptions] = useState([])
    const [dateFrom, setDateFrom] = useState(firstDayOfCurrentYear.toLocaleDateString('sv-SE'))
    const [dateTo, setDateTo] = useState(today.toLocaleDateString('sv-SE'))
    const [isLoading, setIsLoading] = useState(true)
    const [chartData, setChartData] = useState([])
    const { data: session, status } = useSession();

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
    }[valueType];

    useEffect(() => {
        if (status !== "authenticated") return;

        if (!dateFrom || !dateTo || !speciesId || !groupBy || !valueType) return

        setIsLoading(true);

        const token = session.user.accessToken;
        const params = {
            groupBy,
            valueType,
            dateFrom,
            dateTo,
            speciesId,
        };

        getOrderRanking(params, token)
            .then((data) => {
                const formattedData = data.slice(0, 5)
                setChartData(formattedData)
            })
            .catch((err) => {
                console.error("Error:", err);
                setChartData([]);
            })
            .finally(() => setIsLoading(false));
    }, [groupBy, valueType, dateFrom, dateTo, speciesId, status]);

    useEffect(() => {
        if (status !== "authenticated") {
            return
        }



        const token = session.user.accessToken;
        getSpeciesOptions(token).then((speciesOptions) => {
            setSpeciesOptions(speciesOptions)
        }).catch((error) => {
            console.error("Error fetching species options:", error)
            setSpeciesOptions([])
        })
    }, [status])

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

                    <div className=" items-center gap-4 hidden 3xl:flex">
                        <Tabs value={groupBy} onValueChange={setGroupBy}>
                            <TabsList>
                                <TabsTrigger value="client">Clientes</TabsTrigger>
                                <TabsTrigger value="country">Países</TabsTrigger>
                                <TabsTrigger value="product">Productos</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </div>
                <div className=" items-center gap-4 flex 3xl:hidden">
                    <Tabs value={groupBy} onValueChange={setGroupBy}>
                        <TabsList>
                            <TabsTrigger value="client">Clientes</TabsTrigger>
                            <TabsTrigger value="country">Países</TabsTrigger>
                            <TabsTrigger value="product">Productos</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 3xl:grid-cols-3">
                    {/* <Label className="text-sm">Desde</Label> */}
                    <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                    {/* <Label className="text-sm">Hasta</Label> */}
                    <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                    {/* <Label className="text-sm">Especie</Label> */}
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
                {isLoading ? (
                    <div className="flex items-center justify-center h-48">
                        <Loader />
                    </div>
                ) : chartData.length > 0 ? (
                    <ChartContainer config={chartConfig}>
                        <BarChart
                            data={chartData}
                            layout="vertical"
                            barCategoryGap={12}
                            margin={{ right: 60, top: 8, bottom: 8 }}
                        >
                            <CartesianGrid horizontal={false} />
                            <YAxis
                                dataKey="name"
                                type="category"
                                axisLine={false}
                                tickLine={false}
                                hide
                            />
                            <XAxis type="number" hide />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                            <Bar
                                dataKey="value"
                                fill={chartConfig.value.color}
                                radius={4}
                                barSize={28}
                            >
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
                ) : (
                    <div className="flex flex-col items-center justify-center h-60">
                        <div className="flex flex-col items-center justify-center w-full h-full">
                            <div className="relative">
                                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-xl opacity-70" />
                                <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-background border shadow-xs">
                                    <SearchX className="h-6 w-6 text-primary" strokeWidth={1.5} />
                                </div>
                            </div>

                            <h2 className="mt-3 text-lg font-medium tracking-tight">
                                No hay datos
                            </h2>

                            <p className="mt-3 mb-2 text-center text-muted-foreground max-w-[300px] text-xs  whitespace-normal">
                                Ajusta el rango de fechas, selecciona una especie o cambia el tipo de agrupación para ver los datos.
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>

            <CardFooter className="flex items-center justify-between gap-2 text-sm">
                <div className="text-muted-foreground hidden 3xl:flex items-center gap-1">
                    *
                    Mostrando {valueType === "totalAmount" ? "importe" : "cantidad"} agrupado por{" "}
                    {groupBy === "client"
                        ? "cliente"
                        : groupBy === "country"
                            ? "país"
                            : "producto"}
                </div>
                <div>
                    <Select value={valueType} onValueChange={setValueType}>
                        <SelectTrigger className="w-[160px] h-8 text-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="totalAmount">Importe - €</SelectItem>
                            <SelectItem value="totalQuantity">Cantidad - kg</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardFooter>
        </Card>
    )
}
