'use client';

import Link from 'next/link';
import * as React from 'react';
import {
  CalendarClock,
  CircleAlert,
  Clock3,
  UserRoundX,
  PhoneCall,
  UserCircle2,
  MoreVertical,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCrmDashboard } from '@/hooks/useCrmDashboard';
import { useProspectMutations } from '@/hooks/useProspects';
import { CRM_AGENDA_DESCRIPTION_MAX_LENGTH } from '@/components/Comercial/CRM/schemas/crmTextLimits';
import { formatDateValue, isOverdueDate } from './utils';
import { notify } from '@/lib/notifications';
import QuickInteractionModal from './QuickInteractionModal';

function EmptyWidget({ icon: Icon, title, description }) {
  return (
    <Empty className="bg-muted/20 min-h-[180px] border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon className="size-4" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function LoadingWidget() {
  return (
    <Card className="w-full max-w-full overflow-hidden">
      <CardHeader>
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-28" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </CardContent>
    </Card>
  );
}

function ReminderRow({ item, onReschedule, onClear, onFollowUp }) {
  const targetHref = item.prospectId
    ? `/comercial/prospectos/${item.prospectId}`
    : item.customerId
      ? `/comercial/clientes/${item.customerId}`
      : '/comercial';

  const overdue = isOverdueDate(item.nextActionAt) || item.daysOverdue > 0;

  return (
    <div
      className={`rounded-xl border p-3 ${
        overdue ? 'border-red-300 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20' : 'bg-card'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-muted rounded-md px-2 py-0.5 text-xs font-medium">
              {formatDateValue(item.nextActionAt)}
            </span>
            {overdue ? (
              <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-300">
                Vencida
              </span>
            ) : null}
          </div>
          <Link href={targetHref} className="block font-medium hover:underline">
            {item.label}
          </Link>
          {item.nextActionNote ? (
            <p className="text-muted-foreground text-sm wrap-break-word whitespace-pre-wrap">
              {item.nextActionNote}
            </p>
          ) : (
            <p className="text-muted-foreground text-sm">Sin nota</p>
          )}
        </div>
      </div>
      <div className="text-muted-foreground mt-3 flex items-center gap-2 text-xs">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${item.type === 'interaction' ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300' : 'bg-slate-500/10 text-slate-700 dark:text-slate-300'}`}
        >
          {item.type === 'interaction' ? (
            <PhoneCall className="size-3" />
          ) : (
            <UserCircle2 className="size-3" />
          )}
          {item.type === 'interaction' ? 'Interacción' : 'Prospecto'}
        </span>
      </div>
      {item.prospectId && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => onReschedule(item)}>
            Aplazar
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onClear(item.prospectId)}>
            Descartar
          </Button>
          {item.type === 'interaction' && (
            <Button variant="ghost" size="sm" onClick={() => onFollowUp(item)}>
              Registrar seguimiento
            </Button>
          )}
        </div>
      )}
      {item.type === 'interaction' && !item.prospectId && item.customerId && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={targetHref}>Abrir cliente</Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onFollowUp(item)}>
            Registrar seguimiento
          </Button>
        </div>
      )}
    </div>
  );
}

export default function CrmDashboardWidgets() {
  const { data, isLoading, refetch } = useCrmDashboard();
  const { scheduleAction, clearAction } = useProspectMutations();
  const [interactionModal, setInteractionModal] = React.useState({
    open: false,
    prospectId: null,
    customerId: null,
    nextActionAt: null,
    nextActionNote: null,
  });

  const handleReschedule = async (item) => {
    const date = window.prompt('Nueva fecha (YYYY-MM-DD)');
    if (!date) return;
    const note = window.prompt('Descripción (opcional):', item?.nextActionNote ?? '');
    try {
      const fromPrompt = note != null ? note.trim() : null;
      const raw =
        fromPrompt != null && fromPrompt.length > 0
          ? fromPrompt
          : item?.nextActionNote != null
            ? String(item.nextActionNote)
            : '';
      const nextActionNote =
        raw.length > 0 ? raw.slice(0, CRM_AGENDA_DESCRIPTION_MAX_LENGTH) : null;
      await notify.promise(
        scheduleAction.mutateAsync({
          id: item.prospectId,
          nextActionAt: date,
          nextActionNote,
        }),
        {
          loading: 'Reprogramando acción...',
          success: 'Acción reprogramada',
          error: (error) => error?.message || 'No se pudo reprogramar la acción',
        }
      );
      refetch();
    } catch {}
  };

  const handleClear = async (prospectId) => {
    try {
      await notify.promise(clearAction.mutateAsync(prospectId), {
        loading: 'Limpiando acción...',
        success: 'Acción descartada',
        error: (error) => error?.message || 'No se pudo descartar la acción',
      });
      refetch();
    } catch {}
  };

  const handleFollowUp = (item) => {
    setInteractionModal({
      open: true,
      prospectId: item.prospectId ?? null,
      customerId: item.customerId ?? null,
      nextActionAt: item.nextActionAt ?? null,
      nextActionNote: item.nextActionNote ?? null,
    });
  };

  if (isLoading) {
    return (
      <>
        <LoadingWidget />
        <LoadingWidget />
        <LoadingWidget />
      </>
    );
  }

  const reminders = [...(data?.overdue_actions ?? []), ...(data?.reminders_today ?? [])];

  return (
    <>
      <Card className="w-full max-w-full overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="size-5" />
            Agenda del día
          </CardTitle>
          <CardDescription>Acciones pendientes y vencidas del CRM comercial.</CardDescription>
        </CardHeader>
        <CardContent>
          {reminders.length === 0 ? (
            <EmptyWidget
              icon={Clock3}
              title="Todo al día"
              description="No tienes acciones pendientes para hoy."
            />
          ) : (
            <Table className="table-fixed">
              <TableBody>
                {reminders.map((item) => {
                  const targetHref = item.prospectId
                    ? `/comercial/prospectos/${item.prospectId}`
                    : item.customerId
                      ? `/comercial/clientes/${item.customerId}`
                      : '/comercial';
                  const overdue = isOverdueDate(item.nextActionAt) || item.daysOverdue > 0;

                  return (
                    <TableRow
                      key={`${item.type}-${item.id}`}
                      className={overdue ? 'bg-red-50/40 dark:bg-red-950/20' : ''}
                    >
                      <TableCell className="w-[72%] whitespace-normal">
                        <Link href={targetHref} className="block font-medium hover:underline">
                          {item.label}
                        </Link>
                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          <p className="text-muted-foreground text-xs">
                            {formatDateValue(item.nextActionAt)}
                          </p>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${
                              item.type === 'interaction'
                                ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300'
                                : 'bg-slate-500/10 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {item.type === 'interaction' ? (
                              <PhoneCall className="size-3" />
                            ) : (
                              <UserCircle2 className="size-3" />
                            )}
                            {overdue ? 'Vencida' : 'Pendiente'}
                          </span>
                        </div>
                        <span className="text-muted-foreground mt-1 block text-xs wrap-break-word">
                          {item.nextActionNote || 'Sin nota'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Acciones">
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => handleReschedule(item)}>
                              Aplazar
                            </DropdownMenuItem>
                            {item.prospectId ? (
                              <DropdownMenuItem onSelect={() => handleClear(item.prospectId)}>
                                Descartar
                              </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuItem onSelect={() => handleFollowUp(item)}>
                              Seguimiento
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="w-full max-w-full overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRoundX className="size-5" />
            Clientes inactivos
          </CardTitle>
          <CardDescription>Clientes sin pedido en más de 30 días.</CardDescription>
        </CardHeader>
        <CardContent>
          {(data?.inactive_customers ?? []).length === 0 ? (
            <EmptyWidget
              icon={UserRoundX}
              title="Sin alertas de clientes"
              description="Todos tus clientes tienen actividad reciente."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Inactividad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.inactive_customers.map((customer) => (
                  <TableRow
                    key={customer.id}
                    className={
                      customer.lastOrderAt == null ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                    }
                  >
                    <TableCell className="font-medium">
                      <Link href={`/comercial/clientes/${customer.id}`} className="hover:underline">
                        {customer.name}
                      </Link>
                      <p className="text-muted-foreground text-xs font-normal">
                        {customer.country?.name ?? 'Sin país'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          customer.lastOrderAt == null
                            ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300'
                            : 'bg-red-500/15 text-red-700 dark:text-red-300'
                        }`}
                      >
                        {customer.lastOrderAt == null ? 'Nunca pidió' : 'Con historial'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {customer.lastOrderAt == null
                        ? '—'
                        : `${customer.daysSinceLastOrder ?? '—'} días`}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="w-full max-w-full overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CircleAlert className="size-5" />
            Prospectos sin actividad
          </CardTitle>
          <CardDescription>Prospectos sin interacción en más de 7 días.</CardDescription>
        </CardHeader>
        <CardContent>
          {(data?.prospects_without_activity ?? []).length === 0 ? (
            <EmptyWidget
              icon={CircleAlert}
              title="Sin prospectos parados"
              description="No hay prospectos pendientes de seguimiento."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prospecto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Sin actividad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.prospects_without_activity.map((prospect) => (
                  <TableRow
                    key={prospect.id}
                    className={
                      prospect.lastContactAt == null ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                    }
                  >
                    <TableCell className="font-medium">
                      <Link
                        href={`/comercial/prospectos/${prospect.id}`}
                        className="hover:underline"
                      >
                        {prospect.companyName}
                      </Link>
                      <p className="text-muted-foreground text-xs font-normal">
                        {prospect.country?.name ?? 'Sin país'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          prospect.lastContactAt == null
                            ? 'bg-blue-500/20 text-blue-800 dark:text-blue-300'
                            : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {prospect.lastContactAt == null ? 'Sin contacto' : 'Con historial'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {prospect.lastContactAt == null
                        ? '—'
                        : `${prospect.daysWithoutActivity ?? '—'} días`}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <QuickInteractionModal
        open={interactionModal.open}
        onOpenChange={(open) => setInteractionModal((current) => ({ ...current, open }))}
        prospectId={interactionModal.prospectId}
        customerId={interactionModal.customerId}
        defaultNextActionDate={interactionModal.nextActionAt}
        defaultNextActionNote={interactionModal.nextActionNote ?? ''}
        title="Registrar seguimiento"
      />
    </>
  );
}
