"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Loader2, Search } from "lucide-react"
import { toast } from "react-hot-toast"

import { DateRangePicker } from "@/components/ui/dateRangePicker"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getSuppliersWithActivity } from "@/services/supplierLiquidationService"
import { getToastTheme } from "@/customs/reactHotToast"

export function SupplierLiquidationList() {
    const router = useRouter()
    const [dateRange, setDateRange] = useState({
        from: undefined,
        to: undefined,
    })
    const [suppliers, setSuppliers] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const fetchSuppliers = useCallback(async () => {
        if (!dateRange.from || !dateRange.to) {
            setSuppliers([])
            return
        }

        // Validar que la fecha de inicio sea anterior a la fecha de fin
        if (dateRange.from > dateRange.to) {
            toast.error("La fecha de inicio debe ser anterior a la fecha de fin", getToastTheme())
            return
        }

        setLoading(true)
        setError(null)

        try {
            const startDate = format(dateRange.from, "yyyy-MM-dd")
            const endDate = format(dateRange.to, "yyyy-MM-dd")

            const data = await getSuppliersWithActivity(startDate, endDate)
            setSuppliers(data || [])
        } catch (err) {
            console.error("Error al obtener proveedores:", err)
            setError(err.message || "Error al obtener la lista de proveedores")
            toast.error(
                err.message || "Error al obtener la lista de proveedores",
                getToastTheme()
            )
            setSuppliers([])
        } finally {
            setLoading(false)
        }
    }, [dateRange])

    useEffect(() => {
        fetchSuppliers()
    }, [fetchSuppliers])

    const handleSupplierClick = (supplierId, e) => {
        if (!dateRange.from || !dateRange.to) {
            toast.error("Por favor, seleccione un rango de fechas", getToastTheme())
            return
        }

        const startDate = format(dateRange.from, "yyyy-MM-dd")
        const endDate = format(dateRange.to, "yyyy-MM-dd")
        
        // Abrir en nueva pestaña
        const url = `/admin/supplier-liquidations/${supplierId}?start=${startDate}&end=${endDate}`
        window.open(url, '_blank')
        
        // Prevenir el comportamiento por defecto si hay evento
        if (e) {
            e.stopPropagation()
        }
    }

    const formatCurrency = (value) => {
        return new Intl.NumberFormat("es-ES", {
            style: "currency",
            currency: "EUR",
        }).format(value || 0)
    }

    const formatWeight = (value) => {
        return new Intl.NumberFormat("es-ES", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value || 0) + " kg"
    }

    return (
        <div className="h-full w-full flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 w-full">
                <div className="p-6 space-y-6">
                    <Card>
                <CardHeader>
                    <CardTitle>Liquidación de Proveedores</CardTitle>
                    <CardDescription>
                        Seleccione un rango de fechas para ver los proveedores con actividad
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                        <div className="flex-1 max-w-md">
                            <label className="text-sm font-medium mb-2 block">
                                Rango de fechas
                            </label>
                            <DateRangePicker
                                dateRange={dateRange}
                                onChange={setDateRange}
                            />
                        </div>
                        <Button
                            onClick={fetchSuppliers}
                            disabled={!dateRange.from || !dateRange.to || loading}
                            className="w-full sm:w-auto"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Cargando...
                                </>
                            ) : (
                                <>
                                    <Search className="mr-2 h-4 w-4" />
                                    Buscar
                                </>
                            )}
                        </Button>
                    </div>

                    {error && (
                        <div className="p-4 bg-destructive/10 text-destructive rounded-md">
                            {error}
                        </div>
                    )}

                    {loading && (
                        <div className="space-y-2">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-16 w-full" />
                            ))}
                        </div>
                    )}

                    {!loading && !error && dateRange.from && dateRange.to && (
                        <>
                            {suppliers.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <p className="text-lg font-medium mb-2">
                                        No se encontraron proveedores con actividad
                                    </p>
                                    <p className="text-sm">
                                        No hay recepciones ni salidas de cebo en el rango de fechas
                                        seleccionado.
                                    </p>
                                </div>
                            ) : (
                                <div className="rounded-md border overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Proveedor</TableHead>
                                                <TableHead className="text-right">
                                                    Recepciones
                                                </TableHead>
                                                <TableHead className="text-right">
                                                    Salidas de Cebo
                                                </TableHead>
                                                <TableHead className="text-right">
                                                    Peso Recepciones
                                                </TableHead>
                                                <TableHead className="text-right">
                                                    Peso Salidas
                                                </TableHead>
                                                <TableHead className="text-right">
                                                    Importe Recepciones
                                                </TableHead>
                                                <TableHead className="text-right">
                                                    Importe Salidas
                                                </TableHead>
                                                <TableHead className="text-center">
                                                    Acción
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {suppliers.map((supplier) => (
                                                <TableRow
                                                    key={supplier.id}
                                                >
                                                    <TableCell className="font-medium">
                                                        {supplier.name}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {supplier.receptions_count || 0}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {supplier.dispatches_count || 0}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {formatWeight(
                                                            supplier.total_receptions_weight
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {formatWeight(
                                                            supplier.total_dispatches_weight
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {formatCurrency(
                                                            supplier.total_receptions_amount
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {formatCurrency(
                                                            supplier.total_dispatches_amount
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={(e) => handleSupplierClick(supplier.id, e)}
                                                        >
                                                            Ver Detalle
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </>
                    )}

                    {!loading && !error && (!dateRange.from || !dateRange.to) && (
                        <div className="text-center py-12 text-muted-foreground">
                            <p className="text-sm">
                                Seleccione un rango de fechas para comenzar
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
                </div>
            </ScrollArea>
        </div>
    )
}

