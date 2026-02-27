"use client";

import React from "react";
import {
  Check,
  ChevronDown,
  Bot,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { TimelineEventDetail } from "./TimelineEventDetail";

const TYPE_BADGE_LABEL = {
  box_added: "Caja",
  box_removed: "Caja",
  box_updated: "Caja",
  state_changed: "Estado",
  state_changed_auto: "Estado auto",
  store_assigned: "Almacén",
  store_removed: "Almacén",
  position_assigned: "Posición",
  position_unassigned: "Posición",
  order_linked: "Pedido",
  order_unlinked: "Pedido",
  pallet_created: "Creación",
  pallet_created_from_reception: "Recepción",
  observations_updated: "Observaciones",
};

function getBadgeLabel(type) {
  return TYPE_BADGE_LABEL[type] ?? type;
}

/** Badge variant for the type label inside the frame (secondary/destructive) */
function getTypeBadgeVariant(type) {
  if (type === "box_removed" || type === "store_removed" || type === "order_unlinked")
    return "destructive";
  if (
    type === "box_added" ||
    type === "pallet_created" ||
    type === "pallet_created_from_reception"
  )
    return "default";
  return "secondary";
}

/** Badge de fecha/duración: verde sólido tipo "completed" (como en la imagen) */
function TimestampBadge({ dateLabel }) {
  return (
    <Badge
      className="text-xs bg-emerald-600 text-white border-0 hover:bg-emerald-600 dark:bg-emerald-600 dark:text-white"
    >
      {dateLabel}
    </Badge>
  );
}

export function TimelineEventItem({ entry, formatDateHour }) {
  const isSystem = entry.userId == null;
  const dateLabel = formatDateHour(entry.timestamp);

  return (
    <div className="relative ms-10 pb-10 last:pb-0">
      {/* Línea vertical oscura (TimelineSeparator) */}
      <div
        className="absolute -left-7 top-6 h-[calc(100%-1.5rem-0.25rem)] w-0.5 translate-y-7 bg-muted-foreground/50"
        aria-hidden
      />

      {/* Fila de cabecera: indicador (check en círculo sólido) + título + badge verde */}
      <div className="flex items-center gap-2">
        <div className="relative -left-7 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground border-0 shadow-sm">
          <Check className="size-3.5 stroke-[2.5]" />
        </div>
        <span className="text-sm font-semibold leading-tight text-foreground min-w-0 flex-1">
          {entry.action}
        </span>
        <TimestampBadge dateLabel={dateLabel} />
      </div>

      {/* Frame gris claro: Collapsible con Avatar + nombre + chevron, panel = detalle */}
      <div className="mt-2">
        <Card className="overflow-hidden rounded-lg border border-border bg-muted/30 shadow-sm">
          <Collapsible defaultOpen={false} className="group/collapsible">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex w-full flex-row items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors rounded-lg"
                aria-label="Ver detalle"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  {isSystem ? (
                    <span className="flex size-5 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <Bot className="size-3" />
                    </span>
                  ) : (
                    <Avatar className="size-5 rounded-full">
                      <AvatarFallback className="text-[10px] font-medium bg-muted text-muted-foreground">
                        {(entry.userName || "?").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <span className="text-xs font-medium text-muted-foreground truncate">
                    {entry.userName || "Sistema"}
                  </span>
                  <Badge
                    variant={getTypeBadgeVariant(entry.type)}
                    className="shrink-0 text-[10px] px-1.5 py-0"
                  >
                    {getBadgeLabel(entry.type)}
                  </Badge>
                </div>
                <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="border-t border-border bg-muted/20 pt-3 pb-3 pl-3 pr-3 text-sm leading-relaxed text-muted-foreground">
                <TimelineEventDetail entry={entry} />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      </div>
    </div>
  );
}
