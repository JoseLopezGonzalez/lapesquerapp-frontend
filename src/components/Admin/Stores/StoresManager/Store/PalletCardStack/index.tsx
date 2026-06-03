'use client';

import { cn } from '@/lib/utils';

interface PalletCardStackProps {
  children: React.ReactNode[];
  label?: string;
  className?: string;
}

export function PalletCardStack({ children, label, className }: PalletCardStackProps) {
  if (!children.length) return null;

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {label && (
        <span className="text-muted-foreground px-4 text-xs font-medium tracking-wider uppercase">
          {label}
        </span>
      )}
      {children.map((child, i) => (
        <div key={i}>{child}</div>
      ))}
    </div>
  );
}
