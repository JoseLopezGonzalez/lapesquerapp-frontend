"use client";

import React from "react";
import { CloudAlert } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Loader from "@/components/Utilities/Loader";
import { EmptyState } from "@/components/Utilities/EmptyState";
import { TimelineEventItem } from "./TimelineEventItem";
import { formatDateHourShort } from "@/helpers/formats/dates/formatDates";

export function PalletTimeline({
  timeline = [],
  loading,
  error,
  openStates,
  onItemOpenChange,
}) {

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-4">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <CloudAlert className="h-4 w-4" />
        <AlertDescription>
          {error.message || "No se pudo cargar el historial."}
        </AlertDescription>
      </Alert>
    );
  }

  if (!timeline || timeline.length === 0) {
    return (
      <EmptyState
        title="Sin historial"
        description="Este palet aún no tiene eventos registrados."
      />
    );
  }

  return (
    <div className="relative w-full pl-1 space-y-3">
      {timeline.map((entry, index) => (
        <TimelineEventItem
          key={`${entry.timestamp}-${index}`}
          entry={entry}
          formatDateLabel={formatDateHourShort}
          isLast={index === timeline.length - 1}
          open={openStates ? openStates[index] ?? true : undefined}
          onOpenChange={
            onItemOpenChange
              ? (open) => onItemOpenChange(index, open)
              : undefined
          }
        />
      ))}
    </div>
  );
}
