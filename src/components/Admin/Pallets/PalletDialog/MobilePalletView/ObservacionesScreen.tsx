'use client';

import { type ChangeEvent, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import type { PalletState } from '@/hooks/pallets/palletHelpers';
import { MobilePalletScreenHeader } from './MobilePalletScreenHeader';

const MAX_LENGTH = 500;

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
        <p className="text-right text-xs text-muted-foreground">
          {value.length} / {MAX_LENGTH}
        </p>
      </div>
    </div>
  );
}
