"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { getStockByProducts } from "@/services/storeService"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDecimal, formatDecimalWeight, formatInteger } from "@/helpers/formats/numbers/formatNumbers"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"

export function StockByProductsCard() {
    const { data: session, status } = useSession()
    const [stockData, setStockData] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState("")

    useEffect(() => {
        if (status !== "authenticated") return

        getStockByProducts(session.user.accessToken)
            .then(setStockData)
            .catch((err) => {
                console.error("Error al cargar stock por productos:", err)
                setStockData([])
            })
            .finally(() => setIsLoading(false))
    }, [status, session])

    const filteredData = stockData.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase())
    )

    const totalKg = stockData.reduce((sum, item) => sum + item.total_kg, 0)

    return (
        <Card className="w-full max-w-full overflow-hidden">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-semibold">Inventario por productos</CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">
                            Total: {formatDecimalWeight(totalKg)}
                        </CardDescription>
                    </div>

                    <Input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar producto"
                        className="max-w-[200px] text-sm hidden 3xl:flex "
                    />
                </div>

                <Input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar producto"
                    className="max-w-[200px] text-sm 3xl:hidden "
                />
            </CardHeader>

            <CardContent>
                <ScrollArea className="h-[200px] pr-2">
                    <Table>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="text-sm text-muted-foreground">
                                            <Skeleton className="h-4 w-1/2" />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Skeleton className="h-4 w-16 ml-auto" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : filteredData.length > 0 ? (
                                filteredData.map((item, i) => (
                                    <TableRow key={i} className="border-muted border-b">
                                        {/* Nombre */}
                                        <TableCell className="text-sm">{item.name}</TableCell>

                                        {/* % visible solo en sm+ */}
                                        <TableCell className="text-right hidden sm:table-cell text-xs font-mono font-bold text-nowrap">
                                            {formatDecimal(item.percentage)}%
                                        </TableCell>

                                        {/* kg visible solo en sm+ */}
                                        <TableCell className="text-right hidden sm:table-cell text-sm font-mono text-muted-foreground text-nowrap">
                                            {formatDecimalWeight(item.total_kg)}
                                        </TableCell>

                                        {/* Celda combinada para móvil */}
                                        <TableCell
                                            className="sm:hidden text-right text-xs font-mono  text-nowrap"
                                            colSpan={2}
                                        >
                                            <div className="flex flex-col items-end">
                                                <span className="text-right text-xs text-muted-foreground">{formatDecimalWeight(item.total_kg)}</span>
                                                <span className="text-right text-xs font-bold">{formatDecimal(item.percentage)}%</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>

                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center text-sm text-muted-foreground py-4">
                                        Sin resultados
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
