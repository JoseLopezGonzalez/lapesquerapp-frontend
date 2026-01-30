'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle2, Clock, User, Calendar as CalendarIcon, AlertTriangle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function PunchDayDialog({ day, month, year, punches, open, onOpenChange }) {
  // Manejar nueva estructura: { punches: [], incidents: [], anomalies: [] }
  const dayData = punches && typeof punches === 'object' && !Array.isArray(punches)
    ? punches
    : { punches: Array.isArray(punches) ? punches : [], incidents: [], anomalies: [] };
  
  const punchesList = dayData.punches || [];
  const incidents = dayData.incidents || [];
  const anomalies = dayData.anomalies || [];
  
  // Agrupar fichajes por empleado
  const punchesByEmployee = {};
  punchesList.forEach((punch) => {
    if (!punchesByEmployee[punch.employee_id]) {
      punchesByEmployee[punch.employee_id] = {
        employee_id: punch.employee_id,
        employee_name: punch.employee_name || `Empleado ${punch.employee_id}`,
        punches: [],
      };
    }
    punchesByEmployee[punch.employee_id].punches.push(punch);
  });

  // Ordenar fichajes de cada empleado por timestamp
  Object.values(punchesByEmployee).forEach((emp) => {
    emp.punches.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  });

  // Calcular duración de sesiones
  const calculateSessionDuration = (punches) => {
    const sessions = [];
    let currentSession = null;

    punches.forEach((punch) => {
      if (punch.event_type === 'IN') {
        currentSession = {
          entry: punch,
          exit: null,
        };
      } else if (punch.event_type === 'OUT' && currentSession) {
        currentSession.exit = punch;
        const entryTime = new Date(currentSession.entry.timestamp);
        const exitTime = new Date(punch.timestamp);
        const duration = exitTime - entryTime;
        const hours = Math.floor(duration / (1000 * 60 * 60));
        const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
        sessions.push({
          ...currentSession,
          duration: { hours, minutes, totalMinutes: Math.floor(duration / (1000 * 60)) },
        });
        currentSession = null;
      }
    });

    // Si hay una entrada sin salida
    if (currentSession) {
      sessions.push({
        ...currentSession,
        duration: null,
      });
    }

    return sessions;
  };

  // Normalizar timestamps de incidencias
  const normalizeIncidentTimestamp = (timestamp) => {
    if (timestamp && typeof timestamp === 'string' && !timestamp.includes('T')) {
      return timestamp.replace(' ', 'T') + '.000Z';
    }
    return timestamp;
  };

  const date = new Date(year, month - 1, day);
  const dateFormatted = format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Fichajes del {dateFormatted}
          </DialogTitle>
          <DialogDescription>
            {punchesList.length} fichaje(s) de {Object.keys(punchesByEmployee).length} empleado(s)
            {incidents.length > 0 && ` • ${incidents.length} incidencia(s)`}
            {anomalies.length > 0 && ` • ${anomalies.length} anomalía(s)`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4 overflow-y-auto flex-1 pr-2">
          {/* Incidencias */}
          {incidents.length > 0 && (
            <div className="border rounded-lg">
              <Accordion type="multiple" defaultValue={['incidents']} className="w-full">
                <AccordionItem value="incidents" className="border-0">
                  <AccordionTrigger className="hover:no-underline px-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                        <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-base">Incidencias</div>
                        <div className="text-sm text-muted-foreground">
                          {incidents.length} entrada(s) sin salida correspondiente
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800">
                        {incidents.length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2 pb-4 px-4">
                      {incidents.map((incident, idx) => (
                        <div
                          key={idx}
                          className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg"
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                              <User className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="font-medium text-base">{incident.employee_name}</div>
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-orange-600" />
                                  <div>
                                    <span className="text-muted-foreground">Entrada: </span>
                                    <span className="font-medium">
                                      {incident.entry_time || format(new Date(normalizeIncidentTimestamp(incident.entry_timestamp)), 'HH:mm:ss', { locale: es })}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {incident.device_id === 'manual-admin' ? 'Manual' : incident.device_id}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}

          {/* Anomalías */}
          {anomalies.length > 0 && (
            <div className="border rounded-lg">
              <Accordion type="multiple" defaultValue={['anomalies']} className="w-full">
                <AccordionItem value="anomalies" className="border-0">
                  <AccordionTrigger className="hover:no-underline px-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-base">Anomalías</div>
                        <div className="text-sm text-muted-foreground">
                          Jornadas con horas fuera de lo normal
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800">
                        {anomalies.length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2 pb-4 px-4">
                      {anomalies.map((anomaly, idx) => (
                        <div
                          key={idx}
                          className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg"
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20">
                              <User className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="font-medium text-base">{anomaly.employee_name}</div>
                              <div className="space-y-1 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Motivo: </span>
                                  <span className="font-medium">{anomaly.reason_label || anomaly.reason}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div>
                                    <span className="text-muted-foreground">Horas trabajadas: </span>
                                    <span className="font-medium">{anomaly.hours}h</span>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Fecha: {anomaly.date}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}

          {/* Fichajes por empleado */}
          {Object.keys(punchesByEmployee).length > 0 && (
            <Accordion type="multiple" className="w-full space-y-3">
                {Object.values(punchesByEmployee).map((emp) => {
                  const sessions = calculateSessionDuration(emp.punches);
                  const totalMinutes = sessions
                    .filter((s) => s.duration)
                    .reduce((sum, s) => sum + s.duration.totalMinutes, 0);
                  const totalHours = Math.floor(totalMinutes / 60);
                  const remainingMinutes = totalMinutes % 60;

                  return (
                    <AccordionItem key={emp.employee_id} value={`emp-${emp.employee_id}`} className="border rounded-lg">
                      <AccordionTrigger className="hover:no-underline px-4">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-muted">
                              <User className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="text-left">
                              <div className="font-medium">{emp.employee_name}</div>
                              <div className="text-sm text-muted-foreground">
                                {emp.punches.length} fichaje(s) • {sessions.length} sesión(es)
                              </div>
                            </div>
                          </div>
                          {totalMinutes > 0 && (
                            <Badge variant="outline" className="ml-auto">
                              {totalHours}h {remainingMinutes}m
                            </Badge>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 px-4 pb-4">
                          {sessions.map((session, idx) => (
                            <div
                              key={idx}
                              className={cn(
                                'p-4 border rounded-lg',
                                session.duration
                                  ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                                  : 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800'
                              )}
                            >
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <CheckCircle2
                                    className={cn(
                                      'h-4 w-4',
                                      session.duration ? 'text-green-600' : 'text-yellow-600'
                                    )}
                                  />
                                  <span className="font-medium">Sesión {idx + 1}</span>
                                  {session.duration && (
                                    <Badge variant="outline" className="ml-2">
                                      {session.duration.hours}h {session.duration.minutes}m
                                    </Badge>
                                  )}
                                  {!session.duration && (
                                    <Badge
                                      variant="outline"
                                      className="ml-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                    >
                                      Sin salida
                                    </Badge>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Clock className="h-3 w-3 text-green-600" />
                                      Entrada
                                    </div>
                                    <div className="font-medium text-base">
                                      {format(new Date(session.entry.timestamp), 'HH:mm:ss', { locale: es })}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {session.entry.device_id === 'manual-admin' ? 'Manual' : session.entry.device_id}
                                    </div>
                                  </div>
                                  {session.exit ? (
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Clock className="h-3 w-3 text-orange-600" />
                                        Salida
                                      </div>
                                      <div className="font-medium text-base">
                                        {format(new Date(session.exit.timestamp), 'HH:mm:ss', { locale: es })}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {session.exit.device_id === 'manual-admin' ? 'Manual' : session.exit.device_id}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Clock className="h-3 w-3 text-yellow-600" />
                                        Salida
                                      </div>
                                      <div className="font-medium text-base text-yellow-600">Pendiente</div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

