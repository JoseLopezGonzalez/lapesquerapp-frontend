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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const resultTypes = [
  { value: 'delivery', label: 'Entrega realizada' },
  { value: 'autoventa', label: 'Autoventa realizada' },
  { value: 'no_contact', label: 'Sin contacto' },
  { value: 'incident', label: 'Incidencia' },
  { value: 'visit', label: 'Visita realizada' },
];

export function ResultDialog({
  open,
  onOpenChange,
  resultType,
  onResultTypeChange,
  resultNotes,
  onResultNotesChange,
  isUpdating,
  onSubmit,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar resultado</DialogTitle>
          <DialogDescription>
            Marca el resultado de la parada con el mínimo detalle necesario.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Resultado</Label>
            <Select value={resultType} onValueChange={onResultTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un resultado" />
              </SelectTrigger>
              <SelectContent>
                {resultTypes.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea
              value={resultNotes}
              onChange={onResultNotesChange}
              placeholder="Añade una nota breve si hace falta"
              rows={4}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSubmit} disabled={isUpdating}>
            Guardar resultado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
