'use client';

import Link from 'next/link';
import * as React from 'react';
import { Calendar, Check, ChevronLeft, ChevronRight, ExternalLink, Filter, MoreVertical, XCircle } from 'lucide-react';
import { eachDayOfInterval, endOfMonth, endOfWeek, format, getDay, isSameMonth, isToday, startOfMonth, startOfWeek } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DatePicker } from '@/components/ui/datePicker';
import { EmptyState } from '@/components/Utilities/EmptyState';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import Loader from '@/components/Utilities/Loader';
import { notify } from '@/lib/notifications';
import { cn } from '@/lib/utils';
import { useAgenda, useAgendaMutations, useAgendaSummary } from '@/hooks/useAgenda';
import QuickInteractionModal from './QuickInteractionModal';
import { agendaStatusLabels, formatDateValue, getStatusTone, isOverdueDate, toneClasses } from './utils';

const STATUS_OPTIONS = ['pending', 'reprogrammed', 'done', 'cancelled'];
const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const TARGET_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'prospect', label: 'Prospectos' },
  { value: 'customer', label: 'Clientes' },
];

const toneDotClasses = {
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  amber: 'bg-amber-500',
  slate: 'bg-slate-500',
  green: 'bg-green-500',
  violet: 'bg-violet-500',
};

function SummaryStat({ title, count, tone = 'slate' }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/30 px-2 py-0.5 text-[11px] text-foreground">
      <span className={`size-1.5 shrink-0 rounded-full ${toneDotClasses[tone] ?? toneDotClasses.slate}`} aria-hidden />
      <span>{title}</span>
      <span className="tabular-nums font-medium">{count}</span>
    </span>
  );
}

function AgendaStatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${toneClasses(getStatusTone(status))}`}>
      {agendaStatusLabels[status] ?? status}
    </span>
  );
}

function AgendaToolbar({
  monthLabel,
  targetType,
  onTargetTypeChange,
  statuses,
  onToggleStatus,
  summary,
  visiblePendingCount,
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="sr-only">{monthLabel}</p>
          <p className="sr-only">Vista mensual activa con filtros integrados.</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <SummaryStat title="Vencidas" count={summary.overdue.length} tone="red" />
          <SummaryStat title="Hoy" count={summary.today.length} tone="blue" />
          <SummaryStat title="Próximas" count={summary.next.length} tone="amber" />
          <SummaryStat title="Pendientes" count={visiblePendingCount} tone="slate" />
        </div>
      </div>
    </div>
  );
}

function AgendaEventRow({ item, onReschedule, onCancel, onComplete }) {
  const isPending = item.status === 'pending';
  const isOverdue = isPending && isOverdueDate(item.scheduledAt);
  const href = item.target.type === 'customer' ? `/comercial/clientes/${item.target.id}` : `/comercial/prospectos/${item.target.id}`;
  const targetLabel = item.target.type === 'customer' ? 'Cliente' : 'Prospecto';

  return (
    <Card
      size="sm"
      className={cn(
        'transition-colors',
        isOverdue && 'border-red-300 bg-red-50/50 dark:border-red-800 dark:bg-red-950/30'
      )}
    >
      <CardContent className="py-0">
        <div className="space-y-2 sm:space-y-2">
          <div className="flex items-center gap-2 flex-wrap justify-between">
            <div className="flex items-center gap-1.5 flex-wrap">
              <AgendaStatusBadge status={item.status} />
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Acciones">
                    <MoreVertical />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[12rem]">
                  {isPending && (
                    <>
                      <DropdownMenuItem onSelect={() => onReschedule(item)}>
                        <Calendar />
                        Reprogramar
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => onComplete(item)}>
                        <Check />
                        Marcar hecha
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onSelect={() => onCancel(item)}>
                        <XCircle />
                        Cancelar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href={href} className="flex items-center gap-1.5">
                      <ExternalLink />
                      Abrir {targetLabel.toLowerCase()}
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div>
            <Link
              href={href}
              className="font-medium text-base truncate block hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
            >
              {item.label}
            </Link>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-muted-foreground mb-1 text-xs">Fecha</p>
              <p className="text-sm font-medium tabular-nums">
                {formatDateValue(item.scheduledAt)}
                {isOverdue && (
                  <span className="ml-2 text-xs font-medium text-destructive">· Vencida</span>
                )}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-muted-foreground mb-1 text-xs">Nota</p>
              <p className="text-sm font-medium whitespace-pre-wrap">{item.description || '—'}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RescheduleAgendaDialog({ open, onOpenChange, item, onConfirm, loading }) {
  const [nextActionAt, setNextActionAt] = React.useState(null);

  React.useEffect(() => {
    if (!open) return;
    setNextActionAt(item?.scheduledAt ? new Date(item.scheduledAt) : null);
  }, [open, item]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Reprogramar acción</DialogTitle>
          <DialogDescription>
            Selecciona la nueva fecha. Si no envías una nota, el backend conservará automáticamente la descripción actual.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Fecha nueva</Label>
            <DatePicker date={nextActionAt} onChange={setNextActionAt} formatStyle="short" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={loading || !nextActionAt}
            onClick={() =>
              onConfirm({
                nextActionAt: nextActionAt ? format(nextActionAt, 'yyyy-MM-dd') : null,
              })
            }
          >
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AgendaMonthCalendar({ currentMonth, onSelectDate, groupedEvents }) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return (
    <div className="space-y-3">
      {/* Encabezados de días de la semana (estilo calendario fichajes) */}
      <div className="grid grid-cols-7 gap-2.5 mb-2">
        {WEEKDAYS.map((day, index) => {
          const isWeekend = index === 5 || index === 6;
          return (
            <div
              key={day}
              className={cn(
                'text-center text-sm font-semibold py-2.5 px-1 rounded-md',
                isWeekend ? 'text-muted-foreground bg-muted/50' : 'text-muted-foreground'
              )}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* Días del calendario (estilo calendario fichajes) */}
      <div className="grid grid-cols-7 gap-2.5">
        {days.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const items = groupedEvents.get(dateKey) ?? [];
          const pendingCount = items.filter((item) => item.status === 'pending').length;
          const reprogrammedCount = items.filter((item) => item.status === 'reprogrammed').length;
          const doneCount = items.filter((item) => item.status === 'done').length;
          const cancelledCount = items.filter((item) => item.status === 'cancelled').length;
          const hasItems = items.length > 0;
          const inCurrentMonth = isSameMonth(day, currentMonth);
          const isCurrentDay = isToday(day);
          const dayOfWeek = getDay(day);
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const overduePending = items.some((item) => item.status === 'pending' && isOverdueDate(item.scheduledAt));

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => onSelectDate(day)}
              className={cn(
                'relative min-h-[110px] p-2.5 rounded-lg border transition-all duration-200 text-left',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                'shadow-sm hover:shadow-md',
                !inCurrentMonth && 'opacity-30 bg-muted/20',
                isCurrentDay && 'border-primary border-2 shadow-md ring-2 ring-primary/20',
                hasItems && inCurrentMonth && 'cursor-pointer hover:scale-[1.02] hover:shadow-lg',
                !hasItems && 'cursor-default',
                inCurrentMonth && !hasItems && !isWeekend && 'bg-background hover:bg-muted/50',
                isWeekend && inCurrentMonth && !hasItems && 'bg-gray-200 dark:bg-gray-800/70',
                isWeekend && inCurrentMonth && hasItems && 'bg-gray-100/50 dark:bg-gray-800/30',
                overduePending && inCurrentMonth && 'border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-950/20 shadow-red-100 dark:shadow-red-950'
              )}
            >
              <div className="flex flex-col h-full relative">
                <div
                  className={cn(
                    'text-lg font-normal absolute top-1.5 right-2',
                    isCurrentDay && 'text-primary',
                    !inCurrentMonth && 'text-muted-foreground opacity-50',
                    inCurrentMonth && !isCurrentDay && 'text-foreground'
                  )}
                >
                  {format(day, 'd')}
                </div>
                {hasItems && (
                  <div className="flex-1 space-y-1.5 mt-6">
                    {pendingCount > 0 && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <div className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-500 flex-shrink-0" />
                        <span className="text-blue-700 dark:text-blue-400 font-medium leading-tight">
                          {pendingCount} {pendingCount === 1 ? 'pend.' : 'pend.'}
                        </span>
                      </div>
                    )}
                    {doneCount > 0 && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <div className="h-2 w-2 rounded-full bg-green-600 dark:bg-green-500 flex-shrink-0" />
                        <span className="text-green-700 dark:text-green-400 font-medium leading-tight">
                          {doneCount} hechas
                        </span>
                      </div>
                    )}
                    {reprogrammedCount > 0 && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <div className="h-2 w-2 rounded-full bg-amber-500 dark:bg-amber-400 flex-shrink-0" />
                        <span className="text-amber-700 dark:text-amber-300 font-medium leading-tight">
                          {reprogrammedCount} reprog.
                        </span>
                      </div>
                    )}
                    {cancelledCount > 0 && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <div className="h-2 w-2 rounded-full bg-red-600 dark:bg-red-500 flex-shrink-0" />
                        <span className="text-red-700 dark:text-red-400 font-medium leading-tight">
                          {cancelledCount} canc.
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AgendaDayDialog({ open, onOpenChange, date, items, loading, onReschedule, onCancel, onComplete }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" className="max-h-[88vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{date ? `Agenda del ${formatDateValue(date)}` : 'Detalle del día'}</DialogTitle>
          <DialogDescription>
            {loading
              ? 'Cargando acciones del día seleccionado.'
              : `${items.length} ${items.length === 1 ? 'acción' : 'acciones'} para la fecha seleccionada.`}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh] pr-4">
          <div className="space-y-3 pb-2">
            {loading ? (
              <div className="flex min-h-[220px] items-center justify-center">
                <Loader />
              </div>
            ) : items.length === 0 ? (
              <EmptyState
                title="Sin acciones para este día"
                description="Elige otra fecha del calendario o amplía el rango de filtros."
                className="border bg-muted/20 min-h-[220px]"
              />
            ) : (
              items.map((item) => (
                <AgendaEventRow
                  key={String(item.agendaActionId)}
                  item={item}
                  onReschedule={onReschedule}
                  onCancel={onCancel}
                  onComplete={onComplete}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default function AgendaPageClient() {
  const [month, setMonth] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState(null);
  const [dayDialogOpen, setDayDialogOpen] = React.useState(false);
  const [targetType, setTargetType] = React.useState('all');
  const [statuses, setStatuses] = React.useState(['pending', 'reprogrammed', 'done', 'cancelled']);
  const [filtersDialogOpen, setFiltersDialogOpen] = React.useState(false);
  const [rescheduleDialog, setRescheduleDialog] = React.useState({ open: false, item: null });
  const [cancelDialog, setCancelDialog] = React.useState({ open: false, item: null });
  const [interactionModal, setInteractionModal] = React.useState({
    open: false,
    prospectId: null,
    customerId: null,
    agendaActionId: null,
    nextActionAt: null,
    nextActionNote: null,
    mode: 'create',
  });

  const agendaParams = React.useMemo(
    () => ({
      startDate: format(startOfMonth(month), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(month), 'yyyy-MM-dd'),
      targetType: targetType === 'all' ? undefined : targetType,
      status: statuses,
    }),
    [month, statuses, targetType]
  );

  const { data: events, isLoading } = useAgenda(agendaParams);
  const { data: summary, isLoading: summaryLoading } = useAgendaSummary({ limitNext: 10 });
  const { rescheduleAgendaAction, cancelAgendaAction } = useAgendaMutations();

  const groupedEvents = React.useMemo(
    () =>
      events.reduce((acc, item) => {
        const group = acc.get(item.scheduledAt) ?? [];
        group.push(item);
        acc.set(item.scheduledAt, group);
        return acc;
      }, new Map()),
    [events]
  );

  const selectedDayItems = React.useMemo(() => {
    if (!selectedDate) return [];
    return groupedEvents.get(format(selectedDate, 'yyyy-MM-dd')) ?? [];
  }, [groupedEvents, selectedDate]);

  const handleToggleStatus = (status) => {
    setStatuses((current) => {
      if (current.includes(status)) {
        return current.length === 1 ? current : current.filter((item) => item !== status);
      }
      return [...current, status];
    });
  };

  const handleReschedule = async (payload) => {
    if (!rescheduleDialog.item?.agendaActionId || !payload.nextActionAt) return;
    try {
      await notify.promise(
        rescheduleAgendaAction.mutateAsync({
          id: rescheduleDialog.item.agendaActionId,
          payload,
        }),
        {
          loading: 'Reprogramando acción...',
          success: 'Acción reprogramada',
          error: (error) => error?.message || 'No se pudo reprogramar la acción',
        }
      );
      setRescheduleDialog({ open: false, item: null });
    } catch {}
  };

  const handleCancel = async () => {
    if (!cancelDialog.item?.agendaActionId) return;
    try {
      await notify.promise(cancelAgendaAction.mutateAsync(cancelDialog.item.agendaActionId), {
        loading: 'Cancelando acción...',
        success: 'Acción cancelada',
        error: (error) => error?.message || 'No se pudo cancelar la acción',
      });
      setCancelDialog({ open: false, item: null });
    } catch {}
  };

  const handleOpenDay = (date) => {
    setSelectedDate(date);
    setDayDialogOpen(Boolean(date));
  };

  return (
    <>
      <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto px-4 py-3 md:px-6">
        <Card className="flex-1 overflow-hidden">
          <CardHeader className="space-y-3 pb-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Calendario mensual
                </CardTitle>
                <CardDescription>La agenda se trabaja desde el calendario. Pulsa un día para abrir su detalle.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const now = new Date();
                    setMonth(now);
                    handleOpenDay(now);
                  }}
                >
                  Hoy
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFiltersDialogOpen(true)}
                >
                  <Filter />
                  <span>Filtro</span>
                </Button>

                <ButtonGroup orientation="horizontal" aria-label="Navegación de mes">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
                  >
                    <ChevronLeft />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
                  >
                    <ChevronRight />
                  </Button>
                </ButtonGroup>
              </div>
            </div>

            <Dialog open={filtersDialogOpen} onOpenChange={setFiltersDialogOpen}>
              <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                  <DialogTitle>Filtro</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Tipo</p>
                    <div className="flex flex-wrap gap-2">
                      {TARGET_OPTIONS.map((option) => (
                        <Button
                          key={option.value}
                          type="button"
                          size="sm"
                          variant={targetType === option.value ? 'default' : 'outline'}
                          onClick={() => setTargetType(option.value)}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Estado</p>
                    <div className="flex flex-wrap gap-2">
                      {STATUS_OPTIONS.map((status) => (
                        <Button
                          key={status}
                          type="button"
                          size="sm"
                          variant={statuses.includes(status) ? 'default' : 'outline'}
                          onClick={() => handleToggleStatus(status)}
                        >
                          {agendaStatusLabels[status]}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <AgendaToolbar
              monthLabel={format(month, 'MMMM yyyy')}
              targetType={targetType}
              onTargetTypeChange={setTargetType}
              statuses={statuses}
              onToggleStatus={handleToggleStatus}
              summary={summaryLoading ? { overdue: [], today: [], next: [] } : summary}
              visiblePendingCount={events.filter((item) => item.status === 'pending').length}
            />
          </CardHeader>
          <CardContent className="flex-1 min-h-0 overflow-y-auto space-y-3 pt-0">
            {isLoading ? (
              <div className="flex min-h-[620px] items-center justify-center rounded-2xl border">
                <Loader />
              </div>
            ) : (
              <AgendaMonthCalendar
                currentMonth={month}
                onSelectDate={handleOpenDay}
                groupedEvents={groupedEvents}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <RescheduleAgendaDialog
        open={rescheduleDialog.open}
        onOpenChange={(open) => setRescheduleDialog((current) => ({ ...current, open, item: open ? current.item : null }))}
        item={rescheduleDialog.item}
        onConfirm={handleReschedule}
        loading={rescheduleAgendaAction.isPending}
      />

      <AlertDialog
        open={cancelDialog.open}
        onOpenChange={(open) => setCancelDialog((current) => ({ ...current, open, item: open ? current.item : null }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar acción pendiente</AlertDialogTitle>
            <AlertDialogDescription>La acción dejará de aparecer como pendiente activa en la agenda.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel}>Confirmar cancelación</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <QuickInteractionModal
        open={interactionModal.open}
        onOpenChange={(open) => setInteractionModal((current) => ({ ...current, open }))}
        prospectId={interactionModal.prospectId}
        customerId={interactionModal.customerId}
        agendaActionId={interactionModal.agendaActionId}
        defaultNextActionDate={interactionModal.nextActionAt}
        defaultNextActionNote={interactionModal.nextActionNote}
        title="Cerrar tarea"
        mode={interactionModal.mode}
      />

      <AgendaDayDialog
        open={dayDialogOpen}
        onOpenChange={(open) => {
          setDayDialogOpen(open);
          if (!open) setSelectedDate(null);
        }}
        date={selectedDate}
        items={selectedDayItems}
        loading={isLoading}
        onReschedule={(agendaItem) => setRescheduleDialog({ open: true, item: agendaItem })}
        onCancel={(agendaItem) => setCancelDialog({ open: true, item: agendaItem })}
        onComplete={(agendaItem) =>
          setInteractionModal({
            open: true,
            prospectId: agendaItem.target.type === 'prospect' ? agendaItem.target.id : null,
            customerId: agendaItem.target.type === 'customer' ? agendaItem.target.id : null,
            agendaActionId: agendaItem.agendaActionId,
            nextActionAt: agendaItem.scheduledAt,
            nextActionNote: agendaItem.description ?? '',
            mode: 'complete',
          })
        }
      />
    </>
  );
}
