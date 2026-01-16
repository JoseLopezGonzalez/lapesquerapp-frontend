"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useSession } from "next-auth/react"
import { getPunchesDashboard } from "@/services/punchService"
import { Users, Clock, UserCheck, LogIn, LogOut, TrendingUp } from "lucide-react"
import { formatDateHour } from "@/helpers/formats/dates/formatDates"

export function WorkingEmployeesCard() {
    const { data: session, status } = useSession()
    const [isLoading, setIsLoading] = useState(true)
    const [data, setData] = useState(null)

    const accessToken = session?.user?.accessToken

    useEffect(() => {
        if (status !== "authenticated") return

        getPunchesDashboard(accessToken)
            .then(setData)
            .catch((err) => {
                console.error("Error al obtener datos del dashboard:", err)
                setData(null)
            })
            .finally(() => setIsLoading(false))
    }, [status, accessToken])

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
    const workingEmployees = data?.workingEmployees || []
    const recentPunches = data?.recentPunches || []
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

    const workingPercentage = totalEmployees > 0 ? ((totalWorking / totalEmployees) * 100).toFixed(1) : 0

    return (
        <Card className="w-full max-w-full overflow-hidden">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-base">Trabajadores Activos</CardTitle>
                        <CardDescription>
                            {totalWorking} de {totalEmployees} trabajadores activos ahora
                        </CardDescription>
                    </div>
                    <Badge variant="outline" className="flex items-center gap-1 text-xs px-2 py-1">
                        <UserCheck className="w-3 h-3" />
                        {totalWorking}/{totalEmployees}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-4 mt-2 mb-4">
                {/* Estadísticas del día */}
                <div className="grid grid-cols-2 gap-3 pb-3 border-b">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-green-100 dark:bg-green-900/20">
                            <LogIn className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">Entradas hoy</span>
                            <span className="text-sm font-semibold">{totalEntriesToday}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-red-100 dark:bg-red-900/20">
                            <LogOut className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">Salidas hoy</span>
                            <span className="text-sm font-semibold">{totalExitsToday}</span>
                        </div>
                    </div>
                </div>

                {/* Barra de progreso de trabajadores activos */}
                <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Tasa de actividad</span>
                        <span className="font-medium">{workingPercentage}%</span>
                    </div>
                    <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                        <div
                            className="bg-primary h-full transition-all duration-500 ease-out"
                            style={{ width: `${workingPercentage}%` }}
                        />
                    </div>
                </div>

                {/* Lista de trabajadores activos */}
                {workingEmployees.length > 0 ? (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Trabajando ahora</span>
                            <span className="text-xs text-muted-foreground">{workingEmployees.length} activos</span>
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {workingEmployees.map((employee) => (
                                <div key={employee.id} className="space-y-1.5">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <Users className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                                                <span className="text-sm font-medium text-foreground truncate">
                                                    {employee.name}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    Entrada: {formatTime(employee.entryTimestamp)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 ml-2">
                                            <Badge variant="secondary" className="text-xs px-2 py-0.5">
                                                {employee.workingTimeFormatted || "0h 0m"}
                                            </Badge>
                                            <span className="text-[10px] text-muted-foreground">
                                                {employee.todayEntriesCount} entradas
                                            </span>
                                        </div>
                                    </div>
                                    {employee.workingHours > 0 && (
                                        <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                                            <div
                                                className="bg-primary/60 h-full transition-all duration-500 ease-out"
                                                style={{
                                                    width: `${Math.min((employee.workingHours / 8) * 100, 100)}%`
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No hay trabajadores activos</p>
                    </div>
                )}

                {/* Fichajes recientes */}
                {recentPunches.length > 0 && (
                    <div className="space-y-2 pt-3 border-t">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Fichajes recientes</span>
                            <span className="text-xs text-muted-foreground">Últimos 30 min</span>
                        </div>
                        <div className="space-y-1.5 max-h-32 overflow-y-auto">
                            {recentPunches.slice(0, 5).map((punch) => (
                                <div key={punch.id} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        {punch.eventType === "IN" ? (
                                            <LogIn className="w-3 h-3 text-green-600 dark:text-green-400 flex-shrink-0" />
                                        ) : (
                                            <LogOut className="w-3 h-3 text-red-600 dark:text-red-400 flex-shrink-0" />
                                        )}
                                        <span className="truncate">{punch.employeeName}</span>
                                    </div>
                                    <div className="flex items-center gap-2 ml-2">
                                        <span className="text-muted-foreground">{formatTime(punch.timestamp)}</span>
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                            {punch.eventType}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>

            <CardFooter className="flex items-center justify-between gap-2 text-xs text-muted-foreground pt-2 border-t">
                <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>Actualizado en tiempo real</span>
                </div>
                {Object.keys(entriesByDevice).length > 0 && (
                    <div className="text-[10px]">
                        {Object.keys(entriesByDevice).length} dispositivo(s)
                    </div>
                )}
            </CardFooter>
        </Card>
    )
}
