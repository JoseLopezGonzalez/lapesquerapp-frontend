"use client";

import React from "react";
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
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { TimelineEventDetail } from "./TimelineEventDetail";

/** Icono del timeline según el tipo de evento */
function getTimelineIcon(type) {
  switch (type) {
    case "pallet_updated":
      return Pencil;
    case "pallet_created":
    case "pallet_created_from_reception":
      return Layers;
    case "order_linked":
      return Link;
    case "order_unlinked":
      return Unlink;
    case "state_changed":
    case "state_changed_auto":
      return ArrowRightLeft;
    case "store_assigned":
      return Store;
    case "store_removed":
      return Store; // mismo icono, el detalle indica "retirado"
    case "position_assigned":
      return MapPin;
    case "position_unassigned":
      return MapPinOff;
    case "box_added":
      return PackagePlus;
    case "box_removed":
      return PackageMinus;
    case "box_updated":
      return RefreshCw;
    case "observations_updated":
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
    <div className="flex gap-2 items-stretch">
      {/* Columna pista: sin pb para que al estirarse la línea llegue hasta el siguiente icono */}
      <div className="flex flex-col items-center shrink-0 w-6 self-stretch">
        <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground border-0 shadow-sm">
          <EventIcon className="size-3.5 stroke-[2.5]" />
        </div>
        {!isLast && (
          <div
            className="w-0.5 flex-1 min-h-0 mt-1 bg-muted-foreground/50"
            aria-hidden
          />
        )}
      </div>

      {/* Columna contenido: el padding inferior define la separación entre eventos */}
      <div className={`flex-1 min-w-0 ${!isLast ? "pb-4" : ""}`}>
        {/* Fecha encima del título (estilo imagen) */}
        <div className="flex flex-col gap-0.5">
          <p className="text-xs text-muted-foreground font-normal">
            {dateLabel}
          </p>
          <span className="text-sm font-semibold leading-tight text-foreground truncate block">
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
                  className="flex w-full flex-row items-center justify-between gap-2 px-3 py-2 text-left hover:bg-muted/50 transition-colors rounded-t-xl [&[data-state=open]]:rounded-b-none"
                  aria-label="Ver detalle"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    {isSystem ? (
                      <span className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <Bot className="size-3.5" />
                      </span>
                    ) : (
                      <Avatar className="size-7">
                        <AvatarFallback className="text-[10px] font-medium">
                          {(entry.userName || "?").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <span className="text-sm font-medium text-muted-foreground truncate">
                      {entry.userName || "Sistema"}
                    </span>
                  </div>
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border-t border-border p-4 pt-3 text-sm text-muted-foreground">
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
