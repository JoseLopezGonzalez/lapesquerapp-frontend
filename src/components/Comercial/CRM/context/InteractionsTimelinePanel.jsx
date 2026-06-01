'use client';

import { CalendarClock, CircleDot, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { EmptyState } from '@/components/Utilities/EmptyState';
import Loader from '@/components/Utilities/Loader';
import StatusPill from '../StatusPill';
import {
  formatDateTimeValue,
  formatDateValue,
  interactionResultLabels,
  interactionTypeLabels,
} from '../utils';

const interactionTypeIcons = {
  call: Phone,
  email: Mail,
  whatsapp: MessageCircle,
  visit: MapPin,
  other: CircleDot,
};

export default function InteractionsTimelinePanel({
  interactions = [],
  isLoading = false,
  emptyTitle = 'Sin interacciones',
  emptyDescription = 'Registra seguimiento para alimentar la agenda comercial.',
}) {
  if (isLoading) {
    return (
      <div className="flex min-h-[220px] items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!interactions.length) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        className="bg-muted/20 h-full !min-h-[220px] w-full border"
      />
    );
  }

  const sortedInteractions = interactions
    .slice()
    .sort((a, b) => (a.occurredAt && b.occurredAt ? b.occurredAt.localeCompare(a.occurredAt) : 0));

  return (
    <div className="relative w-full space-y-4 py-2 pl-1">
      {sortedInteractions.map((interaction, index, array) => {
        const isLast = index === array.length - 1;
        const typeLabel = interactionTypeLabels[interaction.type] ?? interaction.type;
        const resultLabel = interactionResultLabels[interaction.result] ?? interaction.result;
        const TypeIcon = interactionTypeIcons[interaction.type] ?? CircleDot;

        return (
          <div key={interaction.id} className="flex items-stretch gap-2">
            <div className="flex w-6 shrink-0 flex-col items-center self-stretch">
              <div className="bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-full border-0 shadow-sm">
                <TypeIcon className="size-3 stroke-[2]" />
              </div>
              {!isLast && (
                <div className="bg-muted-foreground/50 mt-1 min-h-0 w-0.5 flex-1" aria-hidden />
              )}
            </div>

            <div className={`min-w-0 flex-1 ${!isLast ? 'pb-4' : ''}`}>
              <div className="flex flex-col gap-0.5">
                <p className="text-muted-foreground text-xs font-normal">
                  {formatDateTimeValue(interaction.occurredAt)}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-foreground truncate text-sm leading-tight font-semibold">
                    {typeLabel}
                  </span>
                  <StatusPill label={resultLabel} status={interaction.result} />
                </div>
              </div>

              <div className="bg-card mt-2 space-y-3 rounded-xl border p-3">
                <p className="text-foreground text-sm leading-snug break-words whitespace-pre-wrap">
                  {interaction.summary}
                </p>

                {interaction.nextActionAt && (
                  <div className="border-border/60 space-y-1 border-t pt-2">
                    <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                      <CalendarClock className="size-3 shrink-0" />
                      <span>Próxima acción: {formatDateValue(interaction.nextActionAt)}</span>
                    </p>
                    {interaction.nextActionNote && (
                      <p className="text-muted-foreground pl-4 text-xs break-words whitespace-pre-wrap">
                        {interaction.nextActionNote}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
