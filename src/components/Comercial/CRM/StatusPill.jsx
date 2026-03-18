'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getStatusTone, toneClasses } from './utils';

export default function StatusPill({ label, status, className = '' }) {
  const tone = getStatusTone(status);

  return (
    <Badge className={cn(toneClasses(tone), className)}>{label}</Badge>
  );
}
