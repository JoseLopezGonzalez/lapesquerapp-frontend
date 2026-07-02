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

interface StatusBadgeProps {
  color?: keyof typeof colorClasses;
  label?: string;
  className?: string;
  children?: ReactNode;
}

const StatusBadge = ({
  color = 'green',
  label = 'Terminado',
  className,
  children,
}: StatusBadgeProps) => {
  const classes = colorClasses[color] ?? colorClasses.green;

  return <Badge className={cn(classes, className)}>{children ?? label}</Badge>;
};

export default StatusBadge;
