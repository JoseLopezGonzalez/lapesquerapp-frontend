"use client";

import React from "react";
import { Loader2, CloudAlert } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EmptyState } from "@/components/Utilities/EmptyState";
import { TimelineEventItem } from "./TimelineEventItem";
import { formatDateHour } from "@/helpers/formats/dates/formatDates";

export function PalletTimeline({ timeline = [], loading, error }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
    <div className="relative w-full max-w-lg">
      {timeline.map((entry, index) => (
        <TimelineEventItem
          key={`${entry.timestamp}-${index}`}
          entry={entry}
          formatDateHour={formatDateHour}
        />
      ))}
    </div>
  );
}
