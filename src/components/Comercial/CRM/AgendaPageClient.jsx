'use client';

import Link from 'next/link';
import * as React from 'react';
import { Calendar, Check, ExternalLink, MoreVertical, Plus, Search, XCircle } from 'lucide-react';
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Loader from '@/components/Utilities/Loader';
import { notify } from '@/lib/notifications';
import { cn } from '@/lib/utils';
import { useAgenda, useAgendaMutations, useAgendaSummary } from '@/hooks/useAgenda';
import { useProspect, useProspectContacts, useProspectsList } from '@/hooks/useProspects';
import { useCustomersList } from '@/hooks/useCustomersList';
import { useCommercialInteractions } from '@/hooks/useCommercialInteractions';
import { useOffersList } from '@/hooks/useOffers';
import { useComercialOrders } from '@/hooks/useComercialOrders';
import { crmService } from '@/services/crmService';
import QuickInteractionModal from './QuickInteractionModal';
import ResolveNextActionDialog from './ResolveNextActionDialog';
import { AgendaHeaderControls } from './AgendaHeaderControls';
import { AgendaFiltersDialog } from './AgendaFiltersDialog';
import { getAgendaDomainErrorMessage } from './agendaErrorMessages';
import {
  agendaStatusLabels,
  formatDateValue,
  getStatusTone,
  isOverdueDate,
  toneClasses,
} from './utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import InteractionsTimelinePanel from './context/InteractionsTimelinePanel';
import OffersHistoryPanel from './context/OffersHistoryPanel';
import CustomerOrdersPanel from './context/CustomerOrdersPanel';
import ProspectDataPanel from './context/ProspectDataPanel';
import ProspectContactsPanel from './context/ProspectContactsPanel';

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const DAY_DIALOG_SORT_OPTIONS = [
  { value: 'priority', label: 'Prioridad' },
  { value: 'name_asc', label: 'Nombre A-Z' },
  { value: 'name_desc', label: 'Nombre Z-A' },
  { value: 'status', label: 'Estado' },
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
    <span className="border-border bg-muted/30 text-foreground inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px]">
      <span
        className={`size-1.5 shrink-0 rounded-full ${toneDotClasses[tone] ?? toneDotClasses.slate}`}
        aria-hidden
      />
      <span>{title}</span>
      <span className="font-medium tabular-nums">{count}</span>
    </span>
  );
}

function AgendaStatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${toneClasses(getStatusTone(status))}`}
    >
      {agendaStatusLabels[status] ?? status}
    </span>
  );
}

function getAgendaItemPriority(item) {
  if (item.status === 'pending') {
    return isOverdueDate(item.scheduledAt) ? 0 : 1;
  }

  const priorityMap = {
    reprogrammed: 2,
    done: 3,
    cancelled: 4,
  };

  return priorityMap[item.status] ?? 5;
}

function compareAgendaItemsByPriority(a, b) {
  const priorityDiff = getAgendaItemPriority(a) - getAgendaItemPriority(b);
  if (priorityDiff !== 0) return priorityDiff;
  return String(a.label ?? '').localeCompare(String(b.label ?? ''), 'es', { sensitivity: 'base' });
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

function AgendaEventRow({ item, onReschedule, onCancel, onComplete, onOpenContext }) {
  const isPending = item.status === 'pending';
  const isOverdue = isPending && isOverdueDate(item.scheduledAt);
  const href =
    item.target.type === 'customer'
      ? `/comercial/clientes/${item.target.id}`
      : `/comercial/prospectos/${item.target.id}`;
  const targetLabel = item.target.type === 'customer' ? 'Cliente' : 'Prospecto';

  return (
    <Card
      size="sm"
      className={cn(
        'cursor-pointer transition-colors',
        isOverdue && 'border-red-300 bg-red-50/50 dark:border-red-800 dark:bg-red-950/30'
      )}
      onClick={() => onOpenContext(item)}
    >
      <CardContent className="py-0">
        <div className="space-y-2 sm:space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <AgendaStatusBadge status={item.status} />
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Acciones"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <MoreVertical />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="min-w-[12rem]"
                  onClick={(event) => event.stopPropagation()}
                >
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
            <p className="truncate text-base font-medium">{item.label}</p>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-muted-foreground mb-1 text-xs">Fecha</p>
              <p className="text-sm font-medium tabular-nums">
                {formatDateValue(item.scheduledAt)}
                {isOverdue && (
                  <span className="text-destructive ml-2 text-xs font-medium">· Vencida</span>
                )}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-muted-foreground mb-1 text-xs">Nota</p>
              <p className="text-sm font-medium break-words whitespace-pre-wrap">
                {item.description || '—'}
              </p>
            </div>
            {item.status === 'cancelled' && item.reason && (
              <div className="min-w-0">
                <p className="text-muted-foreground mb-1 text-xs">Motivo de cancelación</p>
                <p className="text-muted-foreground text-sm break-words whitespace-pre-wrap">
                  {item.reason}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function RescheduleAgendaDialog({ open, onOpenChange, item, onConfirm, loading }) {
  const [nextActionAt, setNextActionAt] = React.useState(null);

  const minDate = React.useMemo(() => {
    const base = item?.scheduledAt ? new Date(item.scheduledAt) : new Date();
    base.setDate(base.getDate() + 1);
    base.setHours(0, 0, 0, 0);
    return base;
  }, [item?.scheduledAt]);

  React.useEffect(() => {
    if (!open) return;
    setNextActionAt(minDate);
  }, [open, minDate]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Reprogramar acción</DialogTitle>
          <DialogDescription>
            Elige una nueva fecha para la acción. La descripción se mantendrá tal como está.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Fecha nueva</Label>
            <DatePicker
              date={nextActionAt}
              onChange={setNextActionAt}
              formatStyle="short"
              fromDate={minDate}
            />
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

function ActionTargetPickerDialog({ open, onOpenChange, selectedDate, onConfirm }) {
  const [targetType, setTargetType] = React.useState('prospect');
  const [targetId, setTargetId] = React.useState('');
  const { data: prospects } = useProspectsList({
    page: 1,
    perPage: 100,
    enabled: open && targetType === 'prospect',
  });
  const { data: customers } = useCustomersList({
    page: 1,
    perPage: 100,
    enabled: open && targetType === 'customer',
  });

  React.useEffect(() => {
    if (!open) return;
    setTargetType('prospect');
    setTargetId('');
  }, [open]);

  const options =
    targetType === 'prospect'
      ? prospects.map((item) => ({ id: item.id, label: item.companyName }))
      : customers.map((item) => ({ id: item.id, label: item.name }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Nueva interacción</DialogTitle>
          <DialogDescription>
            Selecciona el prospecto o cliente para registrar la interacción del{' '}
            {selectedDate ? formatDateValue(selectedDate) : 'día seleccionado'}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Tipo</Label>
            <Select
              value={targetType}
              onValueChange={(value) => {
                setTargetType(value);
                setTargetId('');
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prospect">Prospecto</SelectItem>
                <SelectItem value="customer">Cliente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>{targetType === 'prospect' ? 'Prospecto' : 'Cliente'}</Label>
            <Select value={targetId} onValueChange={setTargetId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona registro" />
              </SelectTrigger>
              <SelectContent>
                {options.map((item) => (
                  <SelectItem key={String(item.id)} value={String(item.id)}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={!targetId}
            onClick={() =>
              onConfirm({
                targetType,
                targetId,
              })
            }
          >
            Continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AgendaActionContextDialog({
  open,
  onOpenChange,
  agendaItem,
  onComplete,
  onReschedule,
  onCancel,
  onResolveNextAction,
}) {
  const targetType = agendaItem?.target?.type;
  const targetId = agendaItem?.target?.id;
  const enabled = Boolean(open && targetType && targetId);
  const isProspect = targetType === 'prospect';

  // useProspect ya guarda con enabled: id != null internamente; pasamos null cuando es cliente
  const { data: prospect, isLoading: prospectLoading } = useProspect(
    enabled && isProspect ? targetId : null
  );
  const { data: contacts, isLoading: contactsLoading } = useProspectContacts(
    enabled && isProspect ? targetId : null,
    { enabled: enabled && isProspect }
  );

  const { data: interactions, isLoading: interactionsLoading } = useCommercialInteractions({
    ...(isProspect ? { prospectId: targetId } : { customerId: targetId }),
    perPage: 50,
    enabled,
  });

  const { data: offers, isLoading: offersLoading } = useOffersList({
    ...(isProspect ? { prospectId: targetId } : { customerId: targetId }),
    perPage: 50,
    enabled,
  });

  const { data: orders, isLoading: ordersLoading } = useComercialOrders({
    customerId: targetId,
    perPage: 20,
    enabled: enabled && !isProspect,
  });

  const isPending = agendaItem?.status === 'pending';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="5xl"
        className="flex max-h-[90vh] flex-col overflow-hidden"
        showCloseButton={false}
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <DialogHeader className="pr-10">
          <DialogDescription className="text-muted-foreground text-xs font-medium tracking-[0.16em] uppercase">
            {agendaItem?.target?.type === 'prospect' ? 'Prospecto' : 'Cliente'}
          </DialogDescription>
          <DialogTitle className="text-xl">{agendaItem?.label ?? 'Contexto de acción'}</DialogTitle>
          {agendaItem &&
            (() => {
              const isCancelled = agendaItem.status === 'cancelled';
              const isOverdue =
                agendaItem.status === 'pending' && isOverdueDate(agendaItem.scheduledAt);
              const cardCls =
                isCancelled || isOverdue
                  ? 'border-red-200 bg-red-50/60 dark:border-red-800 dark:bg-red-950/20'
                  : 'border-amber-200 bg-amber-50/60 dark:border-amber-800 dark:bg-amber-950/20';
              const iconCls =
                isCancelled || isOverdue
                  ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400';
              return (
                <div className={`mt-1 flex items-start gap-3 rounded-xl border p-3 ${cardCls}`}>
                  <div
                    className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${iconCls}`}
                  >
                    <Calendar className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-foreground text-sm font-semibold">
                        {formatDateValue(agendaItem.scheduledAt)}
                      </p>
                      {isCancelled && (
                        <span className="inline-flex items-center rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-300">
                          Cancelada
                        </span>
                      )}
                      {isOverdue && (
                        <span className="text-destructive text-xs font-medium">· Vencida</span>
                      )}
                    </div>
                    <p
                      className={`text-sm break-words whitespace-pre-wrap ${isCancelled ? 'text-red-700/60 line-through dark:text-red-300/60' : 'text-foreground/80'}`}
                    >
                      {agendaItem.description || <span className="italic">Sin descripción</span>}
                    </p>
                    {isCancelled && agendaItem.reason && (
                      <p className="text-xs text-red-700/70 dark:text-red-300/70">
                        <span className="font-medium">Motivo:</span> {agendaItem.reason}
                      </p>
                    )}
                  </div>
                </div>
              );
            })()}
        </DialogHeader>

        {/* Dropdown "Más acciones" en la esquina top-right donde estaba la X — solo para pending */}
        {isPending && (
          <div className="absolute top-2 right-2 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Más acciones">
                  <MoreVertical />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => onReschedule(agendaItem)}>
                  <Calendar />
                  Reprogramar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => onCancel(agendaItem)}>
                  <XCircle />
                  Cancelar acción
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Tabs de contenido diferenciadas por tipo */}
        <Tabs
          defaultValue={isProspect ? 'datos' : 'interacciones'}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <TabsList>
            {isProspect && <TabsTrigger value="datos">Datos</TabsTrigger>}
            {isProspect && <TabsTrigger value="contactos">Contactos</TabsTrigger>}
            <TabsTrigger value="interacciones">Interacciones</TabsTrigger>
            {!isProspect && <TabsTrigger value="pedidos">Pedidos</TabsTrigger>}
            <TabsTrigger value="ofertas">Ofertas</TabsTrigger>
          </TabsList>

          {/* TAB DATOS — solo prospectos, replica fiel del bloque de datos de ProspectDetail */}
          {isProspect && (
            <TabsContent value="datos" className="flex-1 overflow-y-auto">
              <ProspectDataPanel prospect={prospect} isLoading={prospectLoading} />
            </TabsContent>
          )}

          {/* TAB CONTACTOS — solo prospectos, tabla idéntica a ProspectDetail */}
          {isProspect && (
            <TabsContent value="contactos" className="flex-1 overflow-y-auto">
              <ProspectContactsPanel contacts={contacts} isLoading={contactsLoading} />
            </TabsContent>
          )}

          {/* TAB INTERACCIONES — timeline con iconos, igual que ProspectDetail */}
          <TabsContent value="interacciones" className="flex-1 overflow-y-auto">
            <InteractionsTimelinePanel
              interactions={interactions}
              isLoading={interactionsLoading}
              emptyTitle="Sin interacciones"
              emptyDescription="Registra seguimiento para alimentar la agenda comercial."
            />
          </TabsContent>

          {/* TAB PEDIDOS — solo clientes */}
          {!isProspect && (
            <TabsContent value="pedidos" className="flex-1 overflow-y-auto">
              <CustomerOrdersPanel orders={orders} isLoading={ordersLoading} />
            </TabsContent>
          )}

          {/* TAB OFERTAS — histórico de ofertas */}
          <TabsContent value="ofertas" className="flex-1 overflow-y-auto">
            <OffersHistoryPanel
              offers={offers}
              isLoading={offersLoading}
              emptyTitle="Sin histórico de ofertas"
              emptyDescription="No hay ofertas vinculadas para este target."
            />
          </TabsContent>
        </Tabs>

        {/* Footer siempre visible: acciones primarias a la izquierda, cerrar en el extremo derecho */}
        <DialogFooter className="flex-row items-center justify-between gap-2">
          {isPending ? (
            <Button size="sm" onClick={() => onComplete(agendaItem)}>
              <Check />
              Hacer
            </Button>
          ) : (
            <span />
          )}

          <DialogClose asChild>
            <Button variant="outline" size="sm">
              Cerrar
            </Button>
          </DialogClose>
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
      <div className="mb-2 grid grid-cols-7 gap-2.5">
        {WEEKDAYS.map((day, index) => {
          const isWeekend = index === 5 || index === 6;
          return (
            <div
              key={day}
              className={cn(
                'rounded-md px-1 py-2.5 text-center text-sm font-semibold',
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
          const overduePending = items.some(
            (item) => item.status === 'pending' && isOverdueDate(item.scheduledAt)
          );

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => onSelectDate(day)}
              className={cn(
                'relative min-h-[110px] rounded-lg border p-2.5 text-left transition-all duration-200',
                'focus:ring-ring focus:ring-2 focus:ring-offset-2 focus:outline-none',
                'shadow-sm hover:shadow-md',
                !inCurrentMonth && 'bg-muted/20 opacity-30',
                isCurrentDay && 'border-primary ring-primary/20 border-2 shadow-md ring-2',
                hasItems && inCurrentMonth && 'cursor-pointer hover:scale-[1.02] hover:shadow-lg',
                !hasItems && 'cursor-default',
                inCurrentMonth && !hasItems && !isWeekend && 'bg-background hover:bg-muted/50',
                isWeekend && inCurrentMonth && !hasItems && 'bg-gray-200 dark:bg-gray-800/70',
                isWeekend && inCurrentMonth && hasItems && 'bg-gray-100/50 dark:bg-gray-800/30',
                overduePending &&
                  inCurrentMonth &&
                  'border-red-400 bg-red-50 shadow-red-100 dark:border-red-600 dark:bg-red-950/20 dark:shadow-red-950'
              )}
            >
              <div className="relative flex h-full flex-col">
                <div
                  className={cn(
                    'absolute top-1.5 right-2 text-lg font-normal',
                    isCurrentDay && 'text-primary',
                    !inCurrentMonth && 'text-muted-foreground opacity-50',
                    inCurrentMonth && !isCurrentDay && 'text-foreground'
                  )}
                >
                  {format(day, 'd')}
                </div>
                {hasItems && (
                  <div className="mt-6 flex-1 space-y-1.5">
                    {pendingCount > 0 && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <div className="h-2 w-2 flex-shrink-0 rounded-full bg-blue-600 dark:bg-blue-500" />
                        <span className="leading-tight font-medium text-blue-700 dark:text-blue-400">
                          {pendingCount} {pendingCount === 1 ? 'pend.' : 'pend.'}
                        </span>
                      </div>
                    )}
                    {doneCount > 0 && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <div className="h-2 w-2 flex-shrink-0 rounded-full bg-green-600 dark:bg-green-500" />
                        <span className="leading-tight font-medium text-green-700 dark:text-green-400">
                          {doneCount} hechas
                        </span>
                      </div>
                    )}
                    {reprogrammedCount > 0 && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <div className="h-2 w-2 flex-shrink-0 rounded-full bg-amber-500 dark:bg-amber-400" />
                        <span className="leading-tight font-medium text-amber-700 dark:text-amber-300">
                          {reprogrammedCount} reprog.
                        </span>
                      </div>
                    )}
                    {cancelledCount > 0 && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <div className="h-2 w-2 flex-shrink-0 rounded-full bg-red-600 dark:bg-red-500" />
                        <span className="leading-tight font-medium text-red-700 dark:text-red-400">
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

function AgendaDayDialog({
  open,
  onOpenChange,
  date,
  items,
  loading,
  onReschedule,
  onCancel,
  onComplete,
  onResolveNextAction,
  onNewInteraction,
  onOpenContext,
}) {
  const [search, setSearch] = React.useState('');
  const [sortBy, setSortBy] = React.useState('priority');

  React.useEffect(() => {
    if (!open) {
      setSearch('');
      setSortBy('priority');
    }
  }, [open]);

  const normalizedSearch = React.useMemo(() => search.trim().toLowerCase(), [search]);

  const filteredItems = React.useMemo(() => {
    if (!normalizedSearch) return items;

    return items.filter((item) => {
      const searchableValues = [item.label, item.description];

      return searchableValues.some((value) =>
        String(value ?? '')
          .toLowerCase()
          .includes(normalizedSearch)
      );
    });
  }, [items, normalizedSearch]);

  const sortedItems = React.useMemo(() => {
    const sorted = [...filteredItems];

    sorted.sort((a, b) => {
      if (sortBy === 'name_asc') {
        return String(a.label ?? '').localeCompare(String(b.label ?? ''), 'es', {
          sensitivity: 'base',
        });
      }

      if (sortBy === 'name_desc') {
        return String(b.label ?? '').localeCompare(String(a.label ?? ''), 'es', {
          sensitivity: 'base',
        });
      }

      if (sortBy === 'status') {
        const statusDiff = String(agendaStatusLabels[a.status] ?? a.status).localeCompare(
          String(agendaStatusLabels[b.status] ?? b.status),
          'es',
          { sensitivity: 'base' }
        );

        if (statusDiff !== 0) return statusDiff;
        return String(a.label ?? '').localeCompare(String(b.label ?? ''), 'es', {
          sensitivity: 'base',
        });
      }

      return compareAgendaItemsByPriority(a, b);
    });

    return sorted;
  }, [filteredItems, sortBy]);

  const description = React.useMemo(() => {
    if (loading) return 'Cargando acciones del día seleccionado.';
    if (!normalizedSearch) {
      return `${items.length} ${items.length === 1 ? 'acción' : 'acciones'} para la fecha seleccionada.`;
    }

    return `${sortedItems.length} ${sortedItems.length === 1 ? 'coincidencia' : 'coincidencias'} para “${search.trim()}”.`;
  }, [items.length, loading, normalizedSearch, search, sortedItems.length]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" className="max-h-[88vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {date ? `Agenda del ${formatDateValue(date)}` : 'Detalle del día'}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center">
          <InputGroup className="w-full min-w-0">
            <InputGroupInput
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por cliente, prospecto o nota"
              aria-label="Buscar en las acciones del día"
            />
            <InputGroupAddon align="inline-end">
              <Search className="size-4" />
            </InputGroupAddon>
          </InputGroup>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent align="end">
              {DAY_DIALOG_SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
                className="bg-muted/20 min-h-[220px] border"
              />
            ) : sortedItems.length === 0 ? (
              <EmptyState
                title="No hay coincidencias"
                description={`No se encontraron acciones para “${search.trim()}” en este día.`}
                className="bg-muted/20 min-h-[220px] border"
              />
            ) : (
              sortedItems.map((item) => (
                <AgendaEventRow
                  key={String(item.agendaActionId)}
                  item={item}
                  onReschedule={onReschedule}
                  onCancel={onCancel}
                  onComplete={onComplete}
                  onOpenContext={onOpenContext}
                />
              ))
            )}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button type="button" onClick={onNewInteraction} className="w-full sm:w-auto">
            <Plus />
            Nueva interacción
          </Button>
        </DialogFooter>
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
  const [targetFilter, setTargetFilter] = React.useState(null); // "prospect-3" | "customer-5" | null
  const [overdueOnly, setOverdueOnly] = React.useState(false);
  const [filtersDialogOpen, setFiltersDialogOpen] = React.useState(false);
  const [rescheduleDialog, setRescheduleDialog] = React.useState({ open: false, item: null });
  const [cancelDialog, setCancelDialog] = React.useState({ open: false, item: null });
  const [cancelReason, setCancelReason] = React.useState('');
  const [interactionModal, setInteractionModal] = React.useState({
    open: false,
    prospectId: null,
    customerId: null,
    agendaActionId: null,
    nextActionAt: null,
    nextActionNote: null,
    mode: 'create',
  });
  const [resolveDialog, setResolveDialog] = React.useState({
    open: false,
    targetType: null,
    targetId: null,
    sourceInteractionId: null,
  });
  const [targetPickerOpen, setTargetPickerOpen] = React.useState(false);
  const [contextDialog, setContextDialog] = React.useState({ open: false, item: null });
  const [postInteractionPromptOpen, setPostInteractionPromptOpen] = React.useState(false);
  const [lastInteractionContext, setLastInteractionContext] = React.useState({
    targetType: null,
    targetId: null,
    interactionId: null,
  });
  const [interactionPreflight, setInteractionPreflight] = React.useState({
    open: false,
    targetType: null,
    targetId: null,
    pendingAction: null,
  });

  const agendaParams = React.useMemo(
    () => ({
      startDate: format(startOfMonth(month), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(month), 'yyyy-MM-dd'),
    }),
    [month]
  );

  const { data: events, isLoading } = useAgenda(agendaParams);
  const { data: summary, isLoading: summaryLoading } = useAgendaSummary({ limitNext: 10 });
  const { rescheduleAgendaAction, cancelAgendaAction } = useAgendaMutations();

  // Targets únicos del mes para el combobox
  const monthTargetOptions = React.useMemo(() => {
    const seen = new Set();
    const options = [];
    for (const item of events) {
      const key = `${item.target?.type}-${item.target?.id}`;
      if (!seen.has(key) && item.target?.id) {
        seen.add(key);
        options.push({ value: key, label: item.label, type: item.target.type });
      }
    }
    return options.sort((a, b) => a.label.localeCompare(b.label));
  }, [events]);

  const filteredEvents = React.useMemo(() => {
    let result = events;
    if (targetType !== 'all') {
      result = result.filter((item) => item.target?.type === targetType);
    }
    if (statuses.length < 4) {
      result = result.filter((item) => statuses.includes(item.status));
    }
    if (targetFilter) {
      result = result.filter((item) => `${item.target?.type}-${item.target?.id}` === targetFilter);
    }
    if (overdueOnly) {
      result = result.filter(
        (item) => item.status === 'pending' && isOverdueDate(item.scheduledAt)
      );
    }
    return result;
  }, [events, targetType, statuses, targetFilter, overdueOnly]);

  const visiblePendingCount = React.useMemo(
    () => filteredEvents.reduce((count, item) => count + (item.status === 'pending' ? 1 : 0), 0),
    [filteredEvents]
  );

  const groupedEvents = React.useMemo(
    () =>
      filteredEvents.reduce((acc, item) => {
        const group = acc.get(item.scheduledAt) ?? [];
        group.push(item);
        acc.set(item.scheduledAt, group);
        return acc;
      }, new Map()),
    [filteredEvents]
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
          error: (error) => getAgendaDomainErrorMessage(error, 'No se pudo reprogramar la acción'),
        }
      );
      setRescheduleDialog({ open: false, item: null });
    } catch {}
  };

  const handleCancel = async () => {
    if (!cancelDialog.item?.agendaActionId) return;
    if (!cancelReason.trim()) {
      notify.error({ title: 'Indica el motivo de cancelación' });
      return;
    }
    try {
      await notify.promise(
        cancelAgendaAction.mutateAsync({
          id: cancelDialog.item.agendaActionId,
          reason: cancelReason.trim(),
        }),
        {
          loading: 'Cancelando acción...',
          success: 'Acción cancelada',
          error: (error) => getAgendaDomainErrorMessage(error, 'No se pudo cancelar la acción'),
        }
      );
      setCancelDialog({ open: false, item: null });
      setCancelReason('');
    } catch {}
  };

  const handleOpenDay = (date) => {
    setSelectedDate(date);
    setDayDialogOpen(Boolean(date));
  };

  const handleOpenFilters = () => setFiltersDialogOpen(true);

  const openInteractionForTarget = ({ targetType: nextTargetType, targetId: nextTargetId }) => {
    setInteractionModal({
      open: true,
      prospectId: nextTargetType === 'prospect' ? nextTargetId : null,
      customerId: nextTargetType === 'customer' ? nextTargetId : null,
      agendaActionId: null,
      nextActionAt: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null,
      nextActionNote: '',
      mode: 'create',
    });
  };

  const handleTargetPickerConfirm = async ({
    targetType: nextTargetType,
    targetId: nextTargetId,
  }) => {
    try {
      const pendingResponse = await crmService.getPendingAgendaAction({
        targetType: nextTargetType,
        targetId: nextTargetId,
      });
      const rawPending = pendingResponse?.data ?? null;
      const pendingAction =
        rawPending?.pendingAction ?? (rawPending?.agendaActionId ? rawPending : null);
      const hasPending =
        typeof rawPending?.hasPending === 'boolean'
          ? rawPending.hasPending
          : Boolean(pendingAction);
      if (hasPending) {
        setInteractionPreflight({
          open: true,
          targetType: nextTargetType,
          targetId: nextTargetId,
          pendingAction,
        });
        return;
      }
    } catch {
      // Si falla preflight, permitimos continuar para no bloquear el registro de interacción.
    }

    openInteractionForTarget({
      targetType: nextTargetType,
      targetId: nextTargetId,
    });
    setTargetPickerOpen(false);
  };

  return (
    <>
      <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto px-4 py-3 md:px-6">
        <Card className="flex-1 overflow-hidden">
          <CardHeader className="space-y-3 pb-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">Calendario mensual</CardTitle>
                <CardDescription>
                  La agenda se trabaja desde el calendario. Pulsa un día para abrir su detalle.
                </CardDescription>
              </div>
              <AgendaHeaderControls
                onToday={() => {
                  const now = new Date();
                  setMonth(now);
                  handleOpenDay(now);
                }}
                onOpenFilters={handleOpenFilters}
                onPrevMonth={() =>
                  setMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))
                }
                onNextMonth={() =>
                  setMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))
                }
                onNewInteraction={() => setTargetPickerOpen(true)}
              />
            </div>

            <AgendaFiltersDialog
              open={filtersDialogOpen}
              onOpenChange={setFiltersDialogOpen}
              targetType={targetType}
              statuses={statuses}
              targetFilter={targetFilter}
              targetOptions={monthTargetOptions}
              overdueOnly={overdueOnly}
              onTargetTypeChange={setTargetType}
              onToggleStatus={handleToggleStatus}
              onTargetFilterChange={setTargetFilter}
              onOverdueOnlyChange={setOverdueOnly}
              onClearAll={() => {
                setTargetType('all');
                setStatuses(['pending', 'reprogrammed', 'done', 'cancelled']);
                setTargetFilter(null);
                setOverdueOnly(false);
              }}
            />

            <AgendaToolbar
              monthLabel={format(month, 'MMMM yyyy')}
              targetType={targetType}
              onTargetTypeChange={setTargetType}
              statuses={statuses}
              onToggleStatus={handleToggleStatus}
              summary={summaryLoading ? { overdue: [], today: [], next: [] } : summary}
              visiblePendingCount={visiblePendingCount}
            />
          </CardHeader>
          <CardContent className="min-h-0 flex-1 space-y-3 overflow-y-auto pt-0">
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
        onOpenChange={(open) =>
          setRescheduleDialog((current) => ({ ...current, open, item: open ? current.item : null }))
        }
        item={rescheduleDialog.item}
        onConfirm={handleReschedule}
        loading={rescheduleAgendaAction.isPending}
      />

      <AlertDialog
        open={cancelDialog.open}
        onOpenChange={(open) => {
          setCancelDialog((current) => ({ ...current, open, item: open ? current.item : null }));
          if (!open) setCancelReason('');
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar acción pendiente</AlertDialogTitle>
            <AlertDialogDescription>
              La acción dejará de aparecer como pendiente activa en la agenda.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="cancel-reason">Motivo de cancelación</Label>
            <Textarea
              id="cancel-reason"
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Negociación descartada, cliente no interesado, cambio de prioridad..."
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} disabled={cancelAgendaAction.isPending}>
              Confirmar cancelación
            </AlertDialogAction>
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
        title={interactionModal.mode === 'complete' ? 'Cerrar tarea' : 'Registrar interacción'}
        mode={interactionModal.mode}
        onInteractionCreated={(interaction) => {
          const target = interactionModal.prospectId
            ? { targetType: 'prospect', targetId: interactionModal.prospectId }
            : { targetType: 'customer', targetId: interactionModal.customerId };
          setLastInteractionContext({
            ...target,
            interactionId: interaction?.id ?? null,
          });
          setPostInteractionPromptOpen(true);
        }}
      />
      <AlertDialog open={postInteractionPromptOpen} onOpenChange={setPostInteractionPromptOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Programar próxima acción?</AlertDialogTitle>
            <AlertDialogDescription>
              Puedes fijar ahora cuándo y cómo hacer el siguiente seguimiento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Omitir</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                setResolveDialog({
                  open: true,
                  targetType: lastInteractionContext.targetType,
                  targetId: lastInteractionContext.targetId,
                  sourceInteractionId: lastInteractionContext.interactionId,
                })
              }
            >
              Programar ahora
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <ResolveNextActionDialog
        open={resolveDialog.open}
        onOpenChange={(open) => setResolveDialog((current) => ({ ...current, open }))}
        targetType={resolveDialog.targetType}
        targetId={resolveDialog.targetId}
        sourceInteractionId={resolveDialog.sourceInteractionId}
        onViewAction={(pendingAction) => {
          setResolveDialog((current) => ({ ...current, open: false }));
          setContextDialog({ open: true, item: pendingAction });
        }}
      />
      <ActionTargetPickerDialog
        open={targetPickerOpen}
        onOpenChange={setTargetPickerOpen}
        selectedDate={selectedDate}
        onConfirm={handleTargetPickerConfirm}
      />
      <AlertDialog
        open={interactionPreflight.open}
        onOpenChange={(open) => setInteractionPreflight((current) => ({ ...current, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hay una acción pendiente sin cerrar</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <span className="text-muted-foreground block text-sm">
                  Antes de registrar una nueva interacción, ¿quieres cerrar la que ya tienes
                  pendiente?
                </span>
                {interactionPreflight.pendingAction && (
                  <button
                    type="button"
                    className="flex w-full cursor-pointer items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-left transition-colors hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/30 dark:hover:bg-amber-900/40"
                    onClick={() => {
                      setInteractionPreflight((current) => ({ ...current, open: false }));
                      setContextDialog({ open: true, item: interactionPreflight.pendingAction });
                    }}
                  >
                    <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400">
                      <Calendar className="size-3.5" />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                        {formatDateValue(interactionPreflight.pendingAction.scheduledAt)}
                      </p>
                      {interactionPreflight.pendingAction.description && (
                        <p className="text-foreground text-sm leading-snug">
                          {interactionPreflight.pendingAction.description}
                        </p>
                      )}
                    </div>
                  </button>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => {
                setInteractionPreflight((current) => ({ ...current, open: false }));
                if (interactionPreflight.pendingAction?.agendaActionId) {
                  setInteractionModal({
                    open: true,
                    prospectId:
                      interactionPreflight.targetType === 'prospect'
                        ? interactionPreflight.targetId
                        : null,
                    customerId:
                      interactionPreflight.targetType === 'customer'
                        ? interactionPreflight.targetId
                        : null,
                    agendaActionId: interactionPreflight.pendingAction.agendaActionId,
                    nextActionAt: interactionPreflight.pendingAction.scheduledAt ?? null,
                    nextActionNote: interactionPreflight.pendingAction.description ?? '',
                    mode: 'complete',
                  });
                  return;
                }
                setResolveDialog({
                  open: true,
                  targetType: interactionPreflight.targetType,
                  targetId: interactionPreflight.targetId,
                  sourceInteractionId: null,
                });
              }}
            >
              <Check className="size-4" />
              Cerrar acción pendiente
            </Button>
            <div className="flex w-full gap-2">
              <AlertDialogAction
                className="flex-1 whitespace-normal"
                onClick={() => {
                  setInteractionPreflight((current) => ({ ...current, open: false }));
                  openInteractionForTarget({
                    targetType: interactionPreflight.targetType,
                    targetId: interactionPreflight.targetId,
                  });
                  setTargetPickerOpen(false);
                }}
              >
                Continuar
              </AlertDialogAction>
              <AlertDialogCancel className="flex-1 whitespace-normal">Cancelar</AlertDialogCancel>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AgendaActionContextDialog
        open={contextDialog.open}
        onOpenChange={(open) => setContextDialog((current) => ({ ...current, open }))}
        agendaItem={contextDialog.item}
        onComplete={(item) => {
          setContextDialog({ open: false, item: null });
          setInteractionModal({
            open: true,
            prospectId: item.target.type === 'prospect' ? item.target.id : null,
            customerId: item.target.type === 'customer' ? item.target.id : null,
            agendaActionId: item.agendaActionId,
            nextActionAt: item.scheduledAt,
            nextActionNote: item.description ?? '',
            mode: 'complete',
          });
        }}
        onReschedule={(item) => {
          setContextDialog({ open: false, item: null });
          setRescheduleDialog({ open: true, item });
        }}
        onCancel={(item) => {
          setContextDialog({ open: false, item: null });
          setCancelDialog({ open: true, item });
        }}
        onResolveNextAction={(item) => {
          setContextDialog({ open: false, item: null });
          setResolveDialog({
            open: true,
            targetType: item.target.type,
            targetId: item.target.id,
            sourceInteractionId: null,
          });
        }}
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
        onResolveNextAction={(agendaItem) =>
          setResolveDialog({
            open: true,
            targetType: agendaItem.target.type,
            targetId: agendaItem.target.id,
            sourceInteractionId: null,
          })
        }
        onNewInteraction={() => setTargetPickerOpen(true)}
        onOpenContext={(agendaItem) => setContextDialog({ open: true, item: agendaItem })}
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
