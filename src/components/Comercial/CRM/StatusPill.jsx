'use client';

import { cn } from '@/lib/utils';
import { getStatusTone, toneClasses } from './utils';

export default function StatusPill({ label, status, className = '' }) {
  const tone = getStatusTone(status);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        toneClasses(tone),
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', tone.includes('red') ? 'bg-red-500' : '', tone.includes('green') ? 'bg-green-500' : '', tone.includes('blue') ? 'bg-blue-500' : '', tone.includes('amber') ? 'bg-amber-500' : '', tone.includes('violet') ? 'bg-violet-500' : '', tone.includes('slate') ? 'bg-slate-500' : '')} />
      {label}
    </span>
  );
}
