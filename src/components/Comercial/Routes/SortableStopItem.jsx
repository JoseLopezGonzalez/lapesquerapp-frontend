'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge } from '@/components/ui/badge';
import { GripVertical } from 'lucide-react';
import { getStopTypeLabel, getTargetTypeLabel } from '@/lib/routes/routesPlannerUtils';

export function SortableStopItem({ stop, onEdit }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: stop.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-background rounded-xl border p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <button
          type="button"
          className="text-muted-foreground mt-1 rounded-md border p-1"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => onEdit(stop)} className="min-w-0 flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">#{stop.position}</span>
            <Badge variant="outline">{getStopTypeLabel(stop.stopType)}</Badge>
            <Badge variant="secondary">{getTargetTypeLabel(stop.targetType)}</Badge>
          </div>
          <p className="mt-2 font-medium">{stop.label || 'Parada sin título'}</p>
          <p className="text-muted-foreground truncate text-sm">
            {stop.address || 'Sin dirección'}
          </p>
        </button>
      </div>
    </div>
  );
}
