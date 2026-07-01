'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const colorClasses = {
  green: 'bg-green-500/15 text-green-700 dark:text-green-300',
  orange: 'bg-orange-500/15 text-orange-700 dark:text-orange-300',
  red: 'bg-red-500/15 text-red-700 dark:text-red-300',
};

interface StatusBadgeProps {
  color?: 'green' | 'orange' | 'red';
  label?: string;
  className?: string;
}

const StatusBadge = ({ color = 'green', label = 'Terminado', className }: StatusBadgeProps) => {
  const classes = colorClasses[color] ?? colorClasses.green;

  return <Badge className={cn(classes, className)}>{label}</Badge>;
};

export default StatusBadge;
