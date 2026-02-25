"use client";

import React from "react";
import {
  Box,
  Package,
  RefreshCw,
  Warehouse,
  MapPin,
  Link2,
  PlusCircle,
  FileText,
  Circle,
  ChevronRight,
  Bot,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TimelineEventDetail } from "./TimelineEventDetail";
import { cn } from "@/lib/utils";

const TYPE_ICON = {
  box_added: Package,
  box_removed: Package,
  box_updated: Box,
  state_changed: RefreshCw,
  state_changed_auto: RefreshCw,
  store_assigned: Warehouse,
  store_removed: Warehouse,
  position_assigned: MapPin,
  position_unassigned: MapPin,
  order_linked: Link2,
  order_unlinked: Link2,
  pallet_created: PlusCircle,
  pallet_created_from_reception: PlusCircle,
  observations_updated: FileText,
};

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

function getIcon(type) {
  return TYPE_ICON[type] ?? Circle;
}

function getBadgeLabel(type) {
  return TYPE_BADGE_LABEL[type] ?? type;
}

function getBadgeVariant(type) {
  if (type === "box_removed") return "destructive";
  if (type === "box_added" || type === "pallet_created" || type === "pallet_created_from_reception") return "default";
  if (type === "store_removed" || type === "order_unlinked") return "destructive";
  return "secondary";
}

export function TimelineEventItem({ entry, formatDateHour }) {
  const Icon = getIcon(entry.type);
  const isSystem = entry.userId == null;

  return (
    <div className="relative flex gap-4 pb-6 last:pb-0">
      {/* Vertical line */}
      <div className="absolute left-[11px] top-6 bottom-0 w-px bg-border" aria-hidden />

      {/* Indicator */}
      <div
        className={cn(
          "relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-background bg-muted text-muted-foreground shadow-sm",
          (entry.type === "box_added" || entry.type === "pallet_created") && "bg-primary/10 text-primary border-primary/30",
          entry.type === "box_removed" && "bg-destructive/10 text-destructive border-destructive/30"
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 pt-0.5">
        <Collapsible defaultOpen={false} className="group/collapsible">
          <div className="flex items-start gap-2">
            <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1">
              <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                {formatDateHour(entry.timestamp)}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                {isSystem ? (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                    <Bot className="h-3 w-3 text-muted-foreground" />
                  </span>
                ) : (
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {(entry.userName || "?").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                <span className="text-xs font-medium text-muted-foreground">
                  {entry.userName || "Sistema"}
                </span>
              </div>
              <Badge variant={getBadgeVariant(entry.type)} className="text-xs shrink-0">
                {getBadgeLabel(entry.type)}
              </Badge>
            </div>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-[transform] duration-200 group-data-[state=open]/collapsible:rotate-90"
                aria-label="Ver detalle"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </CollapsibleTrigger>
          </div>
          <p className="text-sm font-medium mt-1 pr-8">{entry.action}</p>
          <CollapsibleContent>
            <div className="mt-2">
              <TimelineEventDetail entry={entry} />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
