// Adaptación completa del componente a SHADCN y modo light/dark

"use client"

import { useState } from "react"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Calendar } from "lucide-react"
import { useOrderContext } from "@/context/OrderContext"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    formatDecimalCurrency,
    formatDecimalWeight,
    formatInteger,
} from "@/helpers/formats/numbers/formatNumbers"
import { formatDateShort } from "@/helpers/formats/dates/formatDates"
import {
    ResponsiveContainer,
    CartesianGrid,
    YAxis,
    Tooltip,
    AreaChart,
    Area,
    Line,
} from "recharts"

export default function OrderCustomerHistory() {
    const { order } = useOrderContext()
    const customerHistory = order.customerHistory
    const [expandedItems, setExpandedItems] = useState([])

    const getChartDataByProduct = (product) => {
        return product.lines
            .map((line) => ({
                load_date: line.load_date,
                unit_price: Number(line.unit_price) || 0,
                net_weight: Number(line.net_weight) || 0,
                boxes: Number(line.boxes) || 0,
            }))
            .sort((a, b) => new Date(a.load_date) - new Date(b.load_date))
    }

    const CustomTooltip = ({ active, payload, isCurrency }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-popover border p-3 rounded-lg shadow">
                    {payload.map((data, index) => (
                        <div key={index}>
                            <p className="text-sm text-foreground">{formatDateShort(data.payload.load_date)}</p>
                            <p className="text-sm font-semibold" style={{ color: data.color }}>
                                {isCurrency ? `${formatDecimalCurrency(data.value)}/kg` : formatDecimalWeight(data.value)}
                            </p>
                        </div>
                    ))}
                </div>
            )
        }
        return null
    }

    return (
        <div className="h-full pb-2">
            <Card className="h-full flex flex-col bg-transparent">
                <CardHeader>
                    <CardTitle className="text-lg font-medium">Históricos de productos</CardTitle>
                    <CardDescription>Histórico de productos del cliente</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto py-2">
                    <Accordion type="multiple" value={expandedItems} onValueChange={setExpandedItems} className="space-y-4">
                        {customerHistory.map((product) => {
                            const chartData = getChartDataByProduct(product)

                            return (
                                <AccordionItem key={product.product.id} value={product.product.id.toString()} className="border rounded-lg overflow-hidden shadow-sm">
                                    <AccordionTrigger className="px-6 py-4 hover:bg-muted/50 transition-colors [&>svg]:transition-transform no-underline hover:no-underline">
                                        <div className="flex flex-col md:flex-row w-full items-start md:items-center justify-between gap-4 text-left">
                                            <div className="flex-1">
                                                <h3 className="font-medium text-lg">{product.product.name}</h3>
                                                <div className="flex items-center mt-1">
                                                    <Badge variant="outline" className="flex items-center gap-1 mr-2">
                                                        <Calendar className="h-3 w-3" />
                                                        <span>Último pedido: {formatDateShort(product.last_order_date)}</span>
                                                    </Badge>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-sm pr-5">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-muted-foreground">Cajas Totales</span>
                                                    <span className="font-medium">{formatInteger(product.total_boxes)}</span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-muted-foreground">Peso Neto</span>
                                                    <span className="font-medium">{formatDecimalWeight(product.total_net_weight)}</span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-muted-foreground">Precio Medio</span>
                                                    <span className="font-medium">{formatDecimalCurrency(product.average_unit_price)}</span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-muted-foreground">Importe Total</span>
                                                    <span className="font-medium">{formatDecimalCurrency(product.total_amount)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="p-4 space-y-4 w-full">
                                        <div className="grid grid-cols-2 gap-5 w-full p-6 pt-3">
                                            <Card className="w-full h-48 shadow-sm">
                                                <CardHeader className="pb-1 px-4 pt-2">
                                                    <CardTitle className="text-sm font-medium">Evolución de precio</CardTitle>
                                                </CardHeader>
                                                <CardContent className="h-full pt-0 px-2 w-full text-primary/50">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <AreaChart data={chartData}>
                                                            <defs>
                                                                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="5%" stopColor="currentColor" stopOpacity={0.8} />
                                                                    <stop offset="95%" stopColor="currentColor" stopOpacity={0} />
                                                                </linearGradient>
                                                            </defs>
                                                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                                                            <YAxis />
                                                            <Tooltip content={<CustomTooltip isCurrency />} />
                                                            <Area type="monotone" dataKey="unit_price" stroke="currentColor" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </CardContent>
                                            </Card>

                                            <Card className="w-full h-48 shadow-sm">
                                                <CardHeader className="pb-1 px-4 pt-2">
                                                    <CardTitle className="text-sm font-medium">Evolución de peso</CardTitle>
                                                </CardHeader>
                                                <CardContent className="h-full pt-0 px-2 text-primary/50">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <AreaChart data={chartData}>
                                                            <defs>
                                                                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="5%" stopColor="currentColor" stopOpacity={0.8} />
                                                                    <stop offset="95%" stopColor="currentColor" stopOpacity={0} />
                                                                </linearGradient>
                                                            </defs>
                                                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                                                            <YAxis />
                                                            <Tooltip content={<CustomTooltip />} />
                                                            <Line type="monotone" dataKey="net_weight" stroke="currentColor" strokeWidth={2} dot={{ r: 1 }} />
                                                            <Area type="monotone" dataKey="net_weight" stroke="currentColor" strokeWidth={2} fillOpacity={1} fill="url(#colorWeight)" />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        <Card className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>ID Pedido</TableHead>
                                                        <TableHead>Fecha de carga</TableHead>
                                                        <TableHead className="text-right">Cajas</TableHead>
                                                        <TableHead className="text-right">Peso Neto</TableHead>
                                                        <TableHead className="text-right">Precio Unitario</TableHead>
                                                        <TableHead className="text-right">Subtotal</TableHead>
                                                        <TableHead className="text-right">Total</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {product.lines.map((order) => (
                                                        <TableRow key={order.order_id}>
                                                            <TableCell className="font-medium">{order.formatted_id}</TableCell>
                                                            <TableCell>{formatDateShort(order.load_date)}</TableCell>
                                                            <TableCell className="text-right">{order.boxes}</TableCell>
                                                            <TableCell className="text-right">{formatDecimalWeight(order.net_weight)}</TableCell>
                                                            <TableCell className="text-right">{formatDecimalCurrency(Number(order.unit_price))}</TableCell>
                                                            <TableCell className="text-right">{formatDecimalCurrency(order.subtotal)}</TableCell>
                                                            <TableCell className="text-right">{formatDecimalCurrency(order.total)}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </Card>
                                    </AccordionContent>
                                </AccordionItem>
                            )
                        })}
                    </Accordion>
                </CardContent>
            </Card>
        </div>
    )
}
