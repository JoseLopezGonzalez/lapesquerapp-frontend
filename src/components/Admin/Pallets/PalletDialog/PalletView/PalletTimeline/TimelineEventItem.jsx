'use client';

import React from 'react';
import {
  ChevronDown,
  Bot,
  Pencil,
  PackagePlus,
  Link,
  Unlink,
  ArrowRightLeft,
  Store,
  MapPin,
  MapPinOff,
  RefreshCw,
  FileText,
  PackageMinus,
  Layers,
  CircleDot,
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { TimelineEventDetail } from './TimelineEventDetail';

/** Icono del timeline según el tipo de evento */
function getTimelineIcon(type) {
  switch (type) {
    case 'pallet_updated':
      return Pencil;
    case 'pallet_created':
    case 'pallet_created_from_reception':
      return Layers;
    case 'order_linked':
      return Link;
    case 'order_unlinked':
      return Unlink;
    case 'state_changed':
    case 'state_changed_auto':
      return ArrowRightLeft;
    case 'store_assigned':
      return Store;
    case 'store_removed':
      return Store; // mismo icono, el detalle indica "retirado"
    case 'position_assigned':
      return MapPin;
    case 'position_unassigned':
      return MapPinOff;
    case 'box_added':
      return PackagePlus;
    case 'box_removed':
      return PackageMinus;
    case 'box_updated':
      return RefreshCw;
    case 'observations_updated':
      return FileText;
    default:
      return CircleDot;
  }
}

export function TimelineEventItem({ entry, formatDateLabel, isLast, open = true, onOpenChange }) {
  const isSystem = entry.userId == null;
  const dateLabel = formatDateLabel(entry.timestamp);
  const EventIcon = getTimelineIcon(entry.type);

  return (
    <div className="flex items-stretch gap-2">
      {/* Columna pista: sin pb para que al estirarse la línea llegue hasta el siguiente icono */}
      <div className="flex w-6 shrink-0 flex-col items-center self-stretch">
        <div className="bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-full border-0 shadow-sm">
          <EventIcon className="size-3.5 stroke-[2.5]" />
        </div>
        {!isLast && (
          <div className="bg-muted-foreground/50 mt-1 min-h-0 w-0.5 flex-1" aria-hidden />
        )}
      </div>

      {/* Columna contenido: el padding inferior define la separación entre eventos */}
      <div className={`min-w-0 flex-1 ${!isLast ? 'pb-4' : ''}`}>
        {/* Fecha encima del título (estilo imagen) */}
        <div className="flex flex-col gap-0.5">
          <p className="text-muted-foreground text-xs font-normal">{dateLabel}</p>
          <span className="text-foreground block truncate text-sm leading-tight font-semibold">
            {entry.action}
          </span>
        </div>

        {/* Card collapsible */}
        <div className="mt-2">
          <Card>
            <Collapsible
              {...(onOpenChange != null ? { open, onOpenChange } : { defaultOpen: true })}
              className="group/collapsible"
            >
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="hover:bg-muted/50 flex w-full flex-row items-center justify-between gap-2 rounded-t-xl px-3 py-2 text-left transition-colors [&[data-state=open]]:rounded-b-none"
                  aria-label="Ver detalle"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    {isSystem ? (
                      <span className="bg-muted text-muted-foreground flex size-7 items-center justify-center rounded-full">
                        <Bot className="size-3.5" />
                      </span>
                    ) : (
                      <Avatar className="size-7">
                        <AvatarFallback className="text-[10px] font-medium">
                          {(entry.userName || '?').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <span className="text-muted-foreground truncate text-sm font-medium">
                      {entry.userName || 'Sistema'}
                    </span>
                  </div>
                  <ChevronDown className="text-muted-foreground size-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border-border text-muted-foreground border-t p-4 pt-3 text-sm">
                  <TimelineEventDetail entry={entry} />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        </div>
      </div>
    </div>
  );
}
