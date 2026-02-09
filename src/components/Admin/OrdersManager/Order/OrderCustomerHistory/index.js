// Adaptación completa del componente a SHADCN y modo light/dark

"use client"

import { useState, useEffect, useMemo } from "react"
import { useSession } from "next-auth/react"
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
import { 
    Calendar, 
    AlertCircle, 
    TrendingUp, 
    TrendingDown,
    Clock,
    Coins,
    Package,
    MoreVertical
} from "lucide-react"
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
    XAxis,
    Tooltip as RechartsTooltip,
    AreaChart,
    Area,
    Line,
} from "recharts"
import { getCustomerOrderHistory } from "@/services/customerService"
import toast from "react-hot-toast"
import { getToastTheme } from "@/customs/reactHotToast"
import Loader from "@/components/Utilities/Loader"
import { subMonths, subYears, startOfMonth, endOfMonth, format as formatDate, parseISO, isWithinInterval, differenceInDays, startOfYear, endOfYear } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useIsMobile } from "@/hooks/use-mobile"

export default function OrderCustomerHistory() {
    const { order } = useOrderContext()
    const { data: session } = useSession()
    const isMobile = useIsMobile()
    const [customerHistory, setCustomerHistory] = useState([])
    const [availableYears, setAvailableYears] = useState([])
    const [initialLoading, setInitialLoading] = useState(true) // Solo para la primera carga
    const [loadingData, setLoadingData] = useState(false) // Para cambios de filtro
    const [error, setError] = useState(null)
    const [expandedItems, setExpandedItems] = useState([])
    const [dateFilter, setDateFilter] = useState("month") // "month", "quarter", "year", "year-1", "year-select", "year-select"
    const [selectedYear, setSelectedYear] = useState(null) // Año seleccionado en el selector
    const [maxProductsToShow, setMaxProductsToShow] = useState(10) // Límite inicial de productos a mostrar

    // Calcular rango de fechas según el filtro
    const getDateRange = useMemo(() => {
        const now = new Date()
        const currentYear = now.getFullYear()
        
        switch (dateFilter) {
            case "month":
                return { from: startOfMonth(subMonths(now, 1)), to: endOfMonth(subMonths(now, 1)) }
            case "quarter":
                const quarterStart = new Date(currentYear, Math.floor(now.getMonth() / 3) * 3 - 3, 1)
                const quarterEnd = new Date(currentYear, Math.floor(now.getMonth() / 3) * 3, 0)
                return { from: quarterStart, to: quarterEnd }
            case "year":
                // Año actual (ej: 2026 si estamos en 2026)
                return { from: new Date(currentYear, 0, 1), to: new Date(currentYear, 11, 31) }
            case "year-1":
                // Año pasado (ej: 2025 si estamos en 2026)
                return { from: new Date(currentYear - 1, 0, 1), to: new Date(currentYear - 1, 11, 31) }
            case "year-select":
                // Año seleccionado en el selector
                if (selectedYear) {
                    return { from: new Date(selectedYear, 0, 1), to: new Date(selectedYear, 11, 31) }
                }
                return null
            default:
                return null
        }
    }, [dateFilter, selectedYear])

    // Cargar años disponibles (una sola vez al montar)
    useEffect(() => {
        const loadAvailableYears = async () => {
            const customerId = order?.customer?.id
            const token = session?.user?.accessToken

            if (!customerId || !token) return

            try {
                const result = await getCustomerOrderHistory(customerId, token, {})
                setAvailableYears(result.available_years || [])
            } catch (err) {
                console.error("Error al cargar años disponibles:", err)
            }
        }

        loadAvailableYears()
    }, [order?.customer?.id, session?.user?.accessToken])

    // Cargar historial del cliente según el filtro seleccionado
    useEffect(() => {
        const loadCustomerHistory = async () => {
            const customerId = order?.customer?.id
            const token = session?.user?.accessToken

            if (!customerId) {
                setError("No se pudo obtener el ID del cliente")
                setInitialLoading(false)
                return
            }

            if (!token) {
                setError("No se pudo obtener el token de autenticación")
                setInitialLoading(false)
                return
            }

            try {
                // Si ya hay datos, solo mostrar loader en la sección de productos
                if (customerHistory.length > 0) {
                    setLoadingData(true)
                } else {
                    setInitialLoading(true)
                }
                setError(null)
                
                const dateRange = getDateRange
                let options = {}
                
                if (dateRange && dateRange.from && dateRange.to) {
                    options.dateFrom = formatDate(dateRange.from, 'yyyy-MM-dd')
                    options.dateTo = formatDate(dateRange.to, 'yyyy-MM-dd')
                }
                
                const result = await getCustomerOrderHistory(customerId, token, options)
                setCustomerHistory(result.data || [])
            } catch (err) {
                const errorMessage = err.message || "Error al cargar el historial del cliente"
                setError(errorMessage)
                toast.error(errorMessage, getToastTheme())
                // Solo limpiar datos si es la primera carga
                if (customerHistory.length === 0) {
                    setCustomerHistory([])
                }
            } finally {
                setInitialLoading(false)
                setLoadingData(false)
            }
        }

        loadCustomerHistory()
    }, [order?.customer?.id, session?.user?.accessToken, getDateRange])


    // Verificar qué años tienen datos para mostrar solo las tabs correspondientes
    const currentYear = new Date().getFullYear()
    const hasCurrentYear = availableYears.includes(currentYear)
    const hasYear1 = availableYears.includes(currentYear - 1)
    // Años para el selector: todos excepto el actual y el pasado
    const yearsForSelector = availableYears.filter(year => year < currentYear - 1)

    // Los datos ya vienen filtrados del backend, así que usamos directamente customerHistory
    const filteredHistory = customerHistory

    // Calcular métricas generales
    const generalMetrics = useMemo(() => {
        if (!filteredHistory || filteredHistory.length === 0) return null

        const allLines = filteredHistory.flatMap(p => p.lines)
        const totalOrders = new Set(allLines.map(l => l.order_id)).size
        const totalAmount = filteredHistory.reduce((sum, p) => sum + (p.total_amount || 0), 0)
        const avgOrderValue = totalOrders > 0 ? totalAmount / totalOrders : 0

        // Calcular frecuencia promedio (días entre pedidos)
        const sortedDates = allLines
            .map(l => parseISO(l.load_date))
            .sort((a, b) => a - b)
        
        let totalDays = 0
        for (let i = 1; i < sortedDates.length; i++) {
            totalDays += differenceInDays(sortedDates[i], sortedDates[i-1])
        }
        const avgDaysBetween = sortedDates.length > 1 ? totalDays / (sortedDates.length - 1) : 0

        // Último pedido
        const lastOrderDate = sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : null
        const daysSinceLastOrder = lastOrderDate ? differenceInDays(new Date(), lastOrderDate) : null

        return {
            totalOrders,
            totalAmount,
            avgOrderValue,
            avgDaysBetween: Math.round(avgDaysBetween),
            daysSinceLastOrder,
            lastOrderDate
        }
    }, [filteredHistory])

    // Calcular tendencias para cada producto comparando con el período anterior del mismo rango
    const calculateTrend = (product) => {
        if (!product.lines || product.lines.length < 2 || !getDateRange) return { direction: "stable", percentage: 0 }

        const currentPeriod = getDateRange
        if (!currentPeriod.from || !currentPeriod.to) return { direction: "stable", percentage: 0 }

        // Calcular el período anterior del mismo rango
        let previousPeriod = null
        const now = new Date()
        const currentYear = now.getFullYear()

        switch (dateFilter) {
            case "month": {
                // Mes anterior (el filtro muestra el mes pasado, así que comparamos con el anterior a ese)
                const currentMonth = subMonths(now, 1)
                const previousMonth = subMonths(currentMonth, 1)
                previousPeriod = {
                    from: startOfMonth(previousMonth),
                    to: endOfMonth(previousMonth)
                }
                break
            }
            case "quarter": {
                // Trimestre anterior (el filtro muestra el trimestre pasado, así que comparamos con el anterior a ese)
                const currentQuarterMonth = Math.floor(now.getMonth() / 3) * 3 - 3
                const prevQuarterMonth = currentQuarterMonth - 3
                // Ajustar año si el trimestre anterior está en el año anterior
                const prevQuarterYear = prevQuarterMonth < 0 ? now.getFullYear() - 1 : now.getFullYear()
                const adjustedPrevQuarterMonth = prevQuarterMonth < 0 ? prevQuarterMonth + 12 : prevQuarterMonth
                previousPeriod = {
                    from: new Date(prevQuarterYear, adjustedPrevQuarterMonth, 1),
                    to: new Date(prevQuarterYear, adjustedPrevQuarterMonth + 3, 0)
                }
                break
            }
            case "year": {
                // Año anterior al actual
                previousPeriod = {
                    from: startOfYear(new Date(currentYear - 1, 0, 1)),
                    to: endOfYear(new Date(currentYear - 1, 11, 31))
                }
                break
            }
            case "year-1": {
                // Año anterior al pasado
                previousPeriod = {
                    from: startOfYear(new Date(currentYear - 2, 0, 1)),
                    to: endOfYear(new Date(currentYear - 2, 11, 31))
                }
                break
            }
            case "year-select": {
                // Año anterior al seleccionado
                if (selectedYear) {
                    const year = parseInt(selectedYear)
                    previousPeriod = {
                        from: startOfYear(new Date(year - 1, 0, 1)),
                        to: endOfYear(new Date(year - 1, 11, 31))
                    }
                }
                break
            }
        }

        if (!previousPeriod) return { direction: "stable", percentage: 0 }

        // Obtener todas las líneas del historial completo (no solo las filtradas)
        const allLines = customerHistory
            .find(p => p.product.id === product.product.id)?.lines || []

        // Filtrar líneas del período actual
        const currentPeriodLines = allLines.filter(l => {
            const date = parseISO(l.load_date)
            return isWithinInterval(date, { start: currentPeriod.from, end: currentPeriod.to })
        })

        // Filtrar líneas del período anterior
        const previousPeriodLines = allLines.filter(l => {
            const date = parseISO(l.load_date)
            return isWithinInterval(date, { start: previousPeriod.from, end: previousPeriod.to })
        })

        if (previousPeriodLines.length === 0) return { direction: "stable", percentage: 0 }

        const currentPeriodTotal = currentPeriodLines.reduce((sum, l) => sum + (Number(l.net_weight) || 0), 0)
        const previousPeriodTotal = previousPeriodLines.reduce((sum, l) => sum + (Number(l.net_weight) || 0), 0)

        if (previousPeriodTotal === 0) return { direction: "stable", percentage: 0 }

        const percentage = ((currentPeriodTotal - previousPeriodTotal) / previousPeriodTotal) * 100

        if (Math.abs(percentage) < 5) return { direction: "stable", percentage: 0 }
        return { 
            direction: percentage > 0 ? "up" : "down", 
            percentage: Math.abs(percentage).toFixed(1) 
        }
    }


    // Obtener texto del tooltip según el filtro
    const getTrendTooltipText = () => {
        switch (dateFilter) {
            case "month":
                return "Variación de peso neto comparado con el mes anterior"
            case "quarter":
                return "Variación de peso neto comparado con el trimestre anterior"
            case "year":
                return "Variación de peso neto comparado con el año anterior"
            case "year-1":
                return "Variación de peso neto comparado con el año anterior"
            case "year-select":
                return "Variación de peso neto comparado con el año anterior"
            default:
                return "Variación de peso neto comparado con el período anterior"
        }
    }

    const getChartDataByProduct = (product) => {
        return product.lines
            .map((line) => ({
                load_date: line.load_date,
                unit_price: Number(line.unit_price) || 0,
                net_weight: Number(line.net_weight) || 0,
                boxes: Number(line.boxes) || 0,
                amount: Number(line.total) || 0,
            }))
            .sort((a, b) => new Date(a.load_date) - new Date(b.load_date))
    }

    const CustomTooltip = ({ active, payload, isCurrency }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-popover border p-3 rounded-lg shadow">
                    {payload.map((data, index) => (
                        <div key={index}>
                            <p className="text-sm text-foreground">{formatDateShort(data.payload.load_date || data.payload.month)}</p>
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

    // Mostrar loader solo en la primera carga
    if (initialLoading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-0">
                <Loader />
            </div>
        )
    }

    // Mostrar error si hay
    if (error) {
        return (
            <div className="h-full pb-2">
                {isMobile ? (
                    <div className="h-full flex flex-col">
                        <div className="flex-1 overflow-y-auto py-2 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <AlertCircle className="h-8 w-8" />
                                <p className="text-sm">{error}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                <Card className="h-full flex flex-col bg-transparent">
                    <CardHeader>
                        <CardTitle className="text-lg font-medium">Históricos de productos</CardTitle>
                        <CardDescription>Histórico de productos del cliente</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto py-2 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <AlertCircle className="h-8 w-8" />
                            <p className="text-sm">{error}</p>
                        </div>
                    </CardContent>
                </Card>
                )}
            </div>
        )
    }

    // Mostrar mensaje si no hay historial (solo si no está cargando)
    if (!loadingData && (!customerHistory || customerHistory.length === 0)) {
        return (
            <div className="h-full pb-2">
                {isMobile ? (
                    <div className="h-full flex flex-col">
                        <div className="flex-1 overflow-y-auto py-2 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <Calendar className="h-8 w-8" />
                                <p className="text-sm">No hay historial de pedidos para este cliente</p>
                            </div>
                        </div>
                    </div>
                ) : (
                <Card className="h-full flex flex-col bg-transparent">
                    <CardHeader>
                        <CardTitle className="text-lg font-medium">Históricos de productos</CardTitle>
                        <CardDescription>Histórico de productos del cliente</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto py-2 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Calendar className="h-8 w-8" />
                            <p className="text-sm">No hay historial de pedidos para este cliente</p>
                        </div>
                    </CardContent>
                </Card>
                )}
            </div>
        )
    }

    const headerContent = (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                {!isMobile && (
                    <>
                            <CardTitle className="text-base font-medium">Histórico de Pedidos</CardTitle>
                            <CardDescription className="text-xs">Análisis completo del historial de compras del cliente</CardDescription>
                    </>
                )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            {isMobile ? (
                                <Tabs value={dateFilter === "year-select" && selectedYear ? `year-${selectedYear}` : dateFilter} onValueChange={(value) => {
                                    if (value === "month" || value === "quarter" || value === "year" || value === "year-1") {
                                        setDateFilter(value)
                                        setSelectedYear(null)
                                    } else if (value.startsWith("year-")) {
                                        const year = parseInt(value.replace("year-", ""))
                                        setSelectedYear(year)
                                        setDateFilter("year-select")
                                    }
                                }} className="w-full">
                                    <ScrollArea orientation="horizontal" className="w-full">
                                        <div className="flex">
                                            <TabsList className="w-max min-w-full flex gap-1.5 bg-transparent p-0 h-auto pl-2 pr-2">
                                                <TabsTrigger 
                                                    value="month" 
                                                    className="whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-none data-[state=inactive]:bg-muted/50 data-[state=inactive]:text-foreground/70 data-[state=inactive]:hover:bg-muted data-[state=inactive]:hover:text-foreground min-h-[32px] flex-shrink-0"
                                                >
                                                    Mes
                                                </TabsTrigger>
                                                <TabsTrigger 
                                                    value="quarter" 
                                                    className="whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-none data-[state=inactive]:bg-muted/50 data-[state=inactive]:text-foreground/70 data-[state=inactive]:hover:bg-muted data-[state=inactive]:hover:text-foreground min-h-[32px] flex-shrink-0"
                                                >
                                                    Trimestre
                                                </TabsTrigger>
                                                {hasCurrentYear && (
                                                    <TabsTrigger 
                                                        value="year" 
                                                        className="whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-none data-[state=inactive]:bg-muted/50 data-[state=inactive]:text-foreground/70 data-[state=inactive]:hover:bg-muted data-[state=inactive]:hover:text-foreground min-h-[32px] flex-shrink-0"
                                                    >
                                                        {currentYear}
                                                    </TabsTrigger>
                                                )}
                                                {hasYear1 && (
                                                    <TabsTrigger 
                                                        value="year-1" 
                                                        className="whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-none data-[state=inactive]:bg-muted/50 data-[state=inactive]:text-foreground/70 data-[state=inactive]:hover:bg-muted data-[state=inactive]:hover:text-foreground min-h-[32px] flex-shrink-0"
                                                    >
                                                        {currentYear - 1}
                                                    </TabsTrigger>
                                                )}
                                                {yearsForSelector.map(year => (
                                                    <TabsTrigger 
                                                        key={year}
                                                        value={`year-${year}`}
                                                        className="whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-none data-[state=inactive]:bg-muted/50 data-[state=inactive]:text-foreground/70 data-[state=inactive]:hover:bg-muted data-[state=inactive]:hover:text-foreground min-h-[32px] flex-shrink-0"
                                                    >
                                                        {year}
                                                    </TabsTrigger>
                                                ))}
                                            </TabsList>
                                        </div>
                                    </ScrollArea>
                                </Tabs>
                            ) : (
                                <>
                            <Tabs value={dateFilter} onValueChange={(value) => {
                                setDateFilter(value)
                                if (value !== "year-select") {
                                    setSelectedYear(null)
                                }
                            }} className="w-auto">
                                <TabsList 
                                    className="grid w-full h-8"
                                    style={{
                                        gridTemplateColumns: `repeat(${2 + (hasCurrentYear ? 1 : 0) + (hasYear1 ? 1 : 0)}, minmax(0, 1fr))`
                                    }}
                                >
                                    <TabsTrigger value="month" className="text-xs px-2">Mes</TabsTrigger>
                                    <TabsTrigger value="quarter" className="text-xs px-2">Trimestre</TabsTrigger>
                                    {hasCurrentYear && (
                                        <TabsTrigger value="year" className="text-xs px-2">{currentYear}</TabsTrigger>
                                    )}
                                    {hasYear1 && (
                                        <TabsTrigger value="year-1" className="text-xs px-2">{currentYear - 1}</TabsTrigger>
                                    )}
                                </TabsList>
                            </Tabs>
                            {yearsForSelector.length > 0 && (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8"
                                            aria-label="Más años"
                                        >
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-3" align="end">
                                        <Select
                                            value={dateFilter === "year-select" && selectedYear ? String(selectedYear) : ""}
                                            onValueChange={(value) => {
                                                setSelectedYear(parseInt(value))
                                                setDateFilter("year-select")
                                            }}
                                        >
                                            <SelectTrigger className="w-[140px] text-xs">
                                                <SelectValue placeholder="Seleccionar año" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {yearsForSelector.map(year => (
                                                    <SelectItem key={year} value={String(year)}>
                                                        {year}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </PopoverContent>
                                </Popover>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
    );

    const mainContent = isMobile ? (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {/* Métricas Generales */}
                {generalMetrics && (
                <div className="pb-3 pt-0 flex-shrink-0">
                    <div className="grid grid-cols-2 gap-2">
                        <Card className="p-3 border-2">
                            <div className="flex items-center gap-1 mb-1.5">
                                    <Package className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-xs font-medium text-muted-foreground">Total Pedidos</span>
                                </div>
                            <p className="text-base font-bold">{generalMetrics.totalOrders}</p>
                            </Card>
                        <Card className="p-3 border-2">
                            <div className="flex items-center gap-1 mb-1.5">
                                    <Coins className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-xs font-medium text-muted-foreground">Valor Total</span>
                                </div>
                            <p className="text-base font-bold">{formatDecimalCurrency(generalMetrics.totalAmount)}</p>
                            </Card>
                        <Card className="p-3 border-2">
                            <div className="flex items-center gap-1 mb-1.5">
                                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-xs font-medium text-muted-foreground">Frecuencia</span>
                                </div>
                            <p className="text-base font-bold">{generalMetrics.avgDaysBetween} días</p>
                            </Card>
                        <Card className="p-3 border-2">
                            <div className="flex items-center gap-1 mb-1.5">
                                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-xs font-medium text-muted-foreground">Último Pedido</span>
                                </div>
                            <p className="text-base font-bold">
                                    {generalMetrics.daysSinceLastOrder !== null 
                                        ? `Hace ${generalMetrics.daysSinceLastOrder} días`
                                        : "N/A"}
                                </p>
                            </Card>
                        </div>
                </div>
                )}

            <ScrollArea className="flex-1 min-h-0">
                {loadingData ? (
                    <div className="h-full flex items-center justify-center">
                        <Loader />
                    </div>
                ) : (
                    <div className="py-2">
                    {filteredHistory.length > maxProductsToShow && (
                        <div className="mb-3 flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                            <p className="text-xs text-muted-foreground">
                                Mostrando {maxProductsToShow} de {filteredHistory.length} productos
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setMaxProductsToShow(prev => prev + 10)}
                                className="h-7 text-xs"
                            >
                                Mostrar más (+10)
                            </Button>
                        </div>
                    )}
                    <div className="space-y-4">
                            {filteredHistory.slice(0, maxProductsToShow).map((product) => {
                                    const chartData = getChartDataByProduct(product)
                                    const trend = product.trend || calculateTrend(product)

                                    return (
                                        <Card key={product.product.id} className="border-2 rounded-lg shadow-md">
                                            <CardContent className="p-5 space-y-4">
                                                {/* Header del producto */}
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="font-semibold text-lg">{product.product.name}</h3>
                                                        {trend.direction !== "stable" && (
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Badge 
                                                                        variant={trend.direction === "up" ? "default" : "destructive"}
                                                                        className="flex items-center gap-1 text-xs h-6 px-2.5 cursor-help"
                                                                    >
                                                                        {trend.direction === "up" ? (
                                                                            <TrendingUp className="h-3 w-3" />
                                                                        ) : (
                                                                            <TrendingDown className="h-3 w-3" />
                                                                        )}
                                                                        {trend.percentage}%
                                                                    </Badge>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{getTrendTooltipText()}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center flex-wrap gap-1.5">
                                                        <Badge variant="outline" className="flex items-center gap-1 text-xs h-6 px-2.5">
                                                            <Calendar className="h-3 w-3" />
                                                            <span>Último: {formatDateShort(product.last_order_date)}</span>
                                                        </Badge>
                                                        {product.lines.length > 0 && (
                                                            <Badge variant="outline" className="flex items-center gap-1 text-xs h-6 px-2.5">
                                                                <Package className="h-3 w-3" />
                                                                <span>{product.lines.length} pedidos</span>
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    {/* Métricas */}
                                                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm pt-2 border-t">
                                                        <div className="flex flex-col">
                                                            <span className="text-muted-foreground text-xs font-medium">Cajas Totales</span>
                                                            <span className="font-semibold text-base">{formatInteger(product.total_boxes)}</span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-muted-foreground text-xs font-medium">Peso Neto</span>
                                                            <span className="font-semibold text-base">{formatDecimalWeight(product.total_net_weight)}</span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-muted-foreground text-xs font-medium">Precio Medio</span>
                                                            <span className="font-semibold text-base">{formatDecimalCurrency(product.average_unit_price)}</span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-muted-foreground text-xs font-medium">Importe Total</span>
                                                            <span className="font-semibold text-base">{formatDecimalCurrency(product.total_amount)}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Gráficas */}
                                                <div className="flex flex-col gap-4 w-full pt-2">
                                                    <Card className="w-full h-48 border-2 flex flex-col overflow-hidden">
                                                        <CardHeader className="pb-2 px-4 pt-3 flex-shrink-0">
                                                            <CardTitle className="text-sm font-semibold">Evolución de precio</CardTitle>
                                                        </CardHeader>
                                                        <CardContent className="flex-1 min-h-0 pt-0 px-3 w-full text-primary/50">
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <AreaChart data={chartData}>
                                                                    <defs>
                                                                        <linearGradient id={`colorPrice-mobile-${product.product.id}`} x1="0" y1="0" x2="0" y2="1">
                                                                            <stop offset="5%" stopColor="currentColor" stopOpacity={0.8} />
                                                                            <stop offset="95%" stopColor="currentColor" stopOpacity={0} />
                                                                        </linearGradient>
                                                                    </defs>
                                                                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                                                                    <YAxis tick={{ fontSize: 11 }} />
                                                                    <RechartsTooltip content={<CustomTooltip isCurrency />} />
                                                                    <Area type="monotone" dataKey="unit_price" stroke="currentColor" strokeWidth={2.5} fillOpacity={1} fill={`url(#colorPrice-mobile-${product.product.id})`} />
                                                                </AreaChart>
                                                            </ResponsiveContainer>
                                                        </CardContent>
                                                    </Card>

                                                    <Card className="w-full h-48 border-2 flex flex-col overflow-hidden">
                                                        <CardHeader className="pb-2 px-4 pt-3 flex-shrink-0">
                                                            <CardTitle className="text-sm font-semibold">Evolución de peso</CardTitle>
                                                        </CardHeader>
                                                        <CardContent className="flex-1 min-h-0 pt-0 px-3 text-primary/50">
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <AreaChart data={chartData}>
                                                                    <defs>
                                                                        <linearGradient id={`colorWeight-mobile-${product.product.id}`} x1="0" y1="0" x2="0" y2="1">
                                                                            <stop offset="5%" stopColor="currentColor" stopOpacity={0.8} />
                                                                            <stop offset="95%" stopColor="currentColor" stopOpacity={0} />
                                                                        </linearGradient>
                                                                    </defs>
                                                                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                                                                    <YAxis tick={{ fontSize: 11 }} />
                                                                    <RechartsTooltip content={<CustomTooltip />} />
                                                                    <Line type="monotone" dataKey="net_weight" stroke="currentColor" strokeWidth={2.5} dot={{ r: 1.5 }} />
                                                                    <Area type="monotone" dataKey="net_weight" stroke="currentColor" strokeWidth={2.5} fillOpacity={1} fill={`url(#colorWeight-mobile-${product.product.id})`} />
                                                                </AreaChart>
                                                            </ResponsiveContainer>
                                                        </CardContent>
                                                    </Card>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                    </div>
                </div>
                )}
            </ScrollArea>
        </div>
    ) : (
        <>
            {/* Métricas Generales */}
            {generalMetrics && (
                <div className="pb-3 pt-0">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <Card className="p-3">
                            <div className="flex items-center gap-1.5 mb-1">
                                <Package className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Total Pedidos</span>
                            </div>
                            <p className="text-xl font-semibold">{generalMetrics.totalOrders}</p>
                        </Card>
                        <Card className="p-3">
                            <div className="flex items-center gap-1.5 mb-1">
                                <Coins className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Valor Total</span>
                            </div>
                            <p className="text-xl font-semibold">{formatDecimalCurrency(generalMetrics.totalAmount)}</p>
                        </Card>
                        <Card className="p-3">
                            <div className="flex items-center gap-1.5 mb-1">
                                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Frecuencia</span>
                            </div>
                            <p className="text-xl font-semibold">{generalMetrics.avgDaysBetween} días</p>
                        </Card>
                        <Card className="p-3">
                            <div className="flex items-center gap-1.5 mb-1">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Último Pedido</span>
                            </div>
                            <p className="text-base font-semibold">
                                {generalMetrics.daysSinceLastOrder !== null 
                                    ? `Hace ${generalMetrics.daysSinceLastOrder} días`
                                    : "N/A"}
                            </p>
                        </Card>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto py-2">
                        <Accordion type="multiple" value={expandedItems} onValueChange={setExpandedItems} className="space-y-3">
                        {filteredHistory.slice(0, maxProductsToShow).map((product) => {
                            const chartData = getChartDataByProduct(product)
                            const trend = product.trend || calculateTrend(product)

                            return (
                                <AccordionItem key={product.product.id} value={product.product.id.toString()} className="border rounded-lg overflow-hidden shadow-sm">
                                    <AccordionTrigger className="px-4 py-3 hover:bg-muted/50 transition-colors [&>svg]:transition-transform no-underline hover:no-underline">
                                        <div className="flex flex-col md:flex-row w-full items-start md:items-center justify-between gap-3 text-left">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="font-medium text-base">{product.product.name}</h3>
                                                    {trend.direction !== "stable" && (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Badge 
                                                                    variant={trend.direction === "up" ? "default" : "destructive"}
                                                                    className="flex items-center gap-1 text-xs h-5 cursor-help"
                                                                >
                                                                    {trend.direction === "up" ? (
                                                                        <TrendingUp className="h-2.5 w-2.5" />
                                                                    ) : (
                                                                        <TrendingDown className="h-2.5 w-2.5" />
                                                                    )}
                                                                    {trend.percentage}%
                                                                </Badge>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>{getTrendTooltipText()}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                </div>
                                                <div className="flex items-center mt-1 flex-wrap gap-1.5">
                                                    <Badge variant="outline" className="flex items-center gap-1 text-xs h-5 px-2">
                                                        <Calendar className="h-2.5 w-2.5" />
                                                        <span>Último: {formatDateShort(product.last_order_date)}</span>
                                                    </Badge>
                                                    {product.lines.length > 0 && (
                                                        <Badge variant="outline" className="flex items-center gap-1 text-xs h-5 px-2">
                                                            <Package className="h-2.5 w-2.5" />
                                                            <span>{product.lines.length} pedidos</span>
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-xs pr-4">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-muted-foreground text-xs">Cajas Totales</span>
                                                    <span className="font-medium text-sm">{formatInteger(product.total_boxes)}</span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-muted-foreground text-xs">Peso Neto</span>
                                                    <span className="font-medium text-sm">{formatDecimalWeight(product.total_net_weight)}</span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-muted-foreground text-xs">Precio Medio</span>
                                                    <span className="font-medium text-sm">{formatDecimalCurrency(product.average_unit_price)}</span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-muted-foreground text-xs">Importe Total</span>
                                                    <span className="font-medium text-sm">{formatDecimalCurrency(product.total_amount)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="p-3 space-y-3 w-full">
                                        <div className="grid grid-cols-2 gap-3 w-full">
                                            <Card className="w-full h-40 shadow-sm">
                                                <CardHeader className="pb-1 px-3 pt-2">
                                                    <CardTitle className="text-xs font-medium">Evolución de precio</CardTitle>
                                                </CardHeader>
                                                <CardContent className="h-full pt-0 px-2 w-full text-primary/50">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <AreaChart data={chartData}>
                                                            <defs>
                                                                <linearGradient id={`colorPrice-${product.product.id}`} x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="5%" stopColor="currentColor" stopOpacity={0.8} />
                                                                    <stop offset="95%" stopColor="currentColor" stopOpacity={0} />
                                                                </linearGradient>
                                                            </defs>
                                                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                                                            <YAxis tick={{ fontSize: 10 }} />
                                                            <RechartsTooltip content={<CustomTooltip isCurrency />} />
                                                            <Area type="monotone" dataKey="unit_price" stroke="currentColor" strokeWidth={2} fillOpacity={1} fill={`url(#colorPrice-${product.product.id})`} />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </CardContent>
                                            </Card>

                                            <Card className="w-full h-40 shadow-sm">
                                                <CardHeader className="pb-1 px-3 pt-2">
                                                    <CardTitle className="text-xs font-medium">Evolución de peso</CardTitle>
                                                </CardHeader>
                                                <CardContent className="h-full pt-0 px-2 text-primary/50">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <AreaChart data={chartData}>
                                                            <defs>
                                                                <linearGradient id={`colorWeight-${product.product.id}`} x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="5%" stopColor="currentColor" stopOpacity={0.8} />
                                                                    <stop offset="95%" stopColor="currentColor" stopOpacity={0} />
                                                                </linearGradient>
                                                            </defs>
                                                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                                                            <YAxis tick={{ fontSize: 10 }} />
                                                            <RechartsTooltip content={<CustomTooltip />} />
                                                            <Line type="monotone" dataKey="net_weight" stroke="currentColor" strokeWidth={2} dot={{ r: 1 }} />
                                                            <Area type="monotone" dataKey="net_weight" stroke="currentColor" strokeWidth={2} fillOpacity={1} fill={`url(#colorWeight-${product.product.id})`} />
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
            </div>
        </>
    );

    return (
        <TooltipProvider>
            <div className="flex-1 flex flex-col min-h-0">
                {isMobile ? (
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="mb-4 flex-shrink-0">
                            {headerContent}
                        </div>
                        {mainContent}
                    </div>
                ) : (
                    <Card className="h-full flex flex-col bg-transparent">
                        <CardHeader className="pb-2">
                            {headerContent}
                        </CardHeader>
                        {generalMetrics && (
                            <CardContent className="pb-3 pt-0">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    <Card className="p-3">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <Package className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span className="text-xs text-muted-foreground">Total Pedidos</span>
                                        </div>
                                        <p className="text-xl font-semibold">{generalMetrics.totalOrders}</p>
                                    </Card>
                                    <Card className="p-3">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <Coins className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span className="text-xs text-muted-foreground">Valor Total</span>
                                        </div>
                                        <p className="text-xl font-semibold">{formatDecimalCurrency(generalMetrics.totalAmount)}</p>
                                    </Card>
                                    <Card className="p-3">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span className="text-xs text-muted-foreground">Frecuencia</span>
                                        </div>
                                        <p className="text-xl font-semibold">{generalMetrics.avgDaysBetween} días</p>
                                    </Card>
                                    <Card className="p-3">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span className="text-xs text-muted-foreground">Último Pedido</span>
                                        </div>
                                        <p className="text-base font-semibold">
                                            {generalMetrics.daysSinceLastOrder !== null 
                                                ? `Hace ${generalMetrics.daysSinceLastOrder} días`
                                                : "N/A"}
                                        </p>
                                    </Card>
                                </div>
                            </CardContent>
                        )}
                        <CardContent className="flex-1 overflow-y-auto py-2">
                            {loadingData ? (
                                <div className="h-full flex items-center justify-center">
                                    <Loader />
                                </div>
                            ) : (
                                <>
                                    {filteredHistory.length > maxProductsToShow && (
                                        <div className="mb-3 flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                                            <p className="text-xs text-muted-foreground">
                                                Mostrando {maxProductsToShow} de {filteredHistory.length} productos
                                            </p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setMaxProductsToShow(prev => prev + 10)}
                                                className="h-7 text-xs"
                                            >
                                                Mostrar más (+10)
                                            </Button>
                                        </div>
                                    )}
                                    <Accordion type="multiple" value={expandedItems} onValueChange={setExpandedItems} className="space-y-3">
                                {filteredHistory.slice(0, maxProductsToShow).map((product) => {
                                    const chartData = getChartDataByProduct(product)
                                    // Usar trend del backend si está disponible, sino calcularlo
                                    const trend = product.trend || calculateTrend(product)

                                    return (
                                        <AccordionItem key={product.product.id} value={product.product.id.toString()} className={isMobile ? "border-2 rounded-lg overflow-hidden shadow-md" : "border rounded-lg overflow-hidden shadow-sm"}>
                                            <AccordionTrigger className={isMobile ? "px-5 py-4 hover:bg-muted/50 transition-colors [&>svg]:transition-transform no-underline hover:no-underline" : "px-4 py-3 hover:bg-muted/50 transition-colors [&>svg]:transition-transform no-underline hover:no-underline"}>
                                                <div className="flex flex-col md:flex-row w-full items-start md:items-center justify-between gap-3 text-left">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <h3 className={isMobile ? "font-semibold text-lg" : "font-medium text-base"}>{product.product.name}</h3>
                                                            {trend.direction !== "stable" && (
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Badge 
                                                                            variant={trend.direction === "up" ? "default" : "destructive"}
                                                                            className={isMobile ? "flex items-center gap-1 text-xs h-6 px-2.5 cursor-help" : "flex items-center gap-1 text-xs h-5 cursor-help"}
                                                                        >
                                                                            {trend.direction === "up" ? (
                                                                                <TrendingUp className={isMobile ? "h-3 w-3" : "h-2.5 w-2.5"} />
                                                                            ) : (
                                                                                <TrendingDown className={isMobile ? "h-3 w-3" : "h-2.5 w-2.5"} />
                                                                            )}
                                                                            {trend.percentage}%
                                                                        </Badge>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>{getTrendTooltipText()}</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            )}
                                                        </div>
                                                        <div className={`flex items-center ${isMobile ? 'mt-2' : 'mt-1'} flex-wrap gap-1.5`}>
                                                            <Badge variant="outline" className={isMobile ? "flex items-center gap-1 text-xs h-6 px-2.5" : "flex items-center gap-1 text-xs h-5 px-2"}>
                                                                <Calendar className={isMobile ? "h-3 w-3" : "h-2.5 w-2.5"} />
                                                                <span>Último: {formatDateShort(product.last_order_date)}</span>
                                                            </Badge>
                                                            {product.lines.length > 0 && (
                                                                <Badge variant="outline" className={isMobile ? "flex items-center gap-1 text-xs h-6 px-2.5" : "flex items-center gap-1 text-xs h-5 px-2"}>
                                                                    <Package className={isMobile ? "h-3 w-3" : "h-2.5 w-2.5"} />
                                                                    <span>{product.lines.length} pedidos</span>
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className={`grid grid-cols-2 md:grid-cols-4 ${isMobile ? 'gap-x-6 gap-y-2' : 'gap-x-4 gap-y-1'} ${isMobile ? 'text-sm' : 'text-xs'} ${isMobile ? 'pr-0' : 'pr-4'}`}>
                                                        <div className="flex flex-col items-end">
                                                            <span className={`text-muted-foreground ${isMobile ? 'text-xs font-medium' : 'text-xs'}`}>Cajas Totales</span>
                                                            <span className={isMobile ? "font-semibold text-base" : "font-medium text-sm"}>{formatInteger(product.total_boxes)}</span>
                                                        </div>
                                                        <div className="flex flex-col items-end">
                                                            <span className={`text-muted-foreground ${isMobile ? 'text-xs font-medium' : 'text-xs'}`}>Peso Neto</span>
                                                            <span className={isMobile ? "font-semibold text-base" : "font-medium text-sm"}>{formatDecimalWeight(product.total_net_weight)}</span>
                                                        </div>
                                                        <div className="flex flex-col items-end">
                                                            <span className={`text-muted-foreground ${isMobile ? 'text-xs font-medium' : 'text-xs'}`}>Precio Medio</span>
                                                            <span className={isMobile ? "font-semibold text-base" : "font-medium text-sm"}>{formatDecimalCurrency(product.average_unit_price)}</span>
                                                        </div>
                                                        <div className="flex flex-col items-end">
                                                            <span className={`text-muted-foreground ${isMobile ? 'text-xs font-medium' : 'text-xs'}`}>Importe Total</span>
                                                            <span className={isMobile ? "font-semibold text-base" : "font-medium text-sm"}>{formatDecimalCurrency(product.total_amount)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className={isMobile ? "p-4 space-y-3 w-full" : "p-3 space-y-3 w-full"}>
                                                <div className={`grid grid-cols-2 ${isMobile ? 'gap-4' : 'gap-3'} w-full`}>
                                                    <Card className={`w-full ${isMobile ? 'h-48 border-2' : 'h-40 shadow-sm'}`}>
                                                        <CardHeader className={isMobile ? "pb-2 px-4 pt-3" : "pb-1 px-3 pt-2"}>
                                                            <CardTitle className={isMobile ? "text-sm font-semibold" : "text-xs font-medium"}>Evolución de precio</CardTitle>
                                                        </CardHeader>
                                                        <CardContent className={`h-full pt-0 ${isMobile ? 'px-3' : 'px-2'} w-full text-primary/50`}>
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <AreaChart data={chartData}>
                                                                    <defs>
                                                                        <linearGradient id={`colorPrice-${product.product.id}`} x1="0" y1="0" x2="0" y2="1">
                                                                            <stop offset="5%" stopColor="currentColor" stopOpacity={0.8} />
                                                                            <stop offset="95%" stopColor="currentColor" stopOpacity={0} />
                                                                        </linearGradient>
                                                                    </defs>
                                                                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                                                                    <YAxis tick={{ fontSize: isMobile ? 11 : 10 }} />
                                                                    <RechartsTooltip content={<CustomTooltip isCurrency />} />
                                                                    <Area type="monotone" dataKey="unit_price" stroke="currentColor" strokeWidth={isMobile ? 2.5 : 2} fillOpacity={1} fill={`url(#colorPrice-${product.product.id})`} />
                                                                </AreaChart>
                                                            </ResponsiveContainer>
                                                        </CardContent>
                                                    </Card>

                                                    <Card className={`w-full ${isMobile ? 'h-48 border-2' : 'h-40 shadow-sm'}`}>
                                                        <CardHeader className={isMobile ? "pb-2 px-4 pt-3" : "pb-1 px-3 pt-2"}>
                                                            <CardTitle className={isMobile ? "text-sm font-semibold" : "text-xs font-medium"}>Evolución de peso</CardTitle>
                                                        </CardHeader>
                                                        <CardContent className={`h-full pt-0 ${isMobile ? 'px-3' : 'px-2'} text-primary/50`}>
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <AreaChart data={chartData}>
                                                                    <defs>
                                                                        <linearGradient id={`colorWeight-${product.product.id}`} x1="0" y1="0" x2="0" y2="1">
                                                                            <stop offset="5%" stopColor="currentColor" stopOpacity={0.8} />
                                                                            <stop offset="95%" stopColor="currentColor" stopOpacity={0} />
                                                                        </linearGradient>
                                                                    </defs>
                                                                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                                                                    <YAxis tick={{ fontSize: isMobile ? 11 : 10 }} />
                                                                    <RechartsTooltip content={<CustomTooltip />} />
                                                                    <Line type="monotone" dataKey="net_weight" stroke="currentColor" strokeWidth={isMobile ? 2.5 : 2} dot={{ r: isMobile ? 1.5 : 1 }} />
                                                                    <Area type="monotone" dataKey="net_weight" stroke="currentColor" strokeWidth={isMobile ? 2.5 : 2} fillOpacity={1} fill={`url(#colorWeight-${product.product.id})`} />
                                                                </AreaChart>
                                                            </ResponsiveContainer>
                </CardContent>
            </Card>
                                                </div>

                                                <Card className={isMobile ? "overflow-x-auto border-2" : "overflow-x-auto"}>
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead className={isMobile ? "text-sm" : ""}>ID Pedido</TableHead>
                                                                <TableHead className={isMobile ? "text-sm" : ""}>Fecha de carga</TableHead>
                                                                <TableHead className={`text-right ${isMobile ? "text-sm" : ""}`}>Cajas</TableHead>
                                                                <TableHead className={`text-right ${isMobile ? "text-sm" : ""}`}>Peso Neto</TableHead>
                                                                <TableHead className={`text-right ${isMobile ? "text-sm" : ""}`}>Precio Unitario</TableHead>
                                                                <TableHead className={`text-right ${isMobile ? "text-sm" : ""}`}>Subtotal</TableHead>
                                                                <TableHead className={`text-right ${isMobile ? "text-sm" : ""}`}>Total</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {product.lines.map((order) => (
                                                                <TableRow key={order.order_id}>
                                                                    <TableCell className={isMobile ? "font-semibold text-sm" : "font-medium"}>{order.formatted_id}</TableCell>
                                                                    <TableCell className={isMobile ? "text-sm" : ""}>{formatDateShort(order.load_date)}</TableCell>
                                                                    <TableCell className={`text-right ${isMobile ? "text-sm font-medium" : ""}`}>{order.boxes}</TableCell>
                                                                    <TableCell className={`text-right ${isMobile ? "text-sm font-medium" : ""}`}>{formatDecimalWeight(order.net_weight)}</TableCell>
                                                                    <TableCell className={`text-right ${isMobile ? "text-sm font-medium" : ""}`}>{formatDecimalCurrency(Number(order.unit_price))}</TableCell>
                                                                    <TableCell className={`text-right ${isMobile ? "text-sm font-medium" : ""}`}>{formatDecimalCurrency(order.subtotal)}</TableCell>
                                                                    <TableCell className={`text-right ${isMobile ? "text-sm font-semibold" : ""}`}>{formatDecimalCurrency(order.total)}</TableCell>
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
                                </>
                            )}
                        </CardContent>
                    </Card>
                )}
        </div>
        </TooltipProvider>
    )
}
