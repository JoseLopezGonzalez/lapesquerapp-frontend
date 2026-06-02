'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usePunchesDashboard } from '@/hooks/usePunches';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Users,
  UserCheck,
  LogIn,
  LogOut,
  PlayCircle,
  PauseCircle,
  XCircle,
  Activity,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { formatDateHour } from '@/helpers/formats/dates/formatDates';

export function WorkingEmployeesCard() {
  const { data, isLoading } = usePunchesDashboard();

  if (isLoading) {
    return (
      <Card className="w-full max-w-full overflow-hidden">
        <CardHeader className="space-y-4 pb-2">
          <div>
            <CardTitle>
              <Skeleton className="mt-2 h-6 w-40" />
            </CardTitle>
            <CardDescription>
              <Skeleton className="mt-2 h-4 w-1/2" />
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex w-full flex-col gap-1">
              <div className="flex w-full items-center justify-between">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/4" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const statistics = data?.statistics || {};
  const allEmployees = data?.allEmployees || [];
  const recentPunches = data?.recentPunches || [];
  const errors = data?.errors || {};
  const missingPunches = errors?.missingPunches || [];
  const totalMissingPunches = errors?.totalMissingPunches || 0;
  const totalWorking = statistics.totalWorking || 0;
  const totalEmployees = statistics.totalEmployees || 0;
  const totalEntriesToday = statistics.totalEntriesToday || 0;
  const totalExitsToday = statistics.totalExitsToday || 0;

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      return formatDateHour(timestamp);
    } catch {
      return '';
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      trabajando: {
        label: 'Trabajando',
        icon: PlayCircle,
        className: 'bg-primary/10 text-primary border-primary/20',
      },
      descansando: {
        label: 'Descansando',
        icon: PauseCircle,
        className: 'bg-muted text-muted-foreground border-border',
      },
      no_ha_fichado: {
        label: 'No ha fichado',
        icon: XCircle,
        className: 'bg-muted text-muted-foreground border-border',
      },
      ha_finalizado: {
        label: 'Finalizado',
        icon: PauseCircle,
        className: 'bg-muted text-muted-foreground border-border',
      },
    };
    return statusConfig[status] || statusConfig.no_ha_fichado;
  };

  const workingPercentage =
    totalEmployees > 0 ? ((totalWorking / totalEmployees) * 100).toFixed(1) : 0;

  const employeesByStatus = {
    trabajando: allEmployees.filter((e) => e.status === 'trabajando'),
    descansando: allEmployees.filter((e) => e.status === 'descansando'),
    ha_finalizado: allEmployees.filter((e) => e.status === 'ha_finalizado'),
    no_ha_fichado: allEmployees.filter((e) => e.status === 'no_ha_fichado'),
  };

  const otherStatuses = [
    ...employeesByStatus.descansando,
    ...employeesByStatus.ha_finalizado,
    ...employeesByStatus.no_ha_fichado,
  ];

  return (
    <Card className="w-full max-w-full overflow-hidden">
      <CardHeader className="space-y-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle>Trabajadores</CardTitle>
            <CardDescription>
              {totalWorking} de {totalEmployees} trabajadores activos
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium"
          >
            <UserCheck className="h-3.5 w-3.5" />
            {totalWorking}/{totalEmployees}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-muted/50 flex flex-col items-center rounded-lg border p-3">
            <div className="mb-1.5 flex items-center gap-1.5">
              <LogIn className="text-muted-foreground h-3.5 w-3.5" />
              <span className="text-foreground text-lg font-bold">{totalEntriesToday}</span>
            </div>
            <span className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
              Entradas
            </span>
          </div>
          <div className="bg-muted/50 flex flex-col items-center rounded-lg border p-3">
            <div className="mb-1.5 flex items-center gap-1.5">
              <LogOut className="text-muted-foreground h-3.5 w-3.5" />
              <span className="text-foreground text-lg font-bold">{totalExitsToday}</span>
            </div>
            <span className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
              Salidas
            </span>
          </div>
          <div className="bg-muted/50 flex flex-col items-center rounded-lg border p-3">
            <div className="mb-1.5 flex items-center gap-1.5">
              <Activity className="text-muted-foreground h-3.5 w-3.5" />
              <span className="text-foreground text-lg font-bold">{workingPercentage}%</span>
            </div>
            <span className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
              Actividad
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">Tasa de actividad del día</span>
            <span className="text-foreground font-semibold">{workingPercentage}%</span>
          </div>
          <div className="bg-muted h-2.5 w-full overflow-hidden rounded-full">
            <div
              className="bg-primary/80 h-full transition-all duration-500 ease-out"
              style={{ width: `${workingPercentage}%` }}
            />
          </div>
        </div>

        {allEmployees.length > 0 ? (
          <div className="space-y-4">
            {employeesByStatus.trabajando.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b pb-1">
                  <div className="flex items-center gap-2">
                    <PlayCircle className="text-primary h-4 w-4" />
                    <span className="text-sm font-semibold">Trabajando ahora</span>
                  </div>
                  <Badge variant="secondary" className="px-2 py-0.5 text-[10px]">
                    {employeesByStatus.trabajando.length}
                  </Badge>
                </div>
                <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
                  {employeesByStatus.trabajando.slice(0, 8).map((employee) => {
                    const statusConfig = getStatusBadge(employee.status);
                    const StatusIcon = statusConfig.icon;
                    return (
                      <div
                        key={employee.id}
                        className="bg-muted/30 flex items-center justify-between rounded-md border p-2.5"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <span className="truncate text-sm font-medium">{employee.name}</span>
                          <Badge
                            variant="outline"
                            className={`gap-1 px-1.5 py-0.5 text-[10px] ${statusConfig.className}`}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <div className="ml-2 flex items-center gap-2">
                          <span className="text-foreground text-xs font-semibold whitespace-nowrap">
                            {employee.todayTotalHoursFormatted || '0h'}
                          </span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  className="text-muted-foreground hover:text-foreground inline-flex"
                                  aria-label="Ver detalles del trabajador"
                                >
                                  <Info className="h-3.5 w-3.5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <div className="space-y-1 text-xs">
                                  <p className="font-semibold">{employee.name}</p>
                                  <p>Entradas hoy: {employee.todayEntriesCount || 0}</p>
                                  <p>Sesiones: {employee.completeSessionsCount || 0}</p>
                                  {employee.currentEntryTimestamp && (
                                    <p>Última entrada: {formatTime(employee.currentEntryTimestamp)}</p>
                                  )}
                                  {employee.currentSessionFormatted && (
                                    <p>Sesión actual: {employee.currentSessionFormatted}</p>
                                  )}
                                  {employee.breakTimeFormatted && (
                                    <p>Descanso: {employee.breakTimeFormatted}</p>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    );
                  })}
                  {employeesByStatus.trabajando.length > 8 && (
                    <div className="text-muted-foreground pt-1 text-center text-[10px] font-medium">
                      +{employeesByStatus.trabajando.length - 8} más
                    </div>
                  )}
                </div>
              </div>
            )}

            {otherStatuses.length > 0 && (
              <div className="space-y-2.5 border-t pt-3">
                <div className="flex items-center gap-2 pb-1">
                  <Activity className="text-muted-foreground h-3.5 w-3.5" />
                  <span className="text-sm font-semibold">Otros estados</span>
                </div>
                <div className="max-h-40 space-y-1.5 overflow-y-auto">
                  {otherStatuses.slice(0, 6).map((employee) => {
                    const statusConfig = getStatusBadge(employee.status);
                    const StatusIcon = statusConfig.icon;
                    return (
                      <div
                        key={employee.id}
                        className="bg-muted/30 flex items-center justify-between rounded-md border p-2 text-xs"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <StatusIcon className="text-muted-foreground h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate font-medium">{employee.name}</span>
                        </div>
                        <div className="ml-2 flex items-center gap-2">
                          <span className="text-muted-foreground font-mono text-[10px]">
                            {employee.todayTotalHoursFormatted || '0h'}
                          </span>
                          <Badge variant="outline" className={`px-1.5 py-0.5 text-[10px] ${statusConfig.className}`}>
                            {statusConfig.label}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                  {otherStatuses.length > 6 && (
                    <div className="text-muted-foreground pt-1 text-center text-[10px] font-medium">
                      +{otherStatuses.length - 6} más
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-muted-foreground py-8 text-center">
            <Users className="mx-auto mb-3 h-10 w-10 opacity-40" />
            <p className="text-sm font-medium">No hay trabajadores registrados</p>
          </div>
        )}

        {recentPunches.length > 0 && (
          <div className="space-y-2.5 border-t pt-3">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <Activity className="text-muted-foreground h-3.5 w-3.5" />
                <span className="text-sm font-semibold">Movimientos recientes</span>
              </div>
              <span className="text-muted-foreground text-[10px] font-medium">Últimos 30 min</span>
            </div>
            <div className="max-h-32 space-y-1.5 overflow-y-auto">
              {recentPunches.slice(0, 4).map((punch) => (
                <div
                  key={punch.id}
                  className="bg-muted/30 flex items-center justify-between rounded-md border p-2 text-xs"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    {punch.eventType === 'IN' ? (
                      <LogIn className="text-muted-foreground h-3.5 w-3.5" />
                    ) : (
                      <LogOut className="text-muted-foreground h-3.5 w-3.5" />
                    )}
                    <span className="truncate font-medium">{punch.employeeName}</span>
                  </div>
                  <div className="ml-2 flex items-center gap-2">
                    <span className="text-muted-foreground font-mono text-[10px]">
                      {formatDateTime(punch.timestamp)}
                    </span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-foreground inline-flex"
                            aria-label="Ver detalle del fichaje"
                          >
                            <Info className="h-3.5 w-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-xs">
                            {punch.eventType === 'IN' ? 'Entrada' : 'Salida'} de{' '}
                            <span className="font-semibold">{punch.employeeName}</span>
                          </p>
                          <p className="text-xs">{formatDateHour(punch.timestamp)}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {missingPunches.length > 0 && (
          <div className="space-y-2.5 border-t pt-3">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-muted-foreground h-3.5 w-3.5" />
                <span className="text-sm font-semibold">Incidencias abiertas</span>
              </div>
              <Badge variant="outline" className="px-2 py-0.5 text-[10px]">
                {totalMissingPunches}
              </Badge>
            </div>
            <div className="max-h-32 space-y-1.5 overflow-y-auto">
              {missingPunches.slice(0, 3).map((incident, index) => (
                <div key={index} className="bg-muted/30 flex items-center justify-between rounded-md border p-2 text-xs">
                  <div className="min-w-0 flex-1">
                    <span className="text-foreground block truncate font-medium">
                      {incident.employeeName}
                    </span>
                    <span className="text-muted-foreground block text-[10px]">
                      {new Date(incident.date).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground ml-2 inline-flex"
                          aria-label="Ver detalle de la incidencia"
                        >
                          <Info className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <div className="space-y-1 text-xs">
                          <p className="font-semibold">{incident.employeeName}</p>
                          <p>Fecha: {new Date(incident.date).toLocaleDateString('es-ES')}</p>
                          {incident.daysAgo !== undefined && (
                            <p>{incident.daysAgo === 1 ? 'Ayer' : `Hace ${incident.daysAgo} días`}</p>
                          )}
                          {incident.entryTimestamp && <p>Entrada: {formatDateTime(incident.entryTimestamp)}</p>}
                          {incident.hoursOpen !== undefined && <p>Sin salida: {incident.hoursOpen.toFixed(1)}h</p>}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              ))}
              {missingPunches.length > 3 && (
                <div className="text-muted-foreground pt-1 text-center text-[10px] font-medium">
                  +{missingPunches.length - 3} más
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
