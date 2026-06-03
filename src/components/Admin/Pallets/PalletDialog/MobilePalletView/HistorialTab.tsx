'use client';

import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { PalletTimeline } from '../PalletView/PalletTimeline';
import type { PalletTimelineEntry } from '@/services/palletService';

interface HistorialTabProps {
  timeline: PalletTimelineEntry[] | null | undefined;
  timelineLoading: boolean;
}

export default function HistorialTab({ timeline, timelineLoading }: HistorialTabProps) {
  const [openStates, setOpenStates] = useState<boolean[]>([]);

  const handleItemOpenChange = (index: number, open: boolean) => {
    setOpenStates((prev) => {
      const next = [...prev];
      next[index] = open;
      return next;
    });
  };

  if (timelineLoading) {
    return (
      <div className="space-y-2 pb-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!timeline || timeline.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No hay entradas en el historial.
      </p>
    );
  }

  return (
    <div className="pb-4">
      <PalletTimeline
        timeline={(timeline ?? []) as never[]}
        loading={false}
        error={null}
        openStates={openStates}
        onItemOpenChange={handleItemOpenChange}
      />
    </div>
  );
}
