'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { getToastTheme } from '@/customs/reactHotToast';
import { getPunchesByMonth } from '@/services/punchService';
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
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [punchesData, setPunchesData] = useState(null);
  const [selectedDayPunches, setSelectedDayPunches] = useState([]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  // Cargar fichajes del mes
  useEffect(() => {
    const loadPunches = async () => {
      if (!session?.user?.accessToken) return;

      try {
        setLoading(true);
        const token = session.user.accessToken;
        const data = await getPunchesByMonth(year, month, token);
        setPunchesData(data);
      } catch (error) {
        console.error('Error al cargar fichajes:', error);
        toast.error('Error al cargar los fichajes del mes', getToastTheme());
      } finally {
        setLoading(false);
      }
    };

    loadPunches();
  }, [year, month, session]);

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
  const handleDayClick = (day) => {
    const dayData = getDayData(day);
    if (dayData.punches.length > 0 || dayData.incidents.length > 0 || dayData.anomalies.length > 0) {
      setSelectedDayPunches(dayData);
      setSelectedDay(day);
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
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Calendario Mensual</CardTitle>
              <CardDescription>
                {punchesData && (
                  <>
                    {punchesData.total_punches} fichaje(s) de {punchesData.total_employees} empleado(s)
                  </>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={year.toString()} onValueChange={handleYearChange}>
                <SelectTrigger className="w-[100px]">
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
                <SelectTrigger className="w-[140px]">
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
              <Button
                variant="outline"
                size="icon"
                onClick={goToPreviousMonth}
                disabled={loading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={goToNextMonth}
                disabled={loading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={goToCurrentMonth}
                disabled={loading}
              >
                Hoy
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Encabezados de días de la semana */}
              <div className="grid grid-cols-7 gap-2">
                {WEEKDAYS.map((day, index) => (
                  <div
                    key={index}
                    className="text-center text-sm font-medium text-muted-foreground p-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Días del calendario */}
              <div className="grid grid-cols-7 gap-2">
                {days.map((day, index) => {
                  const dayNumber = day.getDate();
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isCurrentDay = isToday(day);
                  const dayData = getDayData(dayNumber);
                  const punches = dayData.punches || [];
                  const incidents = dayData.incidents || [];
                  const anomalies = dayData.anomalies || [];
                  const punchCount = punches.length;
                  const employeeCount = getDayEmployees(dayNumber);
                  const hasPunches = punchCount > 0;
                  const hasIssues = incidents.length > 0 || anomalies.length > 0;

                  return (
                    <button
                      key={index}
                      onClick={() => (hasPunches || hasIssues) && handleDayClick(dayNumber)}
                      disabled={!hasPunches && !hasIssues}
                      className={cn(
                        'relative min-h-[100px] p-2 rounded-lg border transition-colors',
                        'hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                        !isCurrentMonth && 'opacity-40',
                        isCurrentDay && 'border-primary border-2',
                        (hasPunches || hasIssues) && 'cursor-pointer hover:border-primary',
                        !hasPunches && !hasIssues && 'cursor-default',
                        hasIssues && 'border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-950/20'
                      )}
                    >
                      <div className="flex flex-col h-full">
                        <div
                          className={cn(
                            'text-sm font-medium mb-1',
                            isCurrentDay && 'text-primary'
                          )}
                        >
                          {dayNumber}
                        </div>
                        {(hasPunches || hasIssues) && (
                          <div className="flex-1 space-y-1">
                            {hasPunches && (
                              <>
                                <div className="flex items-center gap-1 text-xs">
                                  <CalendarIcon className="h-3 w-3 text-green-600" />
                                  <span className="text-green-700 dark:text-green-400 font-medium">
                                    {punchCount} fichaje(s)
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-xs">
                                  <span className="text-blue-700 dark:text-blue-400 font-medium">
                                    {employeeCount} empleado(s)
                                  </span>
                                </div>
                              </>
                            )}
                            {incidents.length > 0 && (
                              <div className="flex items-center gap-1 text-xs">
                                <span className="text-orange-600 dark:text-orange-400 font-medium">
                                  ⚠️ {incidents.length} incidencia(s)
                                </span>
                              </div>
                            )}
                            {anomalies.length > 0 && (
                              <div className="flex items-center gap-1 text-xs">
                                <span className="text-red-600 dark:text-red-400 font-medium">
                                  ⚠️ {anomalies.length} anomalía(s)
                                </span>
                              </div>
                            )}
                            {/* Indicadores visuales */}
                            <div className="flex gap-1 mt-1">
                              {punches
                                .filter((p) => p.event_type === 'IN')
                                .slice(0, 3)
                                .map((p, idx) => (
                                  <div
                                    key={idx}
                                    className="h-1.5 w-full rounded bg-green-500"
                                    title={`Entrada: ${format(new Date(p.timestamp), 'HH:mm', { locale: es })}`}
                                  />
                                ))}
                            </div>
                            {punches.filter((p) => p.event_type === 'IN').length > 3 && (
                              <div className="text-xs text-muted-foreground">
                                +{punches.filter((p) => p.event_type === 'IN').length - 3} más
                              </div>
                            )}
                          </div>
                        )}
                        {!hasPunches && isCurrentMonth && (
                          <div className="flex-1 flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">Sin fichajes</span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Leyenda */}
              <div className="flex flex-wrap items-center gap-4 pt-4 border-t text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded border-2 border-primary" />
                  <span className="text-muted-foreground">Hoy</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded border bg-green-100 dark:bg-green-900/20" />
                  <span className="text-muted-foreground">Con fichajes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded border bg-yellow-100 dark:bg-yellow-900/20 border-yellow-400 dark:border-yellow-600" />
                  <span className="text-muted-foreground">Con incidencias/anomalías</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-8 rounded bg-green-500" />
                  <span className="text-muted-foreground">Indicador de entrada</span>
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

