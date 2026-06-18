'use client';

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PalletTimeline } from '../PalletView/PalletTimeline';
import type { PalletTimelineEntry } from '@/services/palletService';

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
      {onBack && (
        <div className="flex shrink-0 items-center gap-2 border-b px-3 py-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-base font-semibold">Historial</h2>
        </div>
      )}
      <div className="overflow-auto px-3 py-3 pb-4">
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
