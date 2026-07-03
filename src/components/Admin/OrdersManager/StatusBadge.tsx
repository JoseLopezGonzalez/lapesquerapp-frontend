'use client';

import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const colorClasses = {
  green: 'bg-green-500/15 text-green-700 dark:text-green-300',
  orange: 'bg-orange-500/15 text-orange-700 dark:text-orange-300',
  red: 'bg-red-500/15 text-red-700 dark:text-red-300',
  amber: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  emerald: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
};

const dotClasses = {
  green: 'bg-green-500',
  orange: 'bg-orange-500',
  red: 'bg-red-500',
  amber: 'bg-amber-500',
  emerald: 'bg-emerald-500',
};

interface StatusBadgeProps {
  color?: keyof typeof colorClasses;
  label?: string;
  className?: string;
  children?: ReactNode;
  showDot?: boolean;
}

const StatusBadge = ({
  color = 'green',
  label = 'Terminado',
  className,
  children,
  showDot = false,
}: StatusBadgeProps) => {
  const classes = colorClasses[color] ?? colorClasses.green;
  const dotClass = dotClasses[color] ?? dotClasses.green;

  return (
    <Badge className={cn(classes, className)}>
      {showDot && <span className={cn('h-1.5 w-1.5 rounded-full', dotClass)} />}
      {children ?? label}
    </Badge>
  );
};

export default StatusBadge;
