'use client';

import React from 'react';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  compact?: boolean;
  className?: string;
}

export default function EmptyState({ icon: Icon, title, description, compact = false, className }: EmptyStateProps) {
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
