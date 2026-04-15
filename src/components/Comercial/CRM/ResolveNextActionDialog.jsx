'use client';

import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Calendar, CalendarClock, CalendarOff, FilePen, Loader2, Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/datePicker';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { notify } from '@/lib/notifications';
import { useAgendaMutations, usePendingAgendaAction } from '@/hooks/useAgenda';
import { extractAgendaErrorCode, getAgendaDomainErrorMessage } from './agendaErrorMessages';
import { formatDateValue } from './utils';
import { CRM_AGENDA_DESCRIPTION_MAX_LENGTH } from './schemas/crmTextLimits';

const strategyOptions = [
  {
    value: 'create_if_none',
    label: 'Crear próxima acción',
    description: 'Programa cuándo será el siguiente seguimiento.',
    icon: CalendarClock,
  },
  {
    value: 'reschedule',
    label: 'Posponer a otro día',
    description: 'Mueve la acción a otro día.',
    icon: CalendarClock,
  },
  {
    value: 'reschedule_with_description',
    label: 'Posponer y cambiar el texto',
    description: 'Mueve la fecha y actualiza también la descripción.',
    icon: FilePen,
  },
  {
    value: 'override',
    label: 'Reemplazar por una nueva',
    description: 'Cancela la pendiente actual y crea una diferente.',
    icon: CalendarOff,
  },
  {
    value: 'keep',
    label: 'Dejarla como está',
    description: 'No cambies nada en la acción pendiente.',
    icon: Lock,
  },
];

function getAllowedStrategies(hasPending) {
  if (hasPending) return ['keep', 'reschedule', 'reschedule_with_description', 'override'];
  return ['create_if_none'];
}

export default function ResolveNextActionDialog({ open, onOpenChange, targetType, targetId, sourceInteractionId = null, onViewAction = null }) {
  const { resolveNextAction } = useAgendaMutations();
  const { data: pendingData, isLoading: pendingLoading, refetch: refetchPending } = usePendingAgendaAction(targetType, targetId, open);
  const pending = pendingData?.pendingAction ?? null;

  const [strategy, setStrategy] = useState('create_if_none');
  const [step, setStep] = useState('strategy');
  const [nextActionAt, setNextActionAt] = useState(null);
  const [description, setDescription] = useState('');
  const [reason, setReason] = useState('');
  const [isImprovingDescription, setIsImprovingDescription] = useState(false);

  useEffect(() => {
    if (!open) return;
    const hasPending = Boolean(pending);
    setStrategy(hasPending ? 'reschedule' : 'create_if_none');
    // Sin pendiente → ir directamente al formulario, sin paso de selección de estrategia
    setStep(hasPending ? 'strategy' : 'form');
    setNextActionAt(pending?.scheduledAt ? new Date(pending.scheduledAt) : null);
    setDescription(pending?.description ?? '');
    setReason('');
  }, [open, pending?.agendaActionId, pending?.scheduledAt, pending?.description]);

  useEffect(() => {
    if (!open) return;
    const allowed = getAllowedStrategies(Boolean(pending));
    if (!allowed.includes(strategy)) {
      setStrategy(allowed[0]);
    }
  }, [open, pending, strategy]);

  const visibleStrategyOptions = useMemo(() => {
    const allowed = getAllowedStrategies(Boolean(pending));
    return strategyOptions.filter((item) => allowed.includes(item.value));
  }, [pending]);

  // Reglas por estrategia alineadas con el backend
  // reschedule: fecha requerida; prohíbe description y reason
  // reschedule_with_description: fecha + description requeridos; prohíbe reason
  // override: fecha + reason requeridos; description opcional
  // create_if_none: fecha requerida; description opcional; prohíbe reason
  // keep: sin campos adicionales
  const requiresDate = useMemo(() => ['create_if_none', 'reschedule', 'reschedule_with_description', 'override'].includes(strategy), [strategy]);
  const requiresDescription = strategy === 'reschedule_with_description';
  const showsDescription = useMemo(() => ['reschedule_with_description', 'override', 'create_if_none'].includes(strategy), [strategy]);
  const requiresReason = strategy === 'override';
  const allowsSourceInteraction = strategy !== 'keep';

  const selectedStrategyLabel = useMemo(
    () => strategyOptions.find((item) => item.value === strategy)?.label ?? strategy,
    [strategy]
  );

  const onSubmit = async () => {
    if (!targetType || !targetId) return;
    if (requiresDate && !nextActionAt) {
      notify.error({ title: 'Selecciona una fecha para la próxima acción' });
      return;
    }
    if (requiresDescription && !description.trim()) {
      notify.error({ title: 'Escribe una descripción para la acción' });
      return;
    }
    if (requiresReason && !reason.trim()) {
      notify.error({ title: 'Indica el motivo de la sustitución' });
      return;
    }

    // Construir payload solo con los campos permitidos por cada estrategia
    const payload = {
      targetType,
      targetId,
      strategy,
      expectedPendingId: pending?.agendaActionId,
    };
    if (requiresDate && nextActionAt) payload.nextActionAt = format(nextActionAt, 'yyyy-MM-dd');
    if (showsDescription) payload.description = description.trim() || null;
    if (requiresReason) payload.reason = reason.trim();
    if (allowsSourceInteraction && sourceInteractionId) payload.sourceInteractionId = sourceInteractionId;

    try {
      await notify.promise(resolveNextAction.mutateAsync(payload), {
        loading: 'Resolviendo próxima acción...',
        success: 'Próxima acción actualizada',
        error: (error) => getAgendaDomainErrorMessage(error, 'No se pudo resolver la próxima acción'),
      });
      onOpenChange(false);
    } catch (error) {
      if (extractAgendaErrorCode(error) === 'STALE_PENDING') {
        await refetchPending();
        notify.error({
          title: 'La acción cambió en paralelo',
          description: 'Se ha recargado la pendiente actual. Revisa y vuelve a confirmar.',
        });
      }
    }
  };

  const handleImproveDescription = async () => {
    const rawDescription = String(description ?? '').trim();
    if (!rawDescription) {
      notify.error({ title: 'Escribe una descripción antes de mejorarla con IA' });
      return;
    }

    setIsImprovingDescription(true);
    try {
      const response = await fetch('/api/crm/improve-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          kind: 'next_action_description',
          text: rawDescription,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || 'No se pudo mejorar la descripción con IA');
      }

      const improvedDescription = String(payload?.improvedText ?? '').trim();
      if (!improvedDescription) {
        throw new Error('La IA no devolvió una descripción válida');
      }

      setDescription(improvedDescription);
    } catch (error) {
      notify.error({
        title: 'Error al mejorar la descripción',
        description: error?.message || 'No se pudo procesar la mejora con IA',
      });
    } finally {
      setIsImprovingDescription(false);
    }
  };

  const hasPending = Boolean(pending);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{hasPending ? 'Gestionar próxima acción' : 'Nueva próxima acción'}</DialogTitle>
          <DialogDescription>
            {hasPending
              ? 'Ya hay una acción pendiente. Elige qué hacer con ella.'
              : 'Fija cuándo y cómo será el siguiente seguimiento.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {/* Bloque de pendiente: solo si hay una o está cargando */}
          {(pendingLoading || hasPending) && (
            pendingLoading ? (
              <div className="rounded-xl border bg-muted/10 p-4">
                <p className="text-sm text-muted-foreground">Consultando acción pendiente...</p>
              </div>
            ) : (
              <button
                type="button"
                disabled={!onViewAction}
                onClick={() => onViewAction?.(pending)}
                className="w-full rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-3 flex items-start gap-3 text-left transition-colors enabled:hover:bg-amber-100 dark:enabled:hover:bg-amber-900/40 enabled:cursor-pointer disabled:cursor-default"
              >
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 mt-0.5">
                  <Calendar className="size-3.5" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                    {formatDateValue(pending.scheduledAt)}
                  </p>
                  {pending.description && (
                    <p className="text-sm text-foreground leading-snug">{pending.description}</p>
                  )}
                </div>
              </button>
            )
          )}

          {hasPending && step === 'strategy' ? (
            <div className="grid gap-2">
              <Label>¿Qué quieres hacer?</Label>
              <div className="grid gap-2">
                {visibleStrategyOptions.map((item) => {
                  const Icon = item.icon;
                  const selected = strategy === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setStrategy(item.value)}
                      className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
                        selected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                          : 'border-border bg-background hover:bg-muted/50'
                      }`}
                    >
                      <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg mt-0.5 ${
                        selected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                      }`}>
                        <Icon className="size-4" />
                      </div>
                      <div className="space-y-0.5">
                        <p className={`text-sm font-medium leading-none ${selected ? 'text-primary' : 'text-foreground'}`}>
                          {item.label}
                        </p>
                        <p className="text-xs text-muted-foreground leading-snug">{item.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <>

              {requiresDate && (
                <div className="grid gap-2">
                  <Label>Fecha</Label>
                  <DatePicker date={nextActionAt} onChange={setNextActionAt} formatStyle="short" />
                </div>
              )}

              {showsDescription && (
                <div className="grid gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="resolve-next-action-description">
                      Descripción{!requiresDescription && <span className="ml-1 text-xs font-normal text-muted-foreground">(opcional)</span>}
                    </Label>
                    <Button
                      type="button"
                      onClick={handleImproveDescription}
                      disabled={isImprovingDescription || resolveNextAction.isPending}
                    >
                      {isImprovingDescription ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Mejorando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="size-4" />
                          Mejorar con IA
                        </>
                      )}
                    </Button>
                  </div>
                  <Textarea
                    id="resolve-next-action-description"
                    rows={3}
                    maxLength={CRM_AGENDA_DESCRIPTION_MAX_LENGTH}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Enviar oferta, llamar al cliente, preparar muestra..."
                  />
                </div>
              )}
              {requiresReason && (
                <div className="grid gap-2">
                  <Label htmlFor="resolve-next-action-reason">Motivo de sustitución</Label>
                  <Textarea
                    id="resolve-next-action-reason"
                    rows={2}
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Cambio de negociación, prioridad nueva, petición urgente..."
                  />
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          {hasPending && step === 'form' && (
            <Button variant="outline" onClick={() => setStep('strategy')} className="mr-auto">
              Volver
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          {hasPending && step === 'strategy' ? (
            <Button onClick={() => setStep('form')}>Continuar</Button>
          ) : (
            <Button onClick={onSubmit} disabled={resolveNextAction.isPending}>
              {strategy === 'keep' ? 'Salir' : 'Guardar'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
