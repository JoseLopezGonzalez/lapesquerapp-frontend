'use client';

import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { ChevronLeft, ChevronRight, Filter, Plus } from 'lucide-react';

export function AgendaHeaderControls({ onToday, onOpenFilters, onPrevMonth, onNextMonth, onNewInteraction }) {
  return (
    <div className="flex items-center gap-2">
      {onNewInteraction && (
        <Button type="button" size="sm" onClick={onNewInteraction}>
          <Plus />
          Nueva interacción
        </Button>
      )}
      <Button type="button" variant="outline" size="sm" onClick={onToday}>
        Hoy
      </Button>
      <Button type="button" variant="outline" size="icon-sm" onClick={onOpenFilters} aria-label="Filtros">
        <Filter />
      </Button>
      <ButtonGroup orientation="horizontal" aria-label="Navegación de mes">
        <Button type="button" variant="ghost" size="icon-sm" onClick={onPrevMonth}>
          <ChevronLeft />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" onClick={onNextMonth}>
          <ChevronRight />
        </Button>
      </ButtonGroup>
    </div>
  );
}
