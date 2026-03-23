'use client';

import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmptyState } from '@/components/Utilities/EmptyState';
import { CopyPlus, MapPinPlus, MapPinned, PanelLeftOpen, X } from 'lucide-react';
import { SortableStopItem } from './SortableStopItem';

export function RouteStopsPanel({
  stopsPanelExpanded,
  setStopsPanelExpanded,
  currentDraft,
  sensors,
  handleDragEnd,
  onSearch,
  onAddStop,
  onEditStop,
}) {
  if (!stopsPanelExpanded) {
    return (
      <div className="absolute left-4 top-4 z-20">
        <Button type="button" variant="secondary" onClick={() => setStopsPanelExpanded(true)}>
          <PanelLeftOpen className="mr-2 h-4 w-4" />
          Ver paradas
        </Button>
      </div>
    );
  }

  return (
    <div className="absolute left-4 top-4 z-20 w-[360px] max-w-[calc(100%-2rem)] rounded-[24px] border bg-background/96 shadow-lg">
      <div className="border-b p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">Paradas</p>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onSearch}>
              <MapPinPlus className="mr-2 h-4 w-4" />
              Buscar
            </Button>
            <Button type="button" size="sm" onClick={onAddStop}>
              <CopyPlus className="mr-2 h-4 w-4" />
              Añadir
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setStopsPanelExpanded(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {currentDraft.stops.length === 0 ? (
          <div className="flex h-[260px] items-center justify-center md:h-[calc(72vh-18rem)]">
            <EmptyState
              icon={<MapPinned className="h-10 w-10 text-primary" />}
              title="Sin paradas todavía"
              description="Añade una parada buscando una ubicación o pulsando directamente sobre el mapa."
              className="h-full bg-transparent"
            />
          </div>
        ) : (
          <ScrollArea className="h-[260px] pr-3 md:h-[calc(72vh-18rem)]">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={currentDraft.stops.map((stop) => stop.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {currentDraft.stops.map((stop) => (
                    <SortableStopItem key={stop.id} stop={stop} onEdit={onEditStop} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
