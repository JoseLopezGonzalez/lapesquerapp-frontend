'use client';

import { type ChangeEvent } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PalletIllustration } from './PalletIllustration';
import type { PalletState } from '@/hooks/pallets/palletHelpers';

interface TaraScreenProps {
  temporalPallet: PalletState;
  onEditPalletTareWeightKg: (value: string) => void;
  onBack: () => void;
  isReadOnly: boolean;
}

export default function TaraScreen({
  temporalPallet,
  onEditPalletTareWeightKg,
  onBack,
  isReadOnly,
}: TaraScreenProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-2 border-b px-3 py-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-base font-semibold">Tara del palet</h2>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-6">
        {/* Illustration */}
        <div className="w-full max-w-[260px]">
          <PalletIllustration className="w-full text-foreground drop-shadow-sm" />
        </div>

        {/* Input area */}
        <div className="w-full max-w-xs space-y-3">
          <p className="text-center text-sm text-muted-foreground">
            Peso del palet de madera vacío
          </p>

          <div className="relative flex items-center">
            <Input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              defaultValue={temporalPallet.palletTareWeightKg ?? ''}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                onEditPalletTareWeightKg(e.target.value)
              }
              className="h-16 pr-14 text-right text-3xl font-semibold tabular-nums"
              placeholder="0.00"
              disabled={isReadOnly}
            />
            <span className="pointer-events-none absolute right-4 text-lg font-medium text-muted-foreground">
              kg
            </span>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            No modifica el peso neto de las cajas
          </p>
        </div>
      </div>
    </div>
  );
}
