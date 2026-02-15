"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDecimal, formatDecimalWeight } from "@/helpers/formats/numbers/formatNumbers"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PackageSearch, SearchX } from "lucide-react"
import { useStockByProductsStats } from "@/hooks/useStockStats"

export function StockByProductsCard() {
    const { data: stockData = [], isLoading } = useStockByProductsStats()
    const [search, setSearch] = useState("")

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
                {isLoading ? (
                    <ScrollArea className="h-[200px] pr-2">
                        <Table>
                            <TableBody>
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="text-sm text-muted-foreground">
                                            <Skeleton className="h-4 w-1/2" />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Skeleton className="h-4 w-16 ml-auto" />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                ) : stockData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 min-h-[200px]">
                        <div className="relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-xl opacity-70" />
                            <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-background border shadow-xs">
                                <PackageSearch className="h-6 w-6 text-primary" strokeWidth={1.5} />
                            </div>
                        </div>
                        <h2 className="mt-4 text-lg font-medium tracking-tight">No hay inventario disponible</h2>
                        <p className="mt-2 text-center text-muted-foreground max-w-[280px] text-xs whitespace-normal">
                            No se encontraron productos en el inventario. Agrega productos para ver el resumen por producto.
                        </p>
                    </div>
                ) : filteredData.length > 0 ? (
                    <ScrollArea className="h-[200px] pr-2">
                        <Table>
                            <TableBody>
                                {filteredData.map((item, i) => (
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

                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 min-h-[200px]">
                        <div className="relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-xl opacity-70" />
                            <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-background border shadow-xs">
                                <SearchX className="h-6 w-6 text-primary" strokeWidth={1.5} />
                            </div>
                        </div>
                        <h2 className="mt-4 text-lg font-medium tracking-tight">No se encontraron resultados</h2>
                        <p className="mt-2 text-center text-muted-foreground max-w-[280px] text-xs whitespace-normal">
                            No hay productos que coincidan con tu búsqueda. Intenta con otros términos.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
