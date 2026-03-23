'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { agendaStatusLabels } from './utils';

const STATUS_OPTIONS = ['pending', 'reprogrammed', 'done', 'cancelled'];
const TARGET_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'prospect', label: 'Prospectos' },
  { value: 'customer', label: 'Clientes' },
];

export function AgendaFiltersDialog({
  open,
  onOpenChange,
  draftTargetType,
  draftStatuses,
  onDraftTargetTypeChange,
  onToggleDraftStatus,
  onApply,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Filtro</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Tipo</p>
            <div className="flex flex-wrap gap-2">
              {TARGET_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  size="sm"
                  variant={draftTargetType === option.value ? 'default' : 'outline'}
                  onClick={() => onDraftTargetTypeChange(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Estado</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((status) => (
                <Button
                  key={status}
                  type="button"
                  size="sm"
                  variant={draftStatuses.includes(status) ? 'default' : 'outline'}
                  onClick={() => onToggleDraftStatus(status)}
                >
                  {agendaStatusLabels[status]}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onApply}>Aplicar filtros</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
