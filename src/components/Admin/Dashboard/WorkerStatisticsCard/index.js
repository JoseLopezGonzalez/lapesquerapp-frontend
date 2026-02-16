"use client"

import { notify } from "@/lib/notifications"
import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { usePunchesStatistics } from "@/hooks/usePunches"
import { DateRangePicker } from "@/components/ui/dateRangePicker"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { startOfMonth, endOfMonth, format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { 
    BarChart3, 
    Clock, 
    TrendingUp, 
    TrendingDown, 
    Calendar, 
    Users, 
    Activity, 
    AlertTriangle,
    CheckCircle2,
    Info,
    ArrowUp,
    ArrowDown,
    Medal,
    XCircle
} from "lucide-react"

// Inicializar con el mes actual
const getInitialDateRange = () => {
    const today = new Date()
    return {
        from: startOfMonth(today),
        to: endOfMonth(today)
    }
}

export function WorkerStatisticsCard() {
    const [dateRange, setDateRange] = useState(getInitialDateRange)
    const { data, isLoading, isError, error } = usePunchesStatistics(dateRange)

    useEffect(() => {
        if (isError && error) {
            const errorMessage = error.userMessage || error.message || 'Error al obtener las estadísticas'
            notify.error(errorMessage)
        }
    }, [isError, error])

    // Formatear horas
    const formatHours = (hours) => {
        if (!hours && hours !== 0) return "0h"
        const h = Math.floor(hours)
        const m = Math.round((hours - h) * 60)
        // Si no hay horas, solo mostrar minutos
        if (h === 0) return m > 0 ? `${m}m` : "0m"
        // Si no hay minutos, solo mostrar horas
        if (m === 0) return `${h}h`
        // Si hay ambos, mostrar ambos
        return `${h}h ${m}m`
    }

    // Formatear porcentaje
    const formatPercentage = (value) => {
        if (value === null || value === undefined) return "0%"
        const sign = value >= 0 ? "+" : ""
        return `${sign}${value.toFixed(2)}%`
    }

    // Formatear fecha
    const formatDate = (dateString) => {
        if (!dateString) return ""
        try {
            return format(parseISO(dateString), 'dd/MM/yyyy')
        } catch {
            return dateString
        }
    }

    // Formatear fecha descriptiva (para días activos) - formato texto completo
    const formatDateShort = (dateString) => {
        if (!dateString) return ""
        try {
            const formatted = format(parseISO(dateString), 'EEEE d \'de\' MMMM', { locale: es })
            // Capitalizar primera letra de cada palabra (día y mes)
            return formatted.split(' ').map(word => {
                // Si es "de", mantenerlo en minúscula
                if (word === 'de') return word
                return word.charAt(0).toUpperCase() + word.slice(1)
            }).join(' ')
        } catch {
            return dateString
        }
    }

    // Obtener color para variación
    const getVariationColor = (value) => {
        if (value > 0) return "text-green-600 dark:text-green-400"
        if (value < 0) return "text-red-600 dark:text-red-400"
        return "text-muted-foreground"
    }

    // Obtener icono para variación
    const getVariationIcon = (value) => {
        if (value > 0) return TrendingUp
        if (value < 0) return TrendingDown
        return Activity
    }

    if (isLoading) {
        return (
            <Card className="w-full max-w-full overflow-hidden">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <Skeleton className="h-6 w-48 mb-2" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                        <Skeleton className="h-9 w-32" />
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-8 w-full" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        )
    }

    const periodData = data?.period || {}
    const definitions = data?.definitions || {}
    const workData = data?.work || {}
    const activityData = data?.activity || {}
    const incidentsData = data?.incidents || {}
    const anomaliesData = data?.anomalies || {}
    const contextData = data?.context || {}

    const hoursVariation = workData.hours_variation || 0
    const hoursVariationPercentage = workData.hours_variation_percentage || 0
    const VariationIcon = getVariationIcon(hoursVariation)

    return (
        <Card className="w-full max-w-full overflow-hidden min-w-0">
            <CardHeader className="pb-3 min-w-0">
                <div className="flex items-center justify-between gap-4 mb-3 min-w-0">
                    <div className="space-y-1 flex-1 min-w-0">
                        <CardTitle className="text-base flex items-center gap-2 min-w-0">
                            <BarChart3 className="w-4 h-4 text-primary flex-shrink-0" />
                            <span className="truncate">Estadísticas de Trabajadores</span>
                        </CardTitle>
                        <CardDescription className="text-xs truncate">
                            {periodData.label || "Período seleccionado"}
                        </CardDescription>
                    </div>
                </div>
                
                {/* Selector de rango de fechas */}
                <div className="w-full min-w-0 max-w-full overflow-hidden">
                    <DateRangePicker 
                        dateRange={dateRange} 
                        onChange={setDateRange}
                    />
                </div>
            </CardHeader>

            <CardContent className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto min-w-0">
                {/* Estadísticas de Trabajo */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b">
                        <Clock className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold">Horas Trabajadas</span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 min-w-0">
                        <div className="p-2 sm:p-3 rounded-lg bg-muted/50 border min-w-0">
                            <div className="text-xs text-muted-foreground mb-1 truncate">Total de Horas</div>
                            <div className="text-base sm:text-lg font-bold truncate">{formatHours(workData.total_hours || 0)}</div>
                        </div>
                        <div className="p-2 sm:p-3 rounded-lg bg-muted/50 border min-w-0">
                            <div className="text-xs text-muted-foreground mb-1 truncate">Promedio por Empleado</div>
                            <div className="text-base sm:text-lg font-bold truncate">{formatHours(workData.average_hours_per_employee || 0)}</div>
                        </div>
                    </div>

                    {/* Variación de horas */}
                    {workData.previous_period_hours !== undefined && (
                        <div className="p-2 sm:p-3 rounded-lg border bg-gradient-to-br from-card to-muted/20 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-2 min-w-0">
                                <span className="text-xs text-muted-foreground truncate flex-1 min-w-0">Variación respecto al período anterior</span>
                                <div className={`flex items-center gap-1 flex-shrink-0 ${getVariationColor(hoursVariationPercentage)}`}>
                                    <VariationIcon className="w-3.5 h-3.5" />
                                    <span className="text-xs sm:text-sm font-semibold whitespace-nowrap">{formatPercentage(hoursVariationPercentage)}</span>
                                </div>
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                                Período anterior: {formatHours(workData.previous_period_hours || 0)}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                                Diferencia: {hoursVariation >= 0 ? "+" : ""}{formatHours(Math.abs(hoursVariation))}
                            </div>
                        </div>
                    )}

                    {/* Breakdown: Top y Bottom empleados */}
                    {workData.breakdown && (
                        <div className="space-y-2 pt-2 border-t">
                            <div className="text-xs font-semibold text-muted-foreground mb-2">Ranking de Horas</div>
                            
                            {/* Top empleados */}
                            {workData.breakdown.top_employees && workData.breakdown.top_employees.length > 0 && (
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <ArrowUp className="w-3 h-3 text-green-600 dark:text-green-400" />
                                        <span>Top trabajadores</span>
                                    </div>
                                    <div className="space-y-1">
                                        {workData.breakdown.top_employees.map((emp, idx) => (
                                            <div key={emp.employee_id} className="flex items-center justify-between gap-2 p-2 rounded-md bg-green-500/5 border border-green-500/20 min-w-0">
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    <Medal className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                                                    <span className="text-xs font-medium truncate">{emp.employee_name}</span>
                                                </div>
                                                <span className="text-xs font-bold whitespace-nowrap flex-shrink-0">{formatHours(emp.total_hours)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Bottom empleados */}
                            {workData.breakdown.bottom_employees && workData.breakdown.bottom_employees.length > 0 && (
                                <div className="space-y-1.5 pt-2">
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <ArrowDown className="w-3 h-3 text-red-600 dark:text-red-400" />
                                        <span>Menos horas</span>
                                    </div>
                                    <div className="space-y-1">
                                        {workData.breakdown.bottom_employees.map((emp) => (
                                            <div key={emp.employee_id} className="flex items-center justify-between gap-2 p-2 rounded-md bg-red-500/5 border border-red-500/20 min-w-0">
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    <XCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400 flex-shrink-0" />
                                                    <span className="text-xs font-medium truncate">{emp.employee_name}</span>
                                                </div>
                                                <span className="text-xs font-bold whitespace-nowrap flex-shrink-0">{formatHours(emp.total_hours)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Actividad */}
                <div className="space-y-3 pt-3 border-t">
                    <div className="flex items-center gap-2 pb-2">
                        <Activity className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold">Actividad</span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2 min-w-0">
                        <div className="p-2 sm:p-2 rounded-lg bg-muted/50 border text-center min-w-0">
                            <div className="text-xs sm:text-[10px] text-muted-foreground mb-1 uppercase tracking-wide truncate">Días Activos</div>
                            <div className="text-base sm:text-base font-bold truncate">{activityData.days_with_activity || 0}</div>
                        </div>
                        <div className="p-2 sm:p-2 rounded-lg bg-muted/50 border text-center min-w-0">
                            <div className="text-xs sm:text-[10px] text-muted-foreground mb-1 uppercase tracking-wide truncate">Horas/Día</div>
                            <div className="text-base sm:text-base font-bold truncate">{formatHours(activityData.average_hours_per_day || 0)}</div>
                        </div>
                        <div className="p-2 sm:p-2 rounded-lg bg-muted/50 border text-center min-w-0">
                            <div className="text-xs sm:text-[10px] text-muted-foreground mb-1 uppercase tracking-wide truncate">Promedio/Trab.</div>
                            <div className="text-base sm:text-base font-bold truncate">{formatHours(activityData.average_hours_per_day_per_employee || 0)}</div>
                        </div>
                    </div>

                    {/* Breakdown de actividad */}
                    {activityData.breakdown && (
                        <div className="space-y-3 pt-2 border-t">
                            {/* Días más activos */}
                            {activityData.breakdown.most_active_days && activityData.breakdown.most_active_days.length > 0 && (
                                <div className="space-y-1.5">
                                    <div className="text-xs font-semibold text-muted-foreground">Días más activos</div>
                                    <div className="space-y-2">
                                        {activityData.breakdown.most_active_days.map((day) => (
                                            <div key={day.date} className="rounded-md bg-muted/30 border text-xs overflow-hidden min-w-0">
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2 p-2 min-w-0">
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        <Calendar className="w-3 h-3 flex-shrink-0" />
                                                        <span className="font-medium truncate text-[10px] sm:text-xs">{formatDateShort(day.date)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
                                                        <span className="text-muted-foreground text-[9px] sm:text-xs truncate sm:whitespace-nowrap">{day.employees_count || 0} empleados</span>
                                                        <Badge variant="secondary" className="text-[9px] sm:text-[10px] font-bold whitespace-nowrap">
                                                            {formatHours(day.average_hours_per_employee || 0)}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                {day.employees && day.employees.length > 0 && (
                                                    <div className="px-2 pb-2 space-y-1 border-t border-muted/50 pt-2 min-w-0">
                                                        {day.employees.slice(0, 5).map((emp) => (
                                                            <div key={emp.employee_id} className="flex items-center justify-between gap-2 text-[10px] min-w-0">
                                                                <span className="text-muted-foreground truncate flex-1 min-w-0">{emp.employee_name}</span>
                                                                <span className="font-medium whitespace-nowrap flex-shrink-0">{formatHours(emp.hours || 0)}</span>
                                                            </div>
                                                        ))}
                                                        {day.employees.length > 5 && (
                                                            <div className="text-[10px] text-muted-foreground text-center pt-1">
                                                                +{day.employees.length - 5} más
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Días menos activos */}
                            {activityData.breakdown.least_active_days && activityData.breakdown.least_active_days.length > 0 && (
                                <div className="space-y-1.5 pt-2">
                                    <div className="text-xs font-semibold text-muted-foreground">Días menos activos</div>
                                    <div className="space-y-2">
                                        {activityData.breakdown.least_active_days.map((day) => (
                                            <div key={day.date} className="rounded-md bg-muted/30 border text-xs overflow-hidden min-w-0">
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2 p-2 min-w-0">
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        <Calendar className="w-3 h-3 flex-shrink-0" />
                                                        <span className="font-medium truncate text-[10px] sm:text-xs">{formatDateShort(day.date)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
                                                        <span className="text-muted-foreground text-[9px] sm:text-xs truncate sm:whitespace-nowrap">{day.employees_count || 0} empleados</span>
                                                        <Badge variant="secondary" className="text-[9px] sm:text-[10px] font-bold whitespace-nowrap">
                                                            {formatHours(day.average_hours_per_employee || 0)}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                {day.employees && day.employees.length > 0 && (
                                                    <div className="px-2 pb-2 space-y-1 border-t border-muted/50 pt-2 min-w-0">
                                                        {day.employees.slice(0, 5).map((emp) => (
                                                            <div key={emp.employee_id} className="flex items-center justify-between gap-2 text-[10px] min-w-0">
                                                                <span className="text-muted-foreground truncate flex-1 min-w-0">{emp.employee_name}</span>
                                                                <span className="font-medium whitespace-nowrap flex-shrink-0">{formatHours(emp.hours || 0)}</span>
                                                            </div>
                                                        ))}
                                                        {day.employees.length > 5 && (
                                                            <div className="text-[10px] text-muted-foreground text-center pt-1">
                                                                +{day.employees.length - 5} más
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Incidencias */}
                <div className="space-y-3 pt-3 border-t">
                    <div className="flex items-center gap-2 pb-2">
                        <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        <span className="text-sm font-semibold">Incidencias</span>
                        {definitions.incident && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                        <p className="font-semibold mb-1">{definitions.incident.title}</p>
                                        <p className="text-xs">{definitions.incident.description}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                    
                    <div className={`p-2 sm:p-3 rounded-lg border min-w-0 ${incidentsData.open_incidents_count > 0 ? 'bg-orange-500/10 border-orange-500/20' : 'bg-muted/50'}`}>
                        <div className="flex items-center justify-between gap-2 mb-2 min-w-0">
                            <div className="min-w-0 flex-1">
                                <div className="text-xs text-muted-foreground mb-1 truncate">Incidencias Abiertas</div>
                                <div className="text-base sm:text-lg font-bold truncate">{incidentsData.open_incidents_count || 0}</div>
                            </div>
                            {incidentsData.open_incidents_count > 0 ? (
                                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                            ) : (
                                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                            )}
                        </div>
                    </div>

                    {/* Detalles de incidencias */}
                    {incidentsData.details && incidentsData.details.length > 0 && (
                        <div className="space-y-1.5 pt-2">
                            <div className="text-xs font-semibold text-muted-foreground">Detalles</div>
                            <div className="space-y-1 max-h-48 overflow-y-auto">
                                {incidentsData.details.map((incident, idx) => (
                                    <div key={idx} className="p-2 rounded-md bg-orange-500/5 border border-orange-500/20 text-xs min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-1 min-w-0">
                                            <span className="font-semibold truncate flex-1 min-w-0">{incident.employee_name}</span>
                                            <Badge variant="outline" className="text-[10px] bg-orange-500/10 border-orange-500/20 flex-shrink-0 whitespace-nowrap">
                                                {formatDate(incident.date)}
                                            </Badge>
                                        </div>
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 text-muted-foreground min-w-0">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <Clock className="w-3 h-3 flex-shrink-0" />
                                                <span className="truncate text-xs">Entrada: {incident.entry_time}</span>
                                            </div>
                                            {incident.device_id && (
                                                <span className="text-[10px] flex-shrink-0 truncate sm:whitespace-nowrap">Dispositivo: {incident.device_id}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Anomalías */}
                <div className="space-y-3 pt-3 border-t">
                    <div className="flex items-center gap-2 pb-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                        <span className="text-sm font-semibold">Anomalías</span>
                        {definitions.anomaly && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                        <p className="font-semibold mb-1">{definitions.anomaly.title}</p>
                                        <p className="text-xs">{definitions.anomaly.description}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                    
                    <div className={`p-2 sm:p-3 rounded-lg border min-w-0 ${anomaliesData.anomalous_days_count > 0 ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-muted/50'}`}>
                        <div className="flex items-center justify-between gap-2 mb-2 min-w-0">
                            <div className="min-w-0 flex-1">
                                <div className="text-xs text-muted-foreground mb-1 truncate">Jornadas Anómalas</div>
                                <div className="text-base sm:text-lg font-bold truncate">{anomaliesData.anomalous_days_count || 0}</div>
                            </div>
                            {anomaliesData.anomalous_days_count > 0 ? (
                                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                            ) : (
                                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                            )}
                        </div>
                    </div>

                    {/* Detalles de anomalías */}
                    {anomaliesData.details && anomaliesData.details.length > 0 && (
                        <div className="space-y-1.5 pt-2">
                            <div className="text-xs font-semibold text-muted-foreground">Detalles</div>
                            <div className="space-y-1 max-h-48 overflow-y-auto">
                                {anomaliesData.details.map((anomaly, idx) => (
                                    <div key={idx} className="p-2 rounded-md bg-yellow-500/5 border border-yellow-500/20 text-xs min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2 mb-1 min-w-0">
                                            <span className="font-semibold truncate flex-1 min-w-0">{anomaly.employee_name}</span>
                                            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 flex-wrap">
                                                <Badge variant="outline" className="text-[9px] sm:text-[10px] bg-yellow-500/10 border-yellow-500/20 whitespace-nowrap">
                                                    {formatDate(anomaly.date)}
                                                </Badge>
                                                <Badge variant="outline" className="text-[9px] sm:text-[10px] whitespace-nowrap">
                                                    {formatHours(anomaly.hours)}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="text-muted-foreground">
                                            <Badge variant="secondary" className="text-[10px] truncate max-w-full">
                                                {anomaly.reason_label}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Contexto */}
                <div className="space-y-3 pt-3 border-t">
                    <div className="flex items-center gap-2 pb-2">
                        <Users className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold">Contexto</span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 min-w-0">
                        <div className="p-2 sm:p-3 rounded-lg bg-muted/50 border min-w-0">
                            <div className="text-xs text-muted-foreground mb-1 truncate">Empleados Activos</div>
                            <div className="text-base sm:text-lg font-bold truncate">{contextData.active_employees_count || 0}</div>
                        </div>
                        <div className="p-2 sm:p-3 rounded-lg bg-muted/50 border min-w-0">
                            <div className="text-xs text-muted-foreground mb-1 truncate">Total Empleados</div>
                            <div className="text-base sm:text-lg font-bold truncate">{contextData.total_employees_count || 0}</div>
                        </div>
                    </div>
                    
                    {contextData.total_employees_count > 0 && (
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground font-medium">Tasa de actividad</span>
                                <span className="font-semibold text-foreground">
                                    {((contextData.active_employees_count / contextData.total_employees_count) * 100).toFixed(1)}%
                                </span>
                            </div>
                            <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-primary to-primary/80 h-full transition-all duration-700 ease-out shadow-sm"
                                    style={{ 
                                        width: `${((contextData.active_employees_count / contextData.total_employees_count) * 100)}%` 
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>

            <CardFooter className="flex items-center justify-between gap-2 text-xs text-muted-foreground pt-3 border-t bg-muted/30 min-w-0">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="font-medium truncate">
                        {periodData.date_start && periodData.date_end 
                            ? `${periodData.date_start} - ${periodData.date_end}`
                            : "Período seleccionado"
                        }
                    </span>
                </div>
            </CardFooter>
        </Card>
    )
}
