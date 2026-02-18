'use client';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function Step5Observations({ state, setObservations }) {
  const value = state.observations ?? '';
  const maxLength = 1000;

  return (
    <div className="space-y-2">
      <Label htmlFor="observations">Observaciones</Label>
      <Textarea
        id="observations"
        value={value}
        onChange={(e) => setObservations(e.target.value.slice(0, maxLength))}
        placeholder="Introduce alguna observación..."
        maxLength={maxLength}
        rows={4}
        className="resize-none"
      />
      <p className="text-xs text-muted-foreground">
        {value.length}/{maxLength}
      </p>
    </div>
  );
}
