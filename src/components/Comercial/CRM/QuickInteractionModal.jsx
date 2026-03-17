'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/datePicker';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { notify } from '@/lib/notifications';
import { useCommercialInteractionMutations } from '@/hooks/useCommercialInteractions';
import { format } from 'date-fns';
import { interactionResultOptions, interactionTypeOptions } from './utils';

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
  defaultNextActionDate = null,
  title = 'Registrar interacción',
}) {
  const { createInteraction } = useCommercialInteractionMutations();
  const [type, setType] = useState('call');
  const [occurredAt, setOccurredAt] = useState(new Date());
  const [summary, setSummary] = useState('');
  const [result, setResult] = useState('pending');
  const [nextActionNote, setNextActionNote] = useState('');
  const [nextActionAt, setNextActionAt] = useState(defaultNextActionDate ? new Date(defaultNextActionDate) : null);

  useEffect(() => {
    if (!open) return;
    setType('call');
    setOccurredAt(new Date());
    setSummary('');
    setResult('pending');
    setNextActionNote('');
    setNextActionAt(defaultNextActionDate ? new Date(defaultNextActionDate) : null);
  }, [open, defaultNextActionDate]);

  const handleSubmit = async () => {
    if (!summary.trim()) {
      notify.error({ title: 'Añade un resumen de la interacción' });
      return;
    }

    const payload = {
      ...(prospectId ? { prospectId } : {}),
      ...(customerId ? { customerId } : {}),
      type,
      occurredAt: occurredAt.toISOString(),
      summary: summary.trim(),
      result,
      nextActionNote: nextActionNote.trim() || null,
      nextActionAt: nextActionAt ? format(nextActionAt, 'yyyy-MM-dd') : null,
    };

    try {
      await notify.promise(createInteraction.mutateAsync(payload), {
        loading: 'Registrando interacción...',
        success: 'Interacción registrada',
        error: (error) => error?.message || 'No se pudo registrar la interacción',
      });
      onOpenChange(false);
    } catch {}
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Registra seguimiento comercial y, si hace falta, deja la siguiente acción programada.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
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

          {result !== 'not_interested' && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="next-action-note">Próxima acción</Label>
                <Input
                  id="next-action-note"
                  value={nextActionNote}
                  onChange={(event) => setNextActionNote(event.target.value)}
                  placeholder="Enviar oferta, volver a llamar, preparar muestra..."
                />
              </div>
              <div className="grid gap-2">
                <Label>Fecha próxima acción</Label>
                <DatePicker date={nextActionAt} onChange={setNextActionAt} formatStyle="short" />
                <div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setNextActionAt(null)}>
                    Sin próxima acción
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={createInteraction.isPending}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
