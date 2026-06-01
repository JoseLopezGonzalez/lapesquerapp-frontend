'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Empty state reutilizable para el panel superadmin.
 * Uso en tabla: <TableRow><TableCell colSpan={n} className="p-0"><EmptyState ... /></TableCell></TableRow>
 * Uso en card: <EmptyState ... /> dentro de un contenedor con padding.
 */
export default function EmptyState({ icon: Icon, title, description, compact = false, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'px-4 py-8' : 'px-4 py-10',
        className
      )}
    >
      {Icon && (
        <div className="bg-muted/60 mb-3 rounded-full p-3">
          <Icon className="text-muted-foreground h-8 w-8" aria-hidden />
        </div>
      )}
      <p className="text-foreground font-medium">{title}</p>
      {description && <p className="text-muted-foreground mt-1 max-w-sm text-sm">{description}</p>}
    </div>
  );
}
