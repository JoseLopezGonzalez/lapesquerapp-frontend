'use client';

import Link from 'next/link';
import * as React from 'react';
import { CalendarClock, CircleAlert, Clock3, UserRoundX, PhoneCall, UserCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { useCrmDashboard } from '@/hooks/useCrmDashboard';
import { useProspectMutations } from '@/hooks/useProspects';
import { formatDateValue, isOverdueDate } from './utils';
import { notify } from '@/lib/notifications';
import QuickInteractionModal from './QuickInteractionModal';

function EmptyWidget({ icon: Icon, title, description }) {
  return (
    <Empty className="border bg-muted/20 min-h-[180px]">
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
    <div className={`rounded-xl border p-3 ${overdue ? 'border-red-300 bg-red-50/70 dark:border-red-900 dark:bg-red-950/20' : 'bg-card'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={targetHref} className="font-medium hover:underline">
            {item.label}
          </Link>
          <p className="text-sm text-muted-foreground">{formatDateValue(item.nextActionAt)}</p>
          {item.nextActionNote ? (
            <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">
              {item.nextActionNote}
            </p>
          ) : null}
        </div>
        {overdue && (
          <span className="rounded-full bg-red-500/15 px-2 py-1 text-xs font-medium text-red-700 dark:text-red-300">
            Vencida
          </span>
        )}
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${item.type === 'interaction' ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300' : 'bg-slate-500/10 text-slate-700 dark:text-slate-300'}`}>
          {item.type === 'interaction' ? <PhoneCall className="size-3" /> : <UserCircle2 className="size-3" />}
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
      await notify.promise(
        scheduleAction.mutateAsync({
          id: item.prospectId,
          nextActionAt: date,
          nextActionNote: note != null && note.trim() ? note.trim() : (item?.nextActionNote ?? null),
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
            <div className="space-y-3">
              {reminders.map((item) => (
                <ReminderRow
                  key={`${item.type}-${item.id}`}
                  item={item}
                  onReschedule={handleReschedule}
                  onClear={handleClear}
                  onFollowUp={handleFollowUp}
                />
              ))}
            </div>
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
            <div className="space-y-3">
              {data.inactive_customers.map((customer) => (
                <Link
                  key={customer.id}
                  href={`/comercial/clientes/${customer.id}`}
                  className="block rounded-xl border p-3 hover:bg-accent/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-sm text-muted-foreground">{customer.country?.name ?? 'Sin país'}</p>
                    </div>
                    <span className="rounded-full bg-red-500/15 px-2 py-1 text-xs font-medium text-red-700 dark:text-red-300">
                      {customer.daysSinceLastOrder} días
                    </span>
                  </div>
                </Link>
              ))}
            </div>
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
            <div className="space-y-3">
              {data.prospects_without_activity.map((prospect) => (
                <Link
                  key={prospect.id}
                  href={`/comercial/prospectos/${prospect.id}`}
                  className="block rounded-xl border p-3 hover:bg-accent/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{prospect.companyName}</p>
                      <p className="text-sm text-muted-foreground">{prospect.country?.name ?? 'Sin país'}</p>
                    </div>
                    <span className="rounded-full bg-amber-500/15 px-2 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                      {prospect.daysWithoutActivity} días
                    </span>
                  </div>
                </Link>
              ))}
            </div>
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
