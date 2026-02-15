'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ChevronLeft, ChevronRight, Calendar as CalendarIcon, AlertTriangle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getToastTheme } from '@/customs/reactHotToast';
import { usePunchesByMonth } from '@/hooks/usePunchesList';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, getDay, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import PunchDayDialog from './PunchDayDialog';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export default function PunchesCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedDayPunches, setSelectedDayPunches] = useState([]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { data: punchesData, isLoading: loading, error } = usePunchesByMonth(year, month);

  useEffect(() => {
    if (error) {
      toast.error(error || 'Error al cargar los fichajes del mes', getToastTheme());
    }
  }, [error]);

  // Navegación de meses
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
  };

  const goToCurrentMonth = () => {
    setCurrentDate(new Date());
  };

  // Cambiar año
  const handleYearChange = (newYear) => {
    setCurrentDate(new Date(parseInt(newYear), month - 1, 1));
  };

  // Cambiar mes
  const handleMonthChange = (newMonth) => {
    setCurrentDate(new Date(year, parseInt(newMonth) - 1, 1));
  };

  // Obtener datos de un día (nueva estructura con punches, incidents, anomalies)
  const getDayData = (day) => {
    if (!punchesData?.punches_by_day) {
      return { punches: [], incidents: [], anomalies: [] };
    }
    const dayData = punchesData.punches_by_day[day];
    
    // Si es la estructura antigua (solo array), convertirla
    if (Array.isArray(dayData)) {
      return { punches: dayData, incidents: [], anomalies: [] };
    }
    
    // Estructura nueva
    return dayData || { punches: [], incidents: [], anomalies: [] };
  };

  // Obtener fichajes de un día
  const getDayPunches = (day) => {
    return getDayData(day).punches || [];
  };

  // Obtener incidencias de un día
  const getDayIncidents = (day) => {
    return getDayData(day).incidents || [];
  };

  // Obtener anomalías de un día
  const getDayAnomalies = (day) => {
    return getDayData(day).anomalies || [];
  };

  // Contar fichajes de un día
  const getDayPunchCount = (day) => {
    return getDayPunches(day).length;
  };

  // Obtener empleados únicos de un día
  const getDayEmployees = (day) => {
    const punches = getDayPunches(day);
    return new Set(punches.map(p => p.employee_id)).size;
  };

  // Verificar si un día tiene incidencias o anomalías
  const hasDayIssues = (day) => {
    const incidents = getDayIncidents(day);
    const anomalies = getDayAnomalies(day);
    return incidents.length > 0 || anomalies.length > 0;
  };

  // Manejar clic en día
  const handleDayClick = (dayNumber, dayDate) => {
    // Verificar que el día pertenezca al mes actual
    if (!isSameMonth(dayDate, currentDate)) {
      return;
    }
    const dayData = getDayData(dayNumber);
    if (dayData.punches.length > 0 || dayData.incidents.length > 0 || dayData.anomalies.length > 0) {
      setSelectedDayPunches(dayData);
      setSelectedDay(dayNumber);
    }
  };

  // Generar días del calendario
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Lunes
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Generar años para el selector (últimos 5 años y próximos 2)
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear - 5; i <= currentYear + 2; i++) {
    years.push(i);
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 overflow-y-auto h-[calc(100vh-2rem)]">
      <Card className="shadow-lg mb-6">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Calendario Mensual</CardTitle>
              <CardDescription>
                {punchesData && (
                  <>
                    {punchesData.total_punches} {punchesData.total_punches === 1 ? 'fichaje' : 'fichajes'} de {punchesData.total_employees} {punchesData.total_employees === 1 ? 'empleado' : 'empleados'}
                  </>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={year.toString()} onValueChange={handleYearChange}>
                <SelectTrigger className="w-[100px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={month.toString()} onValueChange={handleMonthChange}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, index) => (
                    <SelectItem key={index + 1} value={(index + 1).toString()}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1 border rounded-md p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToPreviousMonth}
                  disabled={loading}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToNextMonth}
                  disabled={loading}
                  className="h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              {/* Encabezados de días de la semana */}
              <div className="grid grid-cols-7 gap-2.5 mb-2">
                {WEEKDAYS.map((day, index) => {
                  const isWeekend = index === 5 || index === 6; // Sábado (5) o Domingo (6)
                  return (
                    <div
                      key={index}
                      className={cn(
                        "text-center text-sm font-semibold py-2.5 px-1 rounded-md",
                        isWeekend 
                          ? "text-muted-foreground bg-muted/50" 
                          : "text-muted-foreground"
                      )}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>

              {/* Días del calendario */}
              <div className="grid grid-cols-7 gap-2.5">
                {days.map((day, index) => {
                  const dayNumber = day.getDate();
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isCurrentDay = isToday(day);
                  const dayOfWeek = day.getDay(); // 0 = Domingo, 6 = Sábado
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                  // Solo obtener datos si el día pertenece al mes actual
                  const dayData = isCurrentMonth ? getDayData(dayNumber) : { punches: [], incidents: [], anomalies: [] };
                  const punches = dayData.punches || [];
                  const incidents = dayData.incidents || [];
                  const anomalies = dayData.anomalies || [];
                  const punchCount = punches.length;
                  const employeeCount = getDayEmployees(dayNumber);
                  const hasPunches = punchCount > 0;
                  const hasIncidents = incidents.length > 0;
                  const hasAnomalies = anomalies.length > 0;
                  const hasIssues = hasIncidents || hasAnomalies;

                  return (
                    <button
                      key={index}
                      onClick={() => (hasPunches || hasIssues) && isCurrentMonth && handleDayClick(dayNumber, day)}
                      disabled={!hasPunches && !hasIssues || !isCurrentMonth}
                      className={cn(
                        'relative min-h-[110px] p-2.5 rounded-lg border transition-all duration-200',
                        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                        'shadow-sm hover:shadow-md',
                        !isCurrentMonth && 'opacity-30',
                        isCurrentDay && 'border-primary border-2 shadow-md ring-2 ring-primary/20',
                        (hasPunches || hasIssues) && isCurrentMonth && 'cursor-pointer hover:scale-[1.02] hover:shadow-lg',
                        !hasPunches && !hasIssues && 'cursor-default',
                        !isCurrentMonth && 'bg-muted/20',
                        isCurrentMonth && !hasPunches && !hasIssues && !isWeekend && 'bg-background hover:bg-muted/50',
                        hasIncidents && !hasAnomalies && 'border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-950/20 shadow-red-100 dark:shadow-red-950',
                        hasAnomalies && !hasIncidents && 'border-orange-400 dark:border-orange-600 bg-orange-50 dark:bg-orange-950/20 shadow-orange-100 dark:shadow-orange-950',
                        hasIncidents && hasAnomalies && 'border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-950/20 shadow-red-100 dark:shadow-red-950',
                        isWeekend && isCurrentMonth && !hasPunches && !hasIssues && 'bg-gray-200 dark:bg-gray-800/70',
                        isWeekend && isCurrentMonth && (hasPunches || hasIssues) && 'bg-gray-100/50 dark:bg-gray-800/30'
                      )}
                    >
                      <div className="flex flex-col h-full relative">
                        <div
                          className={cn(
                            'text-lg font-normal absolute top-1.5 right-2',
                            isCurrentDay && 'text-primary',
                            !isCurrentMonth && 'text-muted-foreground opacity-50',
                            isCurrentMonth && !isCurrentDay && 'text-foreground'
                          )}
                        >
                          {dayNumber}
                        </div>
                        {(hasPunches || hasIssues) && (
                          <div className="flex-1 space-y-1.5 mt-6">
                            {hasPunches && (
                              <>
                                <div className="flex items-center gap-1.5 text-xs">
                                  <CalendarIcon className="h-3.5 w-3.5 text-green-600 dark:text-green-500 flex-shrink-0" />
                                  <span className="text-green-700 dark:text-green-400 font-semibold leading-tight">
                                    {punchCount} {punchCount === 1 ? 'fichaje' : 'fichajes'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs">
                                  <div className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-500 flex-shrink-0" />
                                  <span className="text-blue-700 dark:text-blue-400 font-medium leading-tight">
                                    {employeeCount} {employeeCount === 1 ? 'empleado' : 'empleados'}
                                  </span>
                                </div>
                              </>
                            )}
                            {hasIncidents && (
                              <div className="flex items-center gap-1.5 text-xs">
                                <AlertTriangle className="h-3.5 w-3.5 text-red-600 dark:text-red-400 flex-shrink-0" />
                                <span className="text-red-600 dark:text-red-400 font-semibold leading-tight">
                                  {incidents.length} {incidents.length === 1 ? 'incidencia' : 'incidencias'}
                                </span>
                              </div>
                            )}
                            {hasAnomalies && (
                              <div className="flex items-center gap-1.5 text-xs">
                                <AlertCircle className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                                <span className="text-orange-600 dark:text-orange-400 font-semibold leading-tight">
                                  {anomalies.length} {anomalies.length === 1 ? 'anomalía' : 'anomalías'}
                                </span>
                              </div>
                            )}
                            {/* Indicadores visuales */}
                            {hasPunches && (
                              <div className="flex gap-1 mt-2 pt-1.5 border-t border-border/50">
                                {punches
                                  .filter((p) => p.event_type === 'IN')
                                  .slice(0, 3)
                                  .map((p, idx) => (
                                    <div
                                      key={idx}
                                      className="h-2 w-full rounded-full bg-gradient-to-r from-green-500 to-green-600 shadow-sm"
                                      title={`Entrada: ${format(new Date(p.timestamp), 'HH:mm', { locale: es })}`}
                                    />
                                  ))}
                              </div>
                            )}
                            {punches.filter((p) => p.event_type === 'IN').length > 3 && (
                              <div className="text-[10px] text-muted-foreground font-medium">
                                +{punches.filter((p) => p.event_type === 'IN').length - 3} más
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Leyenda */}
              <div className="flex flex-wrap items-center gap-4 pt-5 mt-5 border-t border-border/50">
                <div className="flex items-center gap-2.5">
                  <div className="h-4 w-4 rounded-md border-2 border-primary shadow-sm" />
                  <span className="text-sm text-muted-foreground font-medium">Hoy</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="h-4 w-4 rounded-md border border-border bg-green-100 dark:bg-green-900/20 shadow-sm" />
                  <span className="text-sm text-muted-foreground font-medium">Con fichajes</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="h-4 w-4 rounded-md border border-red-400 dark:border-red-600 bg-red-100 dark:bg-red-900/20 shadow-sm" />
                  <span className="text-sm text-muted-foreground font-medium">Con incidencias</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="h-4 w-4 rounded-md border border-orange-400 dark:border-orange-600 bg-orange-100 dark:bg-orange-900/20 shadow-sm" />
                  <span className="text-sm text-muted-foreground font-medium">Con anomalías</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="h-2 w-8 rounded-full bg-gradient-to-r from-green-500 to-green-600 shadow-sm" />
                  <span className="text-sm text-muted-foreground font-medium">Indicador de entrada</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de detalles del día */}
      {selectedDay !== null && (
        <PunchDayDialog
          day={selectedDay}
          month={month}
          year={year}
          punches={selectedDayPunches}
          open={selectedDay !== null}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedDay(null);
              setSelectedDayPunches([]);
            }
          }}
        />
      )}
    </div>
  );
}

