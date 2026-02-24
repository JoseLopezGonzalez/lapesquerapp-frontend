"use client";

import React from "react";
import { cn } from "@/lib/utils";

/**
 * Empty state reutilizable para el panel superadmin.
 * Uso en tabla: <TableRow><TableCell colSpan={n} className="p-0"><EmptyState ... /></TableCell></TableRow>
 * Uso en card: <EmptyState ... /> dentro de un contenedor con padding.
 */
export default function EmptyState({ icon: Icon, title, description, compact = false, className }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-8 px-4" : "py-10 px-4",
        className
      )}
    >
      {Icon && (
        <div className="rounded-full bg-muted/60 p-3 mb-3">
          <Icon className="h-8 w-8 text-muted-foreground" aria-hidden />
        </div>
      )}
      <p className="font-medium text-foreground">{title}</p>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">{description}</p>
      )}
    </div>
  );
}
