'use client';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CalendarDays, FileText, UserRound } from 'lucide-react';

export function CreatePlannerItemDialog({
  open,
  onOpenChange,
  tab,
  draft,
  fieldOperatorOptions,
  templateOptions,
  onChange,
  onConfirm,
}) {
  if (!draft) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{tab === 'routes' ? 'Nueva ruta' : 'Nueva plantilla'}</DialogTitle>
          <DialogDescription>
            Completa los datos iniciales antes de abrir el editor visual del planner.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input
              value={draft.name}
              onChange={(event) => onChange('name', event.target.value)}
              placeholder={tab === 'routes' ? 'Ruta costa norte' : 'Plantilla martes'}
            />
          </div>

          {tab === 'routes' && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Origen de la ruta</Label>
                <Select
                  value={draft.sourceMode || 'manual'}
                  onValueChange={(value) => onChange('sourceMode', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Desde cero</SelectItem>
                    <SelectItem value="template">Desde plantilla</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {draft.sourceMode === 'template' && (
                <div className="space-y-2">
                  <Label>Plantilla</Label>
                  <Select
                    value={draft.routeTemplateId || ''}
                    onValueChange={(value) => onChange('routeTemplateId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una plantilla" />
                    </SelectTrigger>
                    <SelectContent>
                      {templateOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <UserRound className="h-4 w-4" />
                Repartidor
              </Label>
              <Select
                value={draft.fieldOperatorId || ''}
                onValueChange={(value) => onChange('fieldOperatorId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un repartidor" />
                </SelectTrigger>
                <SelectContent>
                  {fieldOperatorOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {tab === 'routes' && (
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <CalendarDays className="h-4 w-4" />
                  Fecha
                </Label>
                <Input
                  type="date"
                  value={draft.routeDate || ''}
                  onChange={(event) => onChange('routeDate', event.target.value)}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              Descripción
            </Label>
            <Textarea
              value={draft.description || ''}
              onChange={(event) => onChange('description', event.target.value)}
              rows={4}
              placeholder="Resumen corto o nota operativa"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={
              !draft.name.trim() ||
              (tab === 'routes' && draft.sourceMode === 'template' && !draft.routeTemplateId)
            }
          >
            Crear y abrir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
