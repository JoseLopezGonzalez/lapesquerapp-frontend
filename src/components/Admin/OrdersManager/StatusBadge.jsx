'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Badge reutilizable para estados de pedido (Terminado, En producción, Incidencia).
 * Usa el Badge nativo de shadcn con colores por estado (doc: BadgeCustomColors).
 */
const colorClasses = {
  green: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
  orange: 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  red: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
};

const StatusBadge = ({ color = 'green', label = 'Terminado', className }) => {
  const classes = colorClasses[color] ?? colorClasses.green;

  return (
    <Badge className={cn(classes, className)}>
      {label}
    </Badge>
  );
};

export default StatusBadge;
