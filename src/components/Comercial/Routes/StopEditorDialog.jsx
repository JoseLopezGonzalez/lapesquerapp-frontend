'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export function StopEditorDialog({
  open,
  onOpenChange,
  initialStop,
  onSave,
  customerOptions,
  prospectOptions,
  mode = 'edit',
}) {
  const [draft, setDraft] = useState(initialStop);

  useEffect(() => {
    setDraft(initialStop);
  }, [initialStop]);

  if (!draft) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Nueva parada' : 'Editar parada'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Define primero la parada antes de añadirla a la ruta o plantilla.'
              : 'Define el tipo de parada, su objetivo y el contexto visible.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Tipo de parada</Label>
              <Select value={draft.stopType} onValueChange={(value) => setDraft((current) => ({ ...current, stopType: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="obligatoria">Obligatoria</SelectItem>
                  <SelectItem value="sugerida">Sugerida</SelectItem>
                  <SelectItem value="oportunidad">Oportunidad</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Objetivo</Label>
              <Select
                value={draft.targetType}
                onValueChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    targetType: value,
                    customerId: value === 'customer' ? current.customerId : null,
                    prospectId: value === 'prospect' ? current.prospectId : null,
                  }))
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="location">Ubicación</SelectItem>
                  <SelectItem value="customer">Cliente</SelectItem>
                  <SelectItem value="prospect">Prospecto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {draft.targetType === 'customer' && (
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select
                value={draft.customerId != null ? String(draft.customerId) : ''}
                onValueChange={(value) => {
                  const selected = customerOptions.find((option) => option.value === value);
                  setDraft((current) => ({
                    ...current,
                    customerId: value ? Number(value) : null,
                    prospectId: null,
                    label: selected?.label || current.label,
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {customerOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {draft.targetType === 'prospect' && (
            <div className="space-y-2">
              <Label>Prospecto</Label>
              <Select
                value={draft.prospectId != null ? String(draft.prospectId) : ''}
                onValueChange={(value) => {
                  const selected = prospectOptions.find((option) => option.value === value);
                  setDraft((current) => ({
                    ...current,
                    prospectId: value ? Number(value) : null,
                    customerId: null,
                    label: selected?.label || current.label,
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un prospecto" />
                </SelectTrigger>
                <SelectContent>
                  {prospectOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Etiqueta</Label>
            <Input value={draft.label} onChange={(event) => setDraft((current) => ({ ...current, label: event.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label>Dirección</Label>
            <Input value={draft.address} onChange={(event) => setDraft((current) => ({ ...current, address: event.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} rows={4} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => onSave(draft)}>{mode === 'create' ? 'Añadir parada' : 'Guardar parada'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
