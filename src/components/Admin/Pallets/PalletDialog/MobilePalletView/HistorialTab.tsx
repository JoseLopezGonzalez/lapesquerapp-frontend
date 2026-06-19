'use client';

import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { PalletTimeline } from '../PalletView/PalletTimeline';
import type { PalletTimelineEntry } from '@/services/palletService';
import { MobilePalletScreenHeader } from './MobilePalletScreenHeader';

interface HistorialTabProps {
  timeline: PalletTimelineEntry[] | null | undefined;
  timelineLoading: boolean;
  onBack?: () => void;
}

export default function HistorialTab({ timeline, timelineLoading, onBack }: HistorialTabProps) {
  const [openStates, setOpenStates] = useState<boolean[]>([]);

  const handleItemOpenChange = (index: number, open: boolean) => {
    setOpenStates((prev) => {
      const next = [...prev];
      next[index] = open;
      return next;
    });
  };

  return (
    <div className="flex h-full flex-col">
      {onBack && <MobilePalletScreenHeader title="Historial" onBack={onBack} />}
      <div className="min-h-0 flex-1 overflow-auto px-3 py-3 pb-4">
        {timelineLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !timeline || timeline.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No hay entradas en el historial.
          </p>
        ) : (
          <PalletTimeline
            timeline={(timeline ?? []) as never[]}
            loading={false}
            error={null}
            openStates={openStates}
            onItemOpenChange={handleItemOpenChange}
          />
        )}
      </div>
    </div>
  );
}
