'use client';

import { type ChangeEvent, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { PalletState } from '@/hooks/pallets/palletHelpers';
import { MobilePalletScreenHeader } from './MobilePalletScreenHeader';

const MAX_LENGTH = 500;
const WARN_AT = MAX_LENGTH - 50;
const DANGER_AT = MAX_LENGTH - 10;

interface ObservacionesScreenProps {
  temporalPallet: PalletState;
  onEditObservations: (obs: string) => void;
  onBack: () => void;
  isReadOnly: boolean;
}

export default function ObservacionesScreen({
  temporalPallet,
  onEditObservations,
  onBack,
  isReadOnly,
}: ObservacionesScreenProps) {
  const [value, setValue] = useState(temporalPallet.observations ?? '');

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    onEditObservations(e.target.value);
  };

  const remaining = MAX_LENGTH - value.length;

  return (
    <div className="flex h-full flex-col">
      <MobilePalletScreenHeader title="Observaciones" onBack={onBack} />

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 px-4 py-4">
        <Textarea
          value={value}
          onChange={handleChange}
          className="flex-1 resize-none text-sm"
          placeholder="Anotaciones sobre este palet..."
          maxLength={MAX_LENGTH}
          disabled={isReadOnly}
        />
        <p
          className={cn(
            'text-right text-xs transition-colors',
            value.length >= DANGER_AT
              ? 'font-medium text-destructive'
              : value.length >= WARN_AT
                ? 'text-amber-500'
                : 'text-muted-foreground'
          )}
        >
          {remaining} {remaining === 1 ? 'carácter' : 'caracteres'} restantes
        </p>
      </div>
    </div>
  );
}
