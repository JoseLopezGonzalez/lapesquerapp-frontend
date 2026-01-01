"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { format } from "date-fns"
import { Loader2, ArrowLeft, Download, Package, Truck } from "lucide-react"
import { toast } from "react-hot-toast"

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
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import {
    getSupplierLiquidationDetails,
    downloadSupplierLiquidationPdf,
} from "@/services/supplierLiquidationService"
import { getToastTheme } from "@/customs/reactHotToast"

export function SupplierLiquidationDetail({ supplierId }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const startDate = searchParams.get("start")
    const endDate = searchParams.get("end")

    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [downloadingPdf, setDownloadingPdf] = useState(false)
    const [error, setError] = useState(null)
    const [selectedReceptions, setSelectedReceptions] = useState([])
    const [selectedDispatches, setSelectedDispatches] = useState([])
    const [paymentMethod, setPaymentMethod] = useState('cash') // 'cash' o 'transfer' - Por defecto 'cash'
    const [hasManagementFee, setHasManagementFee] = useState(false)
    const [showTransferPayment, setShowTransferPayment] = useState(true) // Por defecto true (mostrar)

    useEffect(() => {
        if (!startDate || !endDate) {
            setError("Fechas no especificadas")
            setLoading(false)
            return
        }

        const fetchDetails = async () => {
            setLoading(true)
            setError(null)

            try {
                const details = await getSupplierLiquidationDetails(
                    supplierId,
                    startDate,
                    endDate
                )
                setData(details)
                // Inicializar selecciones con todos los IDs por defecto
                if (details) {
                    const allReceptionIds = details.receptions?.map(r => r.id) || []
                    const allDispatchIds = details.dispatches?.map(d => d.id) || []
                    // También incluir salidas relacionadas
                    const relatedDispatchIds = details.receptions?.flatMap(r => 
                        r.related_dispatches?.map(d => d.id) || []
                    ) || []
                    const allDispatches = [...new Set([...allDispatchIds, ...relatedDispatchIds])]
                    setSelectedReceptions(allReceptionIds)
                    setSelectedDispatches(allDispatches)
                }
            } catch (err) {
                console.error("Error al obtener detalles:", err)
                setError(err.message || "Error al obtener el detalle de la liquidación")
                toast.error(
                    err.message || "Error al obtener el detalle de la liquidación",
                    getToastTheme()
                )
            } finally {
                setLoading(false)
            }
        }

        fetchDetails()
    }, [supplierId, startDate, endDate])

    const handleDownloadPdf = async () => {
        if (!startDate || !endDate || !data) return

        // Validación: siempre debe seleccionarse un método de pago
        if (!paymentMethod) {
            toast.error("Debe seleccionar un método de pago (Efectivo o Transferencia)", getToastTheme())
            return
        }

        setDownloadingPdf(true)
        const toastId = toast.loading("Generando PDF...", getToastTheme())

        try {
            // Calcular total de salidas (independientes + relacionadas)
            const allDispatches = [...(data.dispatches || [])]
            const relatedDispatches = data.receptions?.flatMap(r => r.related_dispatches || []) || []
            const totalDispatches = [...new Set([
                ...allDispatches.map(d => d.id),
                ...relatedDispatches.map(d => d.id)
            ])]

            // Separar salidas independientes de las relacionadas
            const independentDispatchIds = allDispatches.map(d => d.id)
            const relatedDispatchIds = [...new Set(relatedDispatches.map(d => d.id))]
            
            // Si todas las recepciones están seleccionadas, enviar arrays vacíos (backend incluirá todo)
            // Si hay selección parcial de recepciones, debemos asegurarnos de incluir las salidas independientes
            const allReceptionsSelected = selectedReceptions.length === (data.receptions?.length || 0) && selectedReceptions.length > 0
            const allDispatchesSelected = selectedDispatches.length === totalDispatches.length && selectedDispatches.length > 0
            
            // Para recepciones: si todas están seleccionadas, enviar array vacío
            const receptionsToSend = allReceptionsSelected ? [] : selectedReceptions
            
            // Para salidas: 
            // - Si todas las recepciones Y todas las salidas están seleccionadas, enviar arrays vacíos (backend incluirá todo)
            // - Si hay selección parcial de recepciones, SIEMPRE incluir las salidas independientes explícitamente
            // - Si hay selección parcial de salidas, incluir las seleccionadas
            let dispatchesToSend = []
            if (allReceptionsSelected && allDispatchesSelected) {
                // Todo seleccionado: enviar arrays vacíos (backend incluirá todo)
                dispatchesToSend = []
            } else if (allReceptionsSelected && !allDispatchesSelected) {
                // Todas las recepciones seleccionadas pero salidas parciales: enviar solo las seleccionadas
                dispatchesToSend = selectedDispatches
            } else {
                // Selección parcial de recepciones: SIEMPRE incluir las salidas independientes, más las relacionadas seleccionadas
                const selectedRelatedDispatches = selectedDispatches.filter(id => relatedDispatchIds.includes(id))
                dispatchesToSend = [...new Set([...independentDispatchIds, ...selectedRelatedDispatches])]
            }

            await downloadSupplierLiquidationPdf(
                supplierId,
                startDate,
                endDate,
                data.supplier?.name || "Proveedor",
                receptionsToSend,
                dispatchesToSend,
                paymentMethod,
                hasManagementFee,
                showTransferPayment
            )
            toast.success("PDF descargado correctamente", { id: toastId })
        } catch (err) {
            console.error("Error al descargar PDF:", err)
            let errorMessage = "Error al descargar el PDF"
            if (err.status === 422) {
                errorMessage = "Algunos IDs seleccionados no existen. Por favor, recargue la página."
            } else if (err.status === 404) {
                errorMessage = "Proveedor no encontrado"
            } else if (err.message) {
                errorMessage = err.message
            }
            toast.error(errorMessage, { id: toastId })
        } finally {
            setDownloadingPdf(false)
        }
    }

    const toggleReception = (receptionId) => {
        setSelectedReceptions(prev => 
            prev.includes(receptionId)
                ? prev.filter(id => id !== receptionId)
                : [...prev, receptionId]
        )
    }

    const toggleDispatch = (dispatchId) => {
        setSelectedDispatches(prev => 
            prev.includes(dispatchId)
                ? prev.filter(id => id !== dispatchId)
                : [...prev, dispatchId]
        )
    }

    const selectAllReceptions = () => {
        const allIds = data?.receptions?.map(r => r.id) || []
        setSelectedReceptions(allIds)
    }

    const deselectAllReceptions = () => {
        setSelectedReceptions([])
    }

    const selectAllDispatches = () => {
        const allDispatches = [...(data?.dispatches || [])]
        const relatedDispatches = data?.receptions?.flatMap(r => r.related_dispatches || []) || []
        const allIds = [...new Set([
            ...allDispatches.map(d => d.id),
            ...relatedDispatches.map(d => d.id)
        ])]
        setSelectedDispatches(allIds)
    }

    const deselectAllDispatches = () => {
        setSelectedDispatches([])
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

    const formatPricePerKg = (value) => {
        return new Intl.NumberFormat("es-ES", {
            style: "currency",
            currency: "EUR",
        }).format(value || 0) + "/kg"
    }

    const formatDate = (dateString) => {
        if (!dateString) return "-"
        try {
            return format(new Date(dateString), "dd/MM/yyyy")
        } catch {
            return dateString
        }
    }

    if (loading) {
        return (
            <div className="h-full w-full flex flex-col overflow-hidden">
                <ScrollArea className="flex-1 w-full">
                    <div className="p-6 space-y-6">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-64 w-full" />
                        <Skeleton className="h-96 w-full" />
                    </div>
                </ScrollArea>
            </div>
        )
    }

    if (error || !data) {
        return (
            <div className="h-full w-full flex flex-col overflow-hidden">
                <ScrollArea className="flex-1 w-full">
                    <div className="p-6">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-center py-12">
                                    <p className="text-lg font-medium text-destructive mb-2">
                                        {error || "Error al cargar los datos"}
                                    </p>
                                    <Button
                                        variant="outline"
                                        onClick={() => router.push("/admin/supplier-liquidations")}
                                    >
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Volver al listado
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </ScrollArea>
            </div>
        )
    }

    const { supplier, date_range, receptions, dispatches, summary } = data

    // Extraer todas las salidas relacionadas de las recepciones para mostrarlas en la tabla de salidas
    const allRelatedDispatches = receptions?.flatMap(reception => 
        reception.related_dispatches || []
    ) || []
    
    // Combinar salidas relacionadas con salidas independientes
    const allDispatches = [...(allRelatedDispatches || []), ...(dispatches || [])]

    return (
        <div className="h-full w-full flex flex-col overflow-hidden">
            {/* Header con acciones - fijo */}
            <div className="flex items-center justify-between p-6 pb-2 flex-shrink-0">
                <Button
                    variant="outline"
                    onClick={() => router.push("/admin/supplier-liquidations")}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver
                </Button>
                <Button
                    onClick={handleDownloadPdf}
                    disabled={downloadingPdf}
                >
                    {downloadingPdf ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generando...
                        </>
                    ) : (
                        <>
                            <Download className="mr-2 h-4 w-4" />
                            Generar PDF
                        </>
                    )}
                </Button>
            </div>

            {/* Información del proveedor */}
            {data && (
                <div className="p-4 mx-6 mb-2 bg-muted/50 rounded-lg flex-shrink-0">
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="font-semibold text-base">{supplier?.name || "-"}</div>
                        {supplier?.contact_person && (
                            <span className="text-muted-foreground">• {supplier.contact_person}</span>
                        )}
                        {supplier?.phone && (
                            <span className="text-muted-foreground">• {supplier.phone}</span>
                        )}
                        {supplier?.address && (
                            <span className="text-muted-foreground">• {supplier.address}</span>
                        )}
                        <span className="ml-auto text-muted-foreground">
                            {formatDate(date_range?.start)} - {formatDate(date_range?.end)}
                        </span>
                    </div>
                </div>
            )}

            {/* Controles de pago y gasto de gestión */}
            {data && summary && (
                <div className="p-4 mx-6 mb-2 bg-muted/50 rounded-lg flex-shrink-0">
                    <div className="flex flex-col gap-4">
                        {/* Selector de método de pago (siempre visible) - Switch */}
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-medium whitespace-nowrap">Método de pago:</label>
                            <div 
                                className="relative inline-flex h-9 w-[180px] items-center rounded-lg bg-muted p-1 cursor-pointer"
                                onClick={() => setPaymentMethod(paymentMethod === 'cash' ? 'transfer' : 'cash')}
                            >
                                <div
                                    className={`absolute h-7 w-[86px] rounded-md bg-background shadow-sm transition-transform duration-200 ease-in-out ${
                                        paymentMethod === 'cash' ? 'translate-x-0' : 'translate-x-[88px]'
                                    }`}
                                />
                                <div className="relative flex h-full w-full items-center justify-center">
                                    <span
                                        className={`z-10 flex-1 text-center text-sm font-medium transition-colors duration-200 ${
                                            paymentMethod === 'cash' ? 'text-foreground' : 'text-muted-foreground'
                                        }`}
                                    >
                                        Efectivo
                                    </span>
                                    <span
                                        className={`z-10 flex-1 text-center text-sm font-medium transition-colors duration-200 ${
                                            paymentMethod === 'transfer' ? 'text-foreground' : 'text-muted-foreground'
                                        }`}
                                    >
                                        Transferencia
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Separador visual */}
                        <div className="border-t border-border/50"></div>
                        
                        {/* Checkboxes siempre visibles */}
                        <div className="flex flex-wrap items-center gap-6">
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="hasManagementFee"
                                    checked={hasManagementFee}
                                    onCheckedChange={(checked) => setHasManagementFee(checked)}
                                />
                                <label
                                    htmlFor="hasManagementFee"
                                    className="text-sm cursor-pointer"
                                >
                                    Lleva gasto de gestión (2.5% sobre declarado sin IVA)
                                </label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="showTransferPayment"
                                    checked={showTransferPayment}
                                    onCheckedChange={(checked) => setShowTransferPayment(checked)}
                                />
                                <label
                                    htmlFor="showTransferPayment"
                                    className="text-sm cursor-pointer"
                                >
                                    Mostrar pago por transferencia
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Contenido con scroll */}
            <ScrollArea className="flex-1 w-full">
                <div className="p-6 pt-2 space-y-6">

            {/* Tabla de Recepciones */}
            <Card>
                <CardHeader>
                    <CardTitle>Recepciones</CardTitle>
                    <CardDescription>
                        Recepciones de materia prima con sus productos y salidas relacionadas
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">
                                        <Checkbox
                                            checked={selectedReceptions.length === (data?.receptions?.length || 0) && selectedReceptions.length > 0}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    selectAllReceptions()
                                                } else {
                                                    deselectAllReceptions()
                                                }
                                            }}
                                        />
                                    </TableHead>
                                    <TableHead>Producto</TableHead>
                                    <TableHead className="text-right">Peso Neto</TableHead>
                                    <TableHead className="text-right">Precio</TableHead>
                                    <TableHead className="text-right">Importe</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {receptions && receptions.length > 0 ? (
                                    receptions.map((reception) => {
                                        if (!reception) return null
                                        return (
                                            <React.Fragment key={`reception-${reception.id}`}>
                                                {/* Header de recepción */}
                                                <TableRow className="bg-blue-200/50 dark:bg-blue-800/30 font-bold">
                                                    <TableCell>
                                                        <Checkbox
                                                            checked={selectedReceptions.includes(reception.id)}
                                                            onCheckedChange={() => toggleReception(reception.id)}
                                                        />
                                                    </TableCell>
                                                    <TableCell colSpan={4}>
                                                        Recepción #{reception.id} - {formatDate(reception.date)}
                                                    </TableCell>
                                                </TableRow>
                                                {/* Productos de la recepción */}
                                                {reception.products?.map((product, productIndex) => (
                                                    <TableRow
                                                        key={`reception-${reception.id}-product-${product.id || productIndex}`}
                                                        className="bg-blue-50/50 dark:bg-blue-950/20"
                                                    >
                                                        <TableCell></TableCell>
                                                        <TableCell className="pl-8">
                                                            <span className="text-muted-foreground mr-2">└─</span>
                                                            {product.product?.name || "-"}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {formatWeight(product.net_weight)}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {formatPricePerKg(product.price)}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {formatCurrency(product.amount)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}

                                                {/* Totales de la recepción */}
                                                {reception.products && reception.products.length > 0 && (
                                                    <>
                                                        <TableRow className="bg-blue-100/50 dark:bg-blue-900/30 font-semibold">
                                                            <TableCell></TableCell>
                                                            <TableCell>
                                                                Total
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                {formatWeight(
                                                                    reception.calculated_total_net_weight
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                {reception.average_price
                                                                    ? formatPricePerKg(reception.average_price)
                                                                    : "-"}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                {formatCurrency(
                                                                    reception.calculated_total_amount
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                        {/* Total declarado si existe */}
                                                        {reception.declared_total_net_weight !== null &&
                                                            reception.declared_total_net_weight !== undefined && (
                                                                <TableRow className="bg-blue-50/50 dark:bg-blue-950/20 text-sm">
                                                                    <TableCell></TableCell>
                                                                    <TableCell>
                                                                        Total Declarado
                                                                    </TableCell>
                                                                    <TableCell className="text-right">
                                                                        {formatWeight(
                                                                            reception.declared_total_net_weight
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell></TableCell>
                                                                    <TableCell className="text-right">
                                                                        {formatCurrency(
                                                                            reception.declared_total_amount
                                                                        )}
                                                                    </TableCell>
                                                                </TableRow>
                                                            )}
                                                    </>
                                                )}

                                            </React.Fragment>
                                        )
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            No hay recepciones en este período
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Tabla de Salidas de Cebo */}
            {allDispatches && allDispatches.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Salidas de Cebo</CardTitle>
                        <CardDescription>
                            Todas las salidas de cebo del período
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">
                                            <Checkbox
                                                checked={selectedDispatches.length === allDispatches.length && allDispatches.length > 0}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        selectAllDispatches()
                                                    } else {
                                                        deselectAllDispatches()
                                                    }
                                                }}
                                            />
                                        </TableHead>
                                        <TableHead>Producto</TableHead>
                                        <TableHead className="text-right">Peso Neto</TableHead>
                                        <TableHead className="text-right">Precio</TableHead>
                                        <TableHead className="text-right">Base</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {allDispatches.map((dispatch) => {
                                        if (!dispatch) return null
                                        return (
                                            <React.Fragment key={`dispatch-${dispatch.id}`}>
                                                {/* Header de salida */}
                                                <TableRow className="bg-orange-200/50 dark:bg-orange-800/30 font-bold">
                                                    <TableCell>
                                                        <Checkbox
                                                            checked={selectedDispatches.includes(dispatch.id)}
                                                            onCheckedChange={() => toggleDispatch(dispatch.id)}
                                                        />
                                                    </TableCell>
                                                    <TableCell colSpan={5}>
                                                        <div className="flex items-center gap-2">
                                                            <span>Salida #{dispatch.id} - {formatDate(dispatch.date)}</span>
                                                            {dispatch.export_type && (
                                                                <Badge 
                                                                    variant={dispatch.export_type === 'a3erp' ? 'default' : 'secondary'}
                                                                    className="text-xs"
                                                                >
                                                                    {dispatch.export_type === 'a3erp' ? 'A3ERP' : 'FACILCOM'}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                                {dispatch.products?.map((product, productIndex) => {
                                                    // Calcular importe con IVA proporcional si hay IVA
                                                    let productAmountWithIva = product.amount
                                                    if (dispatch.iva_amount > 0 && dispatch.base_amount > 0) {
                                                        const ivaProportional = (product.amount / dispatch.base_amount) * dispatch.iva_amount
                                                        productAmountWithIva = product.amount + ivaProportional
                                                    }
                                                    
                                                    return (
                                                        <TableRow
                                                            key={`dispatch-${dispatch.id}-product-${product.id || productIndex}`}
                                                            className="bg-orange-50/50 dark:bg-orange-950/20"
                                                        >
                                                            <TableCell></TableCell>
                                                            <TableCell className="pl-8">
                                                                <span className="text-muted-foreground mr-2">└─</span>
                                                                {product.product?.name || "-"}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                {formatWeight(product.net_weight)}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                {formatPricePerKg(product.price)}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                {formatCurrency(product.amount)}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                {formatCurrency(productAmountWithIva)}
                                                            </TableCell>
                                                        </TableRow>
                                                    )
                                                })}
                                                {dispatch.products && dispatch.products.length > 0 && (
                                                    <TableRow className="bg-orange-100/50 dark:bg-orange-900/30 font-semibold">
                                                        <TableCell></TableCell>
                                                        <TableCell>
                                                            Total
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {formatWeight(dispatch.total_net_weight)}
                                                        </TableCell>
                                                        <TableCell></TableCell>
                                                        <TableCell className="text-right">
                                                            {formatCurrency(dispatch.base_amount || dispatch.total_amount)}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {formatCurrency(dispatch.total_amount)}
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </React.Fragment>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

                </div>
            </ScrollArea>
        </div>
    )
}

