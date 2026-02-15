"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { usePunchesDashboard } from "@/hooks/usePunches"
import { Users, Clock, UserCheck, LogIn, LogOut, TrendingUp, Coffee, PlayCircle, PauseCircle, XCircle, Activity, AlertTriangle, Calendar } from "lucide-react"
import { formatDateHour } from "@/helpers/formats/dates/formatDates"

export function WorkingEmployeesCard() {
    const { data, isLoading } = usePunchesDashboard()

    if (isLoading) {
        return (
            <Card className="w-full max-w-full overflow-hidden">
                <CardHeader>
                    <div>
                        <CardTitle className="text-base">
                            <Skeleton className="h-6 w-40 mt-2" />
                        </CardTitle>
                        <CardDescription>
                            <Skeleton className="h-4 w-1/2 mt-2" />
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 mt-2 w-full mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex flex-col gap-1 w-full">
                            <div className="flex justify-between items-center w-full">
                                <Skeleton className="h-4 w-1/2" />
                                <Skeleton className="h-4 w-1/4" />
                            </div>
                            <Skeleton className="h-2 w-full rounded-full" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        )
    }

    const statistics = data?.statistics || {}
    const allEmployees = data?.allEmployees || []
    const workingEmployees = data?.workingEmployees || []
    const recentPunches = data?.recentPunches || []
    const errors = data?.errors || {}
    const missingPunches = errors?.missingPunches || []
    const totalMissingPunches = errors?.totalMissingPunches || 0
    const totalWorking = statistics.totalWorking || 0
    const totalEmployees = statistics.totalEmployees || 0
    const totalEntriesToday = statistics.totalEntriesToday || 0
    const totalExitsToday = statistics.totalExitsToday || 0
    const entriesByDevice = statistics.entriesByDevice || {}

    const formatTime = (timestamp) => {
        if (!timestamp) return ""
        try {
            const date = new Date(timestamp)
            return date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
        } catch {
            return ""
        }
    }

    const formatDateTime = (timestamp) => {
        if (!timestamp) return ""
        try {
            return formatDateHour(timestamp)
        } catch {
            return ""
        }
    }

    const getStatusBadge = (status) => {
        const statusConfig = {
            trabajando: { 
                label: "Trabajando", 
                variant: "default", 
                icon: PlayCircle,
                className: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
            },
            descansando: { 
                label: "Descansando", 
                variant: "secondary", 
                icon: Coffee,
                className: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20"
            },
            no_ha_fichado: { 
                label: "No ha fichado", 
                variant: "outline", 
                icon: XCircle,
                className: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20"
            },
            ha_finalizado: { 
                label: "Finalizado", 
                variant: "outline", 
                icon: PauseCircle,
                className: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
            }
        }
        return statusConfig[status] || statusConfig.no_ha_fichado
    }

    const workingPercentage = totalEmployees > 0 ? ((totalWorking / totalEmployees) * 100).toFixed(1) : 0

    // Agrupar empleados por estado
    const employeesByStatus = {
        trabajando: allEmployees.filter(e => e.status === "trabajando"),
        descansando: allEmployees.filter(e => e.status === "descansando"),
        ha_finalizado: allEmployees.filter(e => e.status === "ha_finalizado"),
        no_ha_fichado: allEmployees.filter(e => e.status === "no_ha_fichado")
    }

    return (
        <Card className="w-full max-w-full overflow-hidden">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Users className="w-4 h-4 text-primary" />
                            Trabajadores
                        </CardTitle>
                        <CardDescription className="text-xs">
                            {totalWorking} de {totalEmployees} trabajadores activos
                        </CardDescription>
                    </div>
                    <Badge variant="outline" className="flex items-center gap-1.5 text-xs px-3 py-1.5 font-medium">
                        <UserCheck className="w-3.5 h-3.5" />
                        {totalWorking}/{totalEmployees}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Estadísticas del día - Mejorado */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50 border">
                        <div className="flex items-center gap-2 mb-1.5">
                            <div className="p-1.5 rounded-md bg-green-500/10">
                                <LogIn className="w-4 h-4 text-green-600 dark:text-green-400" />
                            </div>
                            <span className="text-lg font-bold text-foreground">{totalEntriesToday}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Entradas</span>
                    </div>
                    <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50 border">
                        <div className="flex items-center gap-2 mb-1.5">
                            <div className="p-1.5 rounded-md bg-red-500/10">
                                <LogOut className="w-4 h-4 text-red-600 dark:text-red-400" />
                            </div>
                            <span className="text-lg font-bold text-foreground">{totalExitsToday}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Salidas</span>
                    </div>
                    <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50 border">
                        <div className="flex items-center gap-2 mb-1.5">
                            <div className="p-1.5 rounded-md bg-primary/10">
                                <Activity className="w-4 h-4 text-primary" />
                            </div>
                            <span className="text-lg font-bold text-foreground">{workingPercentage}%</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Actividad</span>
                    </div>
                </div>

                {/* Barra de progreso mejorada */}
                <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground font-medium">Tasa de actividad del día</span>
                        <span className="font-semibold text-foreground">{workingPercentage}%</span>
                    </div>
                    <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-primary to-primary/80 h-full transition-all duration-700 ease-out shadow-sm"
                            style={{ width: `${workingPercentage}%` }}
                        />
                    </div>
                </div>

                {/* Lista de todos los empleados con estados */}
                {allEmployees.length > 0 ? (
                    <div className="space-y-4">
                        {/* Trabajando ahora - Diseño mejorado */}
                        {employeesByStatus.trabajando.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between pb-1 border-b">
                                    <div className="flex items-center gap-2">
                                        <PlayCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                                        <span className="text-sm font-semibold">Trabajando ahora</span>
                                    </div>
                                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                                        {employeesByStatus.trabajando.length}
                                    </Badge>
                                </div>
                                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                    {employeesByStatus.trabajando.map((employee) => {
                                        const statusConfig = getStatusBadge(employee.status)
                                        const StatusIcon = statusConfig.icon
                                        return (
                                            <div key={employee.id} className="group relative p-3 rounded-lg border bg-gradient-to-br from-card to-muted/20 hover:from-card hover:to-muted/40 transition-all duration-200 shadow-sm hover:shadow">
                                                {/* Header principal */}
                                                <div className="flex items-center justify-between gap-3 mb-2">
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex-shrink-0">
                                                            <Users className="w-3.5 h-3.5 text-primary" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <span className="text-sm font-semibold text-foreground truncate block">
                                                                {employee.name}
                                                            </span>
                                                            {employee.currentEntryTimestamp && (
                                                                <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                                                    <LogIn className="w-2.5 h-2.5 text-green-600 dark:text-green-400" />
                                                                    Entrada: {formatTime(employee.currentEntryTimestamp)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                                        <Badge variant="secondary" className="text-xs px-2.5 py-1 font-bold bg-primary/10 text-primary border-primary/20">
                                                            {employee.todayTotalHoursFormatted || "0h 0m"}
                                                        </Badge>
                                                        {employee.currentSessionFormatted && (
                                                            <span className="text-[10px] text-primary font-medium flex items-center gap-1">
                                                                <Clock className="w-2.5 h-2.5" />
                                                                {employee.currentSessionFormatted}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Estadísticas en grid */}
                                                <div className="grid grid-cols-3 gap-2 mb-2">
                                                    <div className="flex flex-col items-center p-1.5 rounded-md bg-muted/50 border">
                                                        <span className="text-[9px] text-muted-foreground uppercase tracking-wide mb-0.5">Sesiones</span>
                                                        <span className="text-xs font-bold text-foreground">{employee.completeSessionsCount || 0}</span>
                                                    </div>
                                                    {employee.breakTimeFormatted ? (
                                                        <div className="flex flex-col items-center p-1.5 rounded-md bg-muted/50 border">
                                                            <span className="text-[9px] text-muted-foreground uppercase tracking-wide mb-0.5">Descanso</span>
                                                            <span className="text-xs font-bold text-foreground">{employee.breakTimeFormatted}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center p-1.5 rounded-md bg-muted/30 border border-dashed">
                                                            <span className="text-[9px] text-muted-foreground uppercase tracking-wide mb-0.5">Descanso</span>
                                                            <span className="text-xs font-bold text-muted-foreground">-</span>
                                                        </div>
                                                    )}
                                                    <div className="flex flex-col items-center p-1.5 rounded-md bg-muted/50 border">
                                                        <span className="text-[9px] text-muted-foreground uppercase tracking-wide mb-0.5">Entradas</span>
                                                        <span className="text-xs font-bold text-foreground">{employee.todayEntriesCount || 0}</span>
                                                    </div>
                                                </div>

                                                {/* Barra de progreso mejorada */}
                                                {employee.todayTotalHours > 0 && (
                                                    <div className="mt-2">
                                                        {(() => {
                                                            const hours = employee.todayTotalHours || 0
                                                            const percentage = Math.round((hours / 8) * 100)
                                                            const barWidth = Math.min(percentage, 100)
                                                            
                                                            // Determinar color según horas
                                                            let barColorClass = ""
                                                            if (hours <= 8) {
                                                                // Gris hasta 8h (normal)
                                                                barColorClass = "bg-gradient-to-r from-gray-500 via-gray-500/90 to-gray-500/80"
                                                            } else if (hours <= 10) {
                                                                // Amarillo de 8-10h
                                                                barColorClass = "bg-gradient-to-r from-yellow-500 via-yellow-500/90 to-yellow-500/80"
                                                            } else {
                                                                // Rojo >10h
                                                                barColorClass = "bg-gradient-to-r from-red-500 via-red-500/90 to-red-500/80"
                                                            }
                                                            
                                                            return (
                                                                <>
                                                                    <div className="flex justify-between items-center mb-1">
                                                                        <span className="text-[10px] text-muted-foreground font-medium">Progreso del día</span>
                                                                        <span className="text-[10px] font-semibold text-foreground">{percentage}%</span>
                                                                    </div>
                                                                    <div className="w-full bg-muted h-2 rounded-full overflow-hidden shadow-inner">
                                                                        <div
                                                                            className={`${barColorClass} h-full transition-all duration-700 ease-out shadow-sm`}
                                                                            style={{
                                                                                width: `${barWidth}%`
                                                                            }}
                                                                        />
                                                                    </div>
                                                                </>
                                                            )
                                                        })()}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Otros estados - Diseño mejorado */}
                        {(employeesByStatus.descansando.length > 0 || employeesByStatus.ha_finalizado.length > 0 || employeesByStatus.no_ha_fichado.length > 0) && (
                            <div className="space-y-2.5 pt-3 border-t">
                                <div className="flex items-center gap-2 pb-1">
                                    <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span className="text-sm font-semibold">Otros estados</span>
                                </div>
                                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                    {[...employeesByStatus.descansando, ...employeesByStatus.ha_finalizado, ...employeesByStatus.no_ha_fichado].slice(0, 6).map((employee) => {
                                        const statusConfig = getStatusBadge(employee.status)
                                        const StatusIcon = statusConfig.icon
                                        return (
                                            <div key={employee.id} className="flex items-center justify-between text-xs p-2 rounded-md border bg-muted/30 hover:bg-muted/50 transition-colors">
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    <StatusIcon className="w-3.5 h-3.5 flex-shrink-0" />
                                                    <span className="truncate font-medium">{employee.name}</span>
                                                </div>
                                                <div className="flex items-center gap-2 ml-2">
                                                    {employee.todayTotalHoursFormatted && (
                                                        <span className="text-muted-foreground font-mono text-[10px]">{employee.todayTotalHoursFormatted}</span>
                                                    )}
                                                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0.5 ${statusConfig.className}`}>
                                                        {statusConfig.label}
                                                    </Badge>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    {(employeesByStatus.descansando.length + employeesByStatus.ha_finalizado.length + employeesByStatus.no_ha_fichado.length) > 6 && (
                                        <div className="text-center text-[10px] text-muted-foreground pt-1 font-medium">
                                            +{(employeesByStatus.descansando.length + employeesByStatus.ha_finalizado.length + employeesByStatus.no_ha_fichado.length) - 6} más
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        <p className="text-sm font-medium">No hay trabajadores registrados</p>
                    </div>
                )}

                {/* Fichajes recientes - Diseño mejorado */}
                {recentPunches.length > 0 && (
                    <div className="space-y-2.5 pt-3 border-t">
                        <div className="flex items-center justify-between pb-1">
                            <div className="flex items-center gap-2">
                                <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="text-sm font-semibold">Fichajes recientes</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground font-medium">Últimos 30 min</span>
                        </div>
                        <div className="space-y-1.5 max-h-36 overflow-y-auto">
                            {recentPunches.slice(0, 6).map((punch) => (
                                <div key={punch.id} className="flex items-center justify-between text-xs p-2 rounded-md border bg-muted/30 hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        {punch.eventType === "IN" ? (
                                            <div className="p-1 rounded bg-green-500/10">
                                                <LogIn className="w-3 h-3 text-green-600 dark:text-green-400" />
                                            </div>
                                        ) : (
                                            <div className="p-1 rounded bg-red-500/10">
                                                <LogOut className="w-3 h-3 text-red-600 dark:text-red-400" />
                                            </div>
                                        )}
                                        <span className="truncate font-medium">{punch.employeeName}</span>
                                    </div>
                                    <div className="flex items-center gap-2 ml-2">
                                        <span className="text-muted-foreground font-mono text-[10px]">{formatDateTime(punch.timestamp)}</span>
                                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0.5 ${
                                            punch.eventType === "IN" 
                                                ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20" 
                                                : "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
                                        }`}>
                                            {punch.eventType}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Incidencias de días anteriores */}
                {missingPunches.length > 0 && (
                    <div className="space-y-2.5 pt-3 border-t">
                        <div className="flex items-center justify-between pb-1">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                                <span className="text-sm font-semibold">Incidencias</span>
                            </div>
                            <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20">
                                {totalMissingPunches}
                            </Badge>
                        </div>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                            {missingPunches.map((incident, index) => {
                                const incidentDate = new Date(incident.date)
                                const formattedDate = incidentDate.toLocaleDateString("es-ES", {
                                    day: "2-digit",
                                    month: "short"
                                })
                                
                                return (
                                    <div key={index} className="flex items-center justify-between text-xs p-2 rounded-md border border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10 transition-colors">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <div className="p-1 rounded bg-orange-500/20 flex-shrink-0">
                                                <AlertTriangle className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-foreground truncate">{incident.employeeName}</span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                                                    <span className="flex items-center gap-0.5">
                                                        <Calendar className="w-2.5 h-2.5" />
                                                        {formattedDate}
                                                    </span>
                                                    {incident.daysAgo !== undefined && (
                                                        <span className="text-muted-foreground">
                                                            ({incident.daysAgo === 1 ? "Ayer" : `Hace ${incident.daysAgo} días`})
                                                        </span>
                                                    )}
                                                    {incident.entryTimestamp && (
                                                        <span className="flex items-center gap-0.5">
                                                            <LogIn className="w-2.5 h-2.5 text-green-600 dark:text-green-400" />
                                                            {formatDateTime(incident.entryTimestamp)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-0.5 ml-2 flex-shrink-0">
                                            {incident.hoursOpen !== undefined && (
                                                <span className="text-[10px] font-semibold text-orange-600 dark:text-orange-400">
                                                    {incident.hoursOpen.toFixed(1)}h
                                                </span>
                                            )}
                                            <span className="text-[9px] text-muted-foreground">Sin salida</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </CardContent>

            <CardFooter className="flex items-center justify-between gap-2 text-xs text-muted-foreground pt-3 border-t bg-muted/30">
                <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span className="font-medium">Actualizado en tiempo real</span>
                </div>
                {Object.keys(entriesByDevice).length > 0 && (
                    <div className="text-[10px] font-medium">
                        {Object.keys(entriesByDevice).length} dispositivo(s)
                    </div>
                )}
            </CardFooter>
        </Card>
    )
}
