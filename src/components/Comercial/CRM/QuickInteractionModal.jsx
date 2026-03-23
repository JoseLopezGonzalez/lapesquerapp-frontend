'use client';

import { useEffect, useRef, useState } from 'react';
import { CalendarCheck2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/datePicker';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { notify } from '@/lib/notifications';
import { useCommercialInteractionMutations } from '@/hooks/useCommercialInteractions';
import { format } from 'date-fns';
import { formatDateValue, interactionResultOptions, interactionTypeOptions } from './utils';

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

export default function QuickInteractionModal({
  open,
  onOpenChange,
  prospectId = null,
  customerId = null,
  agendaActionId = null,
  defaultNextActionDate = null,
  defaultNextActionNote = '',
  title = 'Registrar interacción',
  mode = 'create',
}) {
  const { createInteraction } = useCommercialInteractionMutations();
  const isCompleteMode = mode === 'complete';
  const [type, setType] = useState('call');
  const [occurredAt, setOccurredAt] = useState(new Date());
  const [summary, setSummary] = useState('');
  const [result, setResult] = useState('pending');
  const [nextActionNote, setNextActionNote] = useState(isCompleteMode ? '' : defaultNextActionNote);
  const [nextActionAt, setNextActionAt] = useState(isCompleteMode ? null : (defaultNextActionDate ? new Date(defaultNextActionDate) : null));
  const [noNextAction, setNoNextAction] = useState(isCompleteMode);
  const [scheduleNextAction, setScheduleNextAction] = useState(false);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    const opening = open && !wasOpenRef.current;
    wasOpenRef.current = open;
    if (!opening) return;

    setType('call');
    setOccurredAt(new Date());
    setSummary('');
    setResult('pending');
    setNextActionNote(isCompleteMode ? '' : (defaultNextActionNote ?? ''));
    setNextActionAt(isCompleteMode ? null : (defaultNextActionDate ? new Date(defaultNextActionDate) : null));
    setNoNextAction(isCompleteMode);
    setScheduleNextAction(false);
  }, [open, defaultNextActionDate, defaultNextActionNote, isCompleteMode]);

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

    return error?.message || 'La agenda no aceptó la operación solicitada.';
  };

  const handleSubmit = async () => {
    if (!summary.trim()) {
      notify.error({ title: 'Añade un resumen de la interacción' });
      return;
    }

    if (!prospectId && !customerId) {
      notify.error({ title: 'No se ha encontrado el destino de la interacción' });
      return;
    }

    if (isCompleteMode && !agendaActionId) {
      notify.error({ title: 'No se ha encontrado la acción de agenda a cerrar' });
      return;
    }

    if (((isCompleteMode && scheduleNextAction) || (!isCompleteMode && !noNextAction)) && !nextActionAt) {
      notify.error({ title: 'Selecciona una fecha para la próxima acción' });
      return;
    }

    const shouldSendNextAction = isCompleteMode ? scheduleNextAction : !noNextAction;

    const payload = {
      ...(prospectId ? { prospectId } : {}),
      ...(customerId ? { customerId } : {}),
      ...(agendaActionId ? { agendaActionId } : {}),
      type,
      occurredAt: occurredAt.toISOString(),
      summary: summary.trim(),
      result,
      nextActionNote: shouldSendNextAction ? nextActionNote.trim() || null : null,
      nextActionAt: shouldSendNextAction && nextActionAt ? format(nextActionAt, 'yyyy-MM-dd') : null,
    };

    try {
      await notify.promise(createInteraction.mutateAsync(payload), {
        loading: isCompleteMode ? 'Cerrando tarea y registrando interacción...' : 'Registrando interacción...',
        success: isCompleteMode ? 'Tarea cerrada e interacción registrada' : 'Interacción registrada',
        error: (error) => getErrorText(error),
      });
      onOpenChange(false);
    } catch {}
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {isCompleteMode
              ? 'Cierra la tarea pendiente registrando la interacción que la resuelve y, si hace falta, deja la siguiente acción programada.'
              : 'Registra seguimiento comercial y, si hace falta, deja la siguiente acción programada.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {isCompleteMode && (
            <div className="rounded-xl border bg-muted/10 p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  <CalendarCheck2 className="size-4" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Se cerrará la acción pendiente actual</p>
                  <p className="text-sm text-muted-foreground">
                    {defaultNextActionDate ? formatDateValue(defaultNextActionDate) : 'Sin fecha'} {defaultNextActionNote ? `· ${defaultNextActionNote}` : ''}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label>Tipo</Label>
            <ToggleGroup value={type} onChange={setType} options={interactionTypeOptions} />
          </div>

          <div className="grid gap-2">
            <Label>Fecha</Label>
            <DatePicker date={occurredAt} onChange={setOccurredAt} formatStyle="short" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="interaction-summary">Resumen</Label>
            <Textarea
              id="interaction-summary"
              rows={3}
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              placeholder="Qué se ha hablado, qué ha pedido o qué queda pendiente"
            />
          </div>

          <div className="grid gap-2">
            <Label>Resultado</Label>
            <ToggleGroup value={result} onChange={setResult} options={interactionResultOptions} />
          </div>

          {((!isCompleteMode) || (isCompleteMode && result !== 'not_interested')) && (
            <>
              {isCompleteMode ? (
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Checkbox
                    checked={scheduleNextAction}
                    onCheckedChange={(checked) => {
                      const value = Boolean(checked);
                      setScheduleNextAction(value);
                      if (!value) {
                        setNextActionAt(null);
                        setNextActionNote('');
                      }
                    }}
                  />
                  Programar siguiente acción
                </label>
              ) : (
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Checkbox
                    checked={noNextAction}
                    onCheckedChange={(checked) => {
                      const value = Boolean(checked);
                      setNoNextAction(value);
                      if (value) {
                        setNextActionAt(null);
                        setNextActionNote('');
                      }
                    }}
                  />
                  Sin próxima acción
                </label>
              )}

              {((isCompleteMode && scheduleNextAction) || (!isCompleteMode && !noNextAction)) && (
                <div className="grid gap-4 rounded-xl border bg-muted/10 p-4">
                  <div className="grid gap-2">
                    <Label>Fecha próxima acción</Label>
                    <DatePicker date={nextActionAt} onChange={setNextActionAt} formatStyle="short" />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="next-action-note">Descripción de la acción</Label>
                    <Textarea
                      id="next-action-note"
                      rows={2}
                      value={nextActionNote}
                      onChange={(event) => setNextActionNote(event.target.value)}
                      placeholder="Enviar oferta, volver a llamar, preparar muestra..."
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={createInteraction.isPending}>
            {isCompleteMode ? 'Cerrar tarea' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
