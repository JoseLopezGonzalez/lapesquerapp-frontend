'use client';

import { notify } from '@/lib/notifications';
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usePunchesStatistics } from '@/hooks/usePunches';
import { DateRangePicker } from '@/components/ui/dateRangePicker';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { startOfMonth, endOfMonth, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
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
  XCircle,
} from 'lucide-react';

// Inicializar con el mes actual
const getInitialDateRange = () => {
  const today = new Date();
  return {
    from: startOfMonth(today),
    to: endOfMonth(today),
  };
};

export function WorkerStatisticsCard() {
  const [dateRange, setDateRange] = useState(getInitialDateRange);
  const { data, isLoading, isError, error } = usePunchesStatistics(dateRange);

  useEffect(() => {
    if (isError && error) {
      const errorMessage =
        error.userMessage || error.message || 'Error al obtener las estadísticas';
      notify.error({ title: errorMessage });
    }
  }, [isError, error]);

  // Formatear horas
  const formatHours = (hours) => {
    if (!hours && hours !== 0) return '0h';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    // Si no hay horas, solo mostrar minutos
    if (h === 0) return m > 0 ? `${m}m` : '0m';
    // Si no hay minutos, solo mostrar horas
    if (m === 0) return `${h}h`;
    // Si hay ambos, mostrar ambos
    return `${h}h ${m}m`;
  };

  // Formatear porcentaje
  const formatPercentage = (value) => {
    if (value === null || value === undefined) return '0%';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy');
    } catch {
      return dateString;
    }
  };

  // Formatear fecha descriptiva (para días activos) - formato texto completo
  const formatDateShort = (dateString) => {
    if (!dateString) return '';
    try {
      const formatted = format(parseISO(dateString), "EEEE d 'de' MMMM", { locale: es });
      // Capitalizar primera letra de cada palabra (día y mes)
      return formatted
        .split(' ')
        .map((word) => {
          // Si es "de", mantenerlo en minúscula
          if (word === 'de') return word;
          return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ');
    } catch {
      return dateString;
    }
  };

  // Obtener color para variación
  const getVariationColor = (value) => {
    if (value > 0) return 'text-green-600 dark:text-green-400';
    if (value < 0) return 'text-red-600 dark:text-red-400';
    return 'text-muted-foreground';
  };

  // Obtener icono para variación
  const getVariationIcon = (value) => {
    if (value > 0) return TrendingUp;
    if (value < 0) return TrendingDown;
    return Activity;
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-full overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="mb-2 h-6 w-48" />
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
    );
  }

  const periodData = data?.period || {};
  const definitions = data?.definitions || {};
  const workData = data?.work || {};
  const activityData = data?.activity || {};
  const incidentsData = data?.incidents || {};
  const anomaliesData = data?.anomalies || {};
  const contextData = data?.context || {};

  const hoursVariation = workData.hours_variation || 0;
  const hoursVariationPercentage = workData.hours_variation_percentage || 0;
  const VariationIcon = getVariationIcon(hoursVariation);

  return (
    <Card className="w-full max-w-full min-w-0 overflow-hidden">
      <CardHeader className="min-w-0 space-y-4 pb-2">
        <div className="mb-3 flex min-w-0 items-center justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="min-w-0">
              <span className="truncate">Estadísticas de Trabajadores</span>
            </CardTitle>
            <CardDescription className="truncate">
              {periodData.label || 'Período seleccionado'}
            </CardDescription>
          </div>
        </div>

        {/* Selector de rango de fechas */}
        <div className="w-full max-w-full min-w-0 overflow-hidden">
          <DateRangePicker dateRange={dateRange} onChange={setDateRange} />
        </div>
      </CardHeader>

      <CardContent className="max-h-[calc(100vh-300px)] min-w-0 space-y-4 overflow-y-auto">
        {/* Estadísticas de Trabajo */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b pb-2">
            <Clock className="text-primary h-4 w-4" />
            <span className="text-sm font-semibold">Horas Trabajadas</span>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
            <div className="bg-muted/50 min-w-0 rounded-lg border p-2 sm:p-3">
              <div className="text-muted-foreground mb-1 truncate text-xs">Total de Horas</div>
              <div className="truncate text-base font-bold sm:text-lg">
                {formatHours(workData.total_hours || 0)}
              </div>
            </div>
            <div className="bg-muted/50 min-w-0 rounded-lg border p-2 sm:p-3">
              <div className="text-muted-foreground mb-1 truncate text-xs">
                Promedio por Empleado
              </div>
              <div className="truncate text-base font-bold sm:text-lg">
                {formatHours(workData.average_hours_per_employee || 0)}
              </div>
            </div>
          </div>

          {/* Variación de horas */}
          {workData.previous_period_hours !== undefined && (
            <div className="from-card to-muted/20 min-w-0 rounded-lg border bg-gradient-to-br p-2 sm:p-3">
              <div className="mb-2 flex min-w-0 items-center justify-between gap-2">
                <span className="text-muted-foreground min-w-0 flex-1 truncate text-xs">
                  Variación respecto al período anterior
                </span>
                <div
                  className={`flex flex-shrink-0 items-center gap-1 ${getVariationColor(hoursVariationPercentage)}`}
                >
                  <VariationIcon className="h-3.5 w-3.5" />
                  <span className="text-xs font-semibold whitespace-nowrap sm:text-sm">
                    {formatPercentage(hoursVariationPercentage)}
                  </span>
                </div>
              </div>
              <div className="text-muted-foreground truncate text-xs">
                Período anterior: {formatHours(workData.previous_period_hours || 0)}
              </div>
              <div className="text-muted-foreground truncate text-xs">
                Diferencia: {hoursVariation >= 0 ? '+' : ''}
                {formatHours(Math.abs(hoursVariation))}
              </div>
            </div>
          )}

          {/* Breakdown: Top y Bottom empleados */}
          {workData.breakdown && (
            <div className="space-y-2 border-t pt-2">
              <div className="text-muted-foreground mb-2 text-xs font-semibold">
                Ranking de Horas
              </div>

              {/* Top empleados */}
              {workData.breakdown.top_employees && workData.breakdown.top_employees.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                    <ArrowUp className="h-3 w-3 text-green-600 dark:text-green-400" />
                    <span>Top trabajadores</span>
                  </div>
                  <div className="space-y-1">
                    {workData.breakdown.top_employees.map((emp, idx) => (
                      <div
                        key={emp.employee_id}
                        className="flex min-w-0 items-center justify-between gap-2 rounded-md border border-green-500/20 bg-green-500/5 p-2"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <Medal className="h-3.5 w-3.5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
                          <span className="truncate text-xs font-medium">{emp.employee_name}</span>
                        </div>
                        <span className="flex-shrink-0 text-xs font-bold whitespace-nowrap">
                          {formatHours(emp.total_hours)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom empleados */}
              {workData.breakdown.bottom_employees &&
                workData.breakdown.bottom_employees.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                      <ArrowDown className="h-3 w-3 text-red-600 dark:text-red-400" />
                      <span>Menos horas</span>
                    </div>
                    <div className="space-y-1">
                      {workData.breakdown.bottom_employees.map((emp) => (
                        <div
                          key={emp.employee_id}
                          className="flex min-w-0 items-center justify-between gap-2 rounded-md border border-red-500/20 bg-red-500/5 p-2"
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-2">
                            <XCircle className="h-3.5 w-3.5 flex-shrink-0 text-red-600 dark:text-red-400" />
                            <span className="truncate text-xs font-medium">
                              {emp.employee_name}
                            </span>
                          </div>
                          <span className="flex-shrink-0 text-xs font-bold whitespace-nowrap">
                            {formatHours(emp.total_hours)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>

        {/* Actividad */}
        <div className="space-y-3 border-t pt-3">
          <div className="flex items-center gap-2 pb-2">
            <Activity className="text-primary h-4 w-4" />
            <span className="text-sm font-semibold">Actividad</span>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-2">
            <div className="bg-muted/50 min-w-0 rounded-lg border p-2 text-center sm:p-2">
              <div className="text-muted-foreground mb-1 truncate text-xs tracking-wide uppercase sm:text-[10px]">
                Días Activos
              </div>
              <div className="truncate text-base font-bold sm:text-base">
                {activityData.days_with_activity || 0}
              </div>
            </div>
            <div className="bg-muted/50 min-w-0 rounded-lg border p-2 text-center sm:p-2">
              <div className="text-muted-foreground mb-1 truncate text-xs tracking-wide uppercase sm:text-[10px]">
                Horas/Día
              </div>
              <div className="truncate text-base font-bold sm:text-base">
                {formatHours(activityData.average_hours_per_day || 0)}
              </div>
            </div>
            <div className="bg-muted/50 min-w-0 rounded-lg border p-2 text-center sm:p-2">
              <div className="text-muted-foreground mb-1 truncate text-xs tracking-wide uppercase sm:text-[10px]">
                Promedio/Trab.
              </div>
              <div className="truncate text-base font-bold sm:text-base">
                {formatHours(activityData.average_hours_per_day_per_employee || 0)}
              </div>
            </div>
          </div>

          {/* Breakdown de actividad */}
          {activityData.breakdown && (
            <div className="space-y-3 border-t pt-2">
              {/* Días más activos */}
              {activityData.breakdown.most_active_days &&
                activityData.breakdown.most_active_days.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-muted-foreground text-xs font-semibold">
                      Días más activos
                    </div>
                    <div className="space-y-2">
                      {activityData.breakdown.most_active_days.map((day) => (
                        <div
                          key={day.date}
                          className="bg-muted/30 min-w-0 overflow-hidden rounded-md border text-xs"
                        >
                          <div className="flex min-w-0 flex-col gap-1.5 p-2 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                            <div className="flex min-w-0 flex-1 items-center gap-2">
                              <Calendar className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate text-[10px] font-medium sm:text-xs">
                                {formatDateShort(day.date)}
                              </span>
                            </div>
                            <div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-3">
                              <span className="text-muted-foreground truncate text-[9px] sm:text-xs sm:whitespace-nowrap">
                                {day.employees_count || 0} empleados
                              </span>
                              <Badge
                                variant="secondary"
                                className="text-[9px] font-bold whitespace-nowrap sm:text-[10px]"
                              >
                                {formatHours(day.average_hours_per_employee || 0)}
                              </Badge>
                            </div>
                          </div>
                          {day.employees && day.employees.length > 0 && (
                            <div className="border-muted/50 min-w-0 space-y-1 border-t px-2 pt-2 pb-2">
                              {day.employees.slice(0, 5).map((emp) => (
                                <div
                                  key={emp.employee_id}
                                  className="flex min-w-0 items-center justify-between gap-2 text-[10px]"
                                >
                                  <span className="text-muted-foreground min-w-0 flex-1 truncate">
                                    {emp.employee_name}
                                  </span>
                                  <span className="flex-shrink-0 font-medium whitespace-nowrap">
                                    {formatHours(emp.hours || 0)}
                                  </span>
                                </div>
                              ))}
                              {day.employees.length > 5 && (
                                <div className="text-muted-foreground pt-1 text-center text-[10px]">
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
              {activityData.breakdown.least_active_days &&
                activityData.breakdown.least_active_days.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <div className="text-muted-foreground text-xs font-semibold">
                      Días menos activos
                    </div>
                    <div className="space-y-2">
                      {activityData.breakdown.least_active_days.map((day) => (
                        <div
                          key={day.date}
                          className="bg-muted/30 min-w-0 overflow-hidden rounded-md border text-xs"
                        >
                          <div className="flex min-w-0 flex-col gap-1.5 p-2 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                            <div className="flex min-w-0 flex-1 items-center gap-2">
                              <Calendar className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate text-[10px] font-medium sm:text-xs">
                                {formatDateShort(day.date)}
                              </span>
                            </div>
                            <div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-3">
                              <span className="text-muted-foreground truncate text-[9px] sm:text-xs sm:whitespace-nowrap">
                                {day.employees_count || 0} empleados
                              </span>
                              <Badge
                                variant="secondary"
                                className="text-[9px] font-bold whitespace-nowrap sm:text-[10px]"
                              >
                                {formatHours(day.average_hours_per_employee || 0)}
                              </Badge>
                            </div>
                          </div>
                          {day.employees && day.employees.length > 0 && (
                            <div className="border-muted/50 min-w-0 space-y-1 border-t px-2 pt-2 pb-2">
                              {day.employees.slice(0, 5).map((emp) => (
                                <div
                                  key={emp.employee_id}
                                  className="flex min-w-0 items-center justify-between gap-2 text-[10px]"
                                >
                                  <span className="text-muted-foreground min-w-0 flex-1 truncate">
                                    {emp.employee_name}
                                  </span>
                                  <span className="flex-shrink-0 font-medium whitespace-nowrap">
                                    {formatHours(emp.hours || 0)}
                                  </span>
                                </div>
                              ))}
                              {day.employees.length > 5 && (
                                <div className="text-muted-foreground pt-1 text-center text-[10px]">
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
        <div className="space-y-3 border-t pt-3">
          <div className="flex items-center gap-2 pb-2">
            <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <span className="text-sm font-semibold">Incidencias</span>
            {definitions.incident && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="text-muted-foreground h-3.5 w-3.5 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="mb-1 font-semibold">{definitions.incident.title}</p>
                    <p className="text-xs">{definitions.incident.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          <div
            className={`min-w-0 rounded-lg border p-2 sm:p-3 ${incidentsData.open_incidents_count > 0 ? 'border-orange-500/20 bg-orange-500/10' : 'bg-muted/50'}`}
          >
            <div className="mb-2 flex min-w-0 items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-muted-foreground mb-1 truncate text-xs">
                  Incidencias Abiertas
                </div>
                <div className="truncate text-base font-bold sm:text-lg">
                  {incidentsData.open_incidents_count || 0}
                </div>
              </div>
              {incidentsData.open_incidents_count > 0 ? (
                <AlertTriangle className="h-4 w-4 flex-shrink-0 text-orange-600 sm:h-5 sm:w-5 dark:text-orange-400" />
              ) : (
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-600 sm:h-5 sm:w-5 dark:text-green-400" />
              )}
            </div>
          </div>

          {/* Detalles de incidencias */}
          {incidentsData.details && incidentsData.details.length > 0 && (
            <div className="space-y-1.5 pt-2">
              <div className="text-muted-foreground text-xs font-semibold">Detalles</div>
              <div className="max-h-48 space-y-1 overflow-y-auto">
                {incidentsData.details.map((incident, idx) => (
                  <div
                    key={idx}
                    className="min-w-0 rounded-md border border-orange-500/20 bg-orange-500/5 p-2 text-xs"
                  >
                    <div className="mb-1 flex min-w-0 items-center justify-between gap-2">
                      <span className="min-w-0 flex-1 truncate font-semibold">
                        {incident.employee_name}
                      </span>
                      <Badge
                        variant="outline"
                        className="flex-shrink-0 border-orange-500/20 bg-orange-500/10 text-[10px] whitespace-nowrap"
                      >
                        {formatDate(incident.date)}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground flex min-w-0 flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-2">
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <Clock className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate text-xs">Entrada: {incident.entry_time}</span>
                      </div>
                      {incident.device_id && (
                        <span className="flex-shrink-0 truncate text-[10px] sm:whitespace-nowrap">
                          Dispositivo: {incident.device_id}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Anomalías */}
        <div className="space-y-3 border-t pt-3">
          <div className="flex items-center gap-2 pb-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <span className="text-sm font-semibold">Anomalías</span>
            {definitions.anomaly && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="text-muted-foreground h-3.5 w-3.5 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="mb-1 font-semibold">{definitions.anomaly.title}</p>
                    <p className="text-xs">{definitions.anomaly.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          <div
            className={`min-w-0 rounded-lg border p-2 sm:p-3 ${anomaliesData.anomalous_days_count > 0 ? 'border-yellow-500/20 bg-yellow-500/10' : 'bg-muted/50'}`}
          >
            <div className="mb-2 flex min-w-0 items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-muted-foreground mb-1 truncate text-xs">Jornadas Anómalas</div>
                <div className="truncate text-base font-bold sm:text-lg">
                  {anomaliesData.anomalous_days_count || 0}
                </div>
              </div>
              {anomaliesData.anomalous_days_count > 0 ? (
                <AlertTriangle className="h-4 w-4 flex-shrink-0 text-yellow-600 sm:h-5 sm:w-5 dark:text-yellow-400" />
              ) : (
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-600 sm:h-5 sm:w-5 dark:text-green-400" />
              )}
            </div>
          </div>

          {/* Detalles de anomalías */}
          {anomaliesData.details && anomaliesData.details.length > 0 && (
            <div className="space-y-1.5 pt-2">
              <div className="text-muted-foreground text-xs font-semibold">Detalles</div>
              <div className="max-h-48 space-y-1 overflow-y-auto">
                {anomaliesData.details.map((anomaly, idx) => (
                  <div
                    key={idx}
                    className="min-w-0 rounded-md border border-yellow-500/20 bg-yellow-500/5 p-2 text-xs"
                  >
                    <div className="mb-1 flex min-w-0 flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                      <span className="min-w-0 flex-1 truncate font-semibold">
                        {anomaly.employee_name}
                      </span>
                      <div className="flex flex-shrink-0 flex-wrap items-center gap-1 sm:gap-2">
                        <Badge
                          variant="outline"
                          className="border-yellow-500/20 bg-yellow-500/10 text-[9px] whitespace-nowrap sm:text-[10px]"
                        >
                          {formatDate(anomaly.date)}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-[9px] whitespace-nowrap sm:text-[10px]"
                        >
                          {formatHours(anomaly.hours)}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-muted-foreground">
                      <Badge variant="secondary" className="max-w-full truncate text-[10px]">
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
        <div className="space-y-3 border-t pt-3">
          <div className="flex items-center gap-2 pb-2">
            <Users className="text-primary h-4 w-4" />
            <span className="text-sm font-semibold">Contexto</span>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
            <div className="bg-muted/50 min-w-0 rounded-lg border p-2 sm:p-3">
              <div className="text-muted-foreground mb-1 truncate text-xs">Empleados Activos</div>
              <div className="truncate text-base font-bold sm:text-lg">
                {contextData.active_employees_count || 0}
              </div>
            </div>
            <div className="bg-muted/50 min-w-0 rounded-lg border p-2 sm:p-3">
              <div className="text-muted-foreground mb-1 truncate text-xs">Total Empleados</div>
              <div className="truncate text-base font-bold sm:text-lg">
                {contextData.total_employees_count || 0}
              </div>
            </div>
          </div>

          {contextData.total_employees_count > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Tasa de actividad</span>
                <span className="text-foreground font-semibold">
                  {(
                    (contextData.active_employees_count / contextData.total_employees_count) *
                    100
                  ).toFixed(1)}
                  %
                </span>
              </div>
              <div className="bg-muted h-2.5 w-full overflow-hidden rounded-full">
                <div
                  className="from-primary to-primary/80 h-full bg-gradient-to-r shadow-sm transition-all duration-700 ease-out"
                  style={{
                    width: `${(contextData.active_employees_count / contextData.total_employees_count) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
