'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarCheck2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/datePicker';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { notify } from '@/lib/notifications';
import { ApiError } from '@/lib/api/apiHelpers';
import { setErrorsFrom422 } from '@/lib/validation/setErrorsFrom422';
import { useCommercialInteractionMutations } from '@/hooks/useCommercialInteractions';
import { getAgendaDomainErrorMessage } from './agendaErrorMessages';
import { format } from 'date-fns';
import { formatDateValue, interactionResultOptions, interactionTypeOptions } from './utils';
import { CRM_INTERACTION_SUMMARY_MAX_LENGTH } from './schemas/crmTextLimits';
import { getQuickInteractionDefaultValues, getQuickInteractionFormSchema } from './schemas/quickInteractionFormSchema';

function ToggleGroup({ value, onChange, options }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Button
          key={option.value}
          type="button"
          variant={value === option.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

function FieldError({ message }) {
  if (!message) return null;
  return <p className="text-sm text-red-500">{message}</p>;
}

function QuickInteractionModalInner({
  open,
  onOpenChange,
  prospectId = null,
  customerId = null,
  agendaActionId = null,
  defaultNextActionDate = null,
  defaultNextActionNote = '',
  title = 'Registrar interacción',
  mode = 'create',
  onInteractionCreated,
}) {
  const { createInteraction } = useCommercialInteractionMutations();
  const isCompleteMode = mode === 'complete';

  const formSchema = useMemo(() => getQuickInteractionFormSchema(isCompleteMode), [isCompleteMode]);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: getQuickInteractionDefaultValues({
      isCompleteMode,
      defaultNextActionDate,
      defaultNextActionNote,
    }),
    mode: 'onTouched',
  });

  const type = watch('type');
  const result = watch('result');

  const wasOpenRef = useRef(false);

  useEffect(() => {
    const opening = open && !wasOpenRef.current;
    wasOpenRef.current = open;
    if (!opening) return;

    reset(
      getQuickInteractionDefaultValues({
        isCompleteMode,
        defaultNextActionDate,
        defaultNextActionNote,
      })
    );
  }, [open, defaultNextActionDate, defaultNextActionNote, isCompleteMode, reset]);

  const getErrorText = (error) => {
    if (error?.status !== 422) {
      return error?.message || 'No se pudo registrar la interacción';
    }

    const baseMessage = String(error?.message || '').toLowerCase();
    if (baseMessage.includes('agendaactionid')) {
      return 'No se pudo cerrar la tarea porque falta la referencia de agenda. Recarga la agenda e inténtalo de nuevo.';
    }

    if (baseMessage.includes('target')) {
      return 'La acción pendiente no corresponde con el prospecto o cliente seleccionado. Recarga la agenda e inténtalo de nuevo.';
    }

    if (baseMessage.includes('not pending') || baseMessage.includes('status')) {
      return 'La acción ya no está pendiente. Actualiza la agenda antes de volver a intentarlo.';
    }

    if (baseMessage.includes('pending') || baseMessage.includes('agenda') || baseMessage.includes('next action')) {
      return 'Ya existe una acción pendiente activa para este target. Reprograma o cancela la pendiente actual antes de crear otra.';
    }

    return getAgendaDomainErrorMessage(error, 'La agenda no aceptó la operación solicitada.');
  };

  const onValidSubmit = async (values) => {
    if (!prospectId && !customerId) {
      notify.error({ title: 'No se ha encontrado el destino de la interacción' });
      return;
    }

    if (isCompleteMode && !agendaActionId) {
      notify.error({ title: 'No se ha encontrado la acción de agenda a cerrar' });
      return;
    }

    const payload = {
      ...(prospectId ? { prospectId } : {}),
      ...(customerId ? { customerId } : {}),
      ...(agendaActionId ? { agendaActionId } : {}),
      type: values.type,
      occurredAt: values.occurredAt.toISOString(),
      summary: values.summary.trim().slice(0, CRM_INTERACTION_SUMMARY_MAX_LENGTH),
      result: values.result,
      nextActionNote: null,
      nextActionAt: null,
    };

    try {
      const response = await notify.promise(createInteraction.mutateAsync(payload), {
        loading: isCompleteMode ? 'Cerrando tarea y registrando interacción...' : 'Registrando interacción...',
        success: isCompleteMode ? 'Tarea cerrada e interacción registrada' : 'Interacción registrada',
        error: (error) => getErrorText(error),
      });
      if (typeof onInteractionCreated === 'function') {
        onInteractionCreated(response?.data ?? null);
      }
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 422 && err.data?.errors) {
        setErrorsFrom422(setError, err.data.errors);
      }
    }
  };

  const onInvalidSubmit = (formErrors) => {
    const n = Object.keys(formErrors).length;
    notify.error({
      title: 'Revisa el formulario',
      description: n > 1 ? `Hay ${n} campos con errores.` : 'Corrige el error indicado antes de guardar.',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {isCompleteMode
              ? 'Cierra la tarea pendiente registrando la interacción que la resuelve.'
              : 'Registra seguimiento comercial.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {isCompleteMode && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/15 p-2 text-primary">
                  <CalendarCheck2 className="size-4" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-primary">Se cerrará la acción pendiente actual</p>
                  <p className="text-xs text-muted-foreground">
                    {defaultNextActionDate ? formatDateValue(defaultNextActionDate) : 'Sin fecha'}
                  </p>
                  {defaultNextActionNote && (
                    <p className="text-sm text-foreground">{defaultNextActionNote}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label>Tipo</Label>
            <ToggleGroup
              value={type}
              onChange={(value) => setValue('type', value, { shouldValidate: true })}
              options={interactionTypeOptions}
            />
            <FieldError message={errors.type?.message} />
          </div>

          <div className="grid gap-2">
            <Label>Fecha</Label>
            <Controller
              name="occurredAt"
              control={control}
              render={({ field }) => (
                <DatePicker date={field.value ?? null} onChange={field.onChange} formatStyle="short" />
              )}
            />
            <FieldError message={errors.occurredAt?.message} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="interaction-summary">Resumen</Label>
            <Textarea
              id="interaction-summary"
              rows={3}
              maxLength={CRM_INTERACTION_SUMMARY_MAX_LENGTH}
              placeholder="Qué se ha hablado, qué ha pedido o qué queda pendiente"
              aria-invalid={errors.summary ? 'true' : undefined}
              {...register('summary')}
            />
            <FieldError message={errors.summary?.message} />
          </div>

          <div className="grid gap-2">
            <Label>Resultado</Label>
            <ToggleGroup
              value={result}
              onChange={(value) => setValue('result', value, { shouldValidate: true })}
              options={interactionResultOptions}
            />
            <FieldError message={errors.result?.message} />
          </div>

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit(onValidSubmit, onInvalidSubmit)}
            disabled={createInteraction.isPending}
          >
            {isCompleteMode ? 'Cerrar tarea' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function QuickInteractionModal(props) {
  const isCompleteMode = props?.mode === 'complete';
  return <QuickInteractionModalInner key={isCompleteMode ? 'complete' : 'create'} {...props} />;
}
