"use client"

import { useState } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, Package, DollarSign, ShoppingCart } from "lucide-react"
import { useOrderContext } from "@/context/OrderContext"

export default function OrderCustomerHistory() {

    const { order } = useOrderContext()

    const customerHistory = order.customerHistory;

    const [expandedItems, setExpandedItems] = useState([])

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("es-ES", {
            style: "currency",
            currency: "EUR",
        }).format(amount)
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("es-ES", {
            year: "numeric",
            month: "short",
            day: "numeric",
        })
    }

    console.log(customerHistory)

    return (
        <div className="container mx-auto py-8 px-4 max-w-5xl">
            <h1 className="text-2xl font-bold mb-6">Histórico de Productos del Cliente</h1>

            <Accordion type="multiple" value={expandedItems} onValueChange={setExpandedItems} className="space-y-4">
                {customerHistory.map((product) => (
                    <AccordionItem
                        key={product.product.id}
                        value={product.product.id.toString()}
                        className="border rounded-lg overflow-hidden shadow-sm"
                    >
                        <AccordionTrigger className="px-6 py-4 hover:bg-muted/50 transition-colors">
                            <div className="flex flex-col md:flex-row w-full items-start md:items-center justify-between gap-4 text-left">
                                <div className="flex-1">
                                    <h3 className="font-medium text-lg">{product.product.name}</h3>
                                    <div className="flex items-center mt-1">
                                        <Badge variant="outline" className="flex items-center gap-1 mr-2">
                                            <Calendar className="h-3 w-3" />
                                            <span>Último pedido: {formatDate(product.last_order_date)}</span>
                                        </Badge>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-sm">
                                    <div className="flex flex-col">
                                        <span className="text-muted-foreground">Cajas Totales</span>
                                        <span className="font-medium flex items-center">
                                            <Package className="h-3 w-3 mr-1 text-muted-foreground" />
                                            {product.total_boxes}
                                        </span>
                                    </div>

                                    <div className="flex flex-col">
                                        <span className="text-muted-foreground">Peso Neto</span>
                                        <span className="font-medium">{product.total_net_weight} kg</span>
                                    </div>

                                    <div className="flex flex-col">
                                        <span className="text-muted-foreground">Precio Medio/kg</span>
                                        <span className="font-medium flex items-center">
                                            <DollarSign className="h-3 w-3 mr-1 text-muted-foreground" />
                                            {formatCurrency(product.average_unit_price)}
                                        </span>
                                    </div>

                                    <div className="flex flex-col">
                                        <span className="text-muted-foreground">Importe Total</span>
                                        <span className="font-medium flex items-center">
                                            <ShoppingCart className="h-3 w-3 mr-1 text-muted-foreground" />
                                            {formatCurrency(product.total_amount)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </AccordionTrigger>

                        <AccordionContent className="px-0">
                            <div className="overflow-x-auto">
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
                                                <TableCell>{formatDate(order.load_date)}</TableCell>
                                                <TableCell className="text-right">{order.boxes}</TableCell>
                                                <TableCell className="text-right">{order.net_weight} kg</TableCell>
                                                <TableCell className="text-right">{formatCurrency(Number(order.unit_price))}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(order.subtotal)}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(order.total)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    )
}
