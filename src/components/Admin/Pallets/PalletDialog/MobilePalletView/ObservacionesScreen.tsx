'use client';

import { type ChangeEvent, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { PalletState } from '@/hooks/pallets/palletHelpers';

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
      {/* Header */}
      <div className="flex shrink-0 items-center gap-2 border-b px-3 py-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-base font-semibold">Observaciones</h2>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 px-4 py-4">
        <Textarea
          value={value}
          onChange={handleChange}
          className="flex-1 resize-none text-sm"
          placeholder="Anotaciones sobre este palet..."
          maxLength={MAX_LENGTH}
          disabled={isReadOnly}
          autoFocus={!isReadOnly}
        />
        <p className="text-right text-xs text-muted-foreground">
          {value.length} / {MAX_LENGTH}
        </p>
      </div>
    </div>
  );
}
