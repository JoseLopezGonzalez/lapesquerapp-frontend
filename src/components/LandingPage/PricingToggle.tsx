'use client';
// Necesita 'use client': estado local del periodo mensual/anual (solo UI, sin cifras reales
// que dependan de él todavía — ver landing-proposal.md §9, "alcance reducido de pricing").

import { createContext, useContext, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Period = 'monthly' | 'annual';

const PricingPeriodContext = createContext<Period>('monthly');

interface PricingToggleProps {
  monthlyLabel: string;
  annualLabel: string;
  children: ReactNode;
}

// Envuelve las tarjetas de nivel (Server Components) y provee el periodo seleccionado vía
// Context — válido en App Router: un Client Component puede envolver children server-renderizados
// y seguir propagando Context a otros Client Components anidados dentro de ellos (PricingPeriodLabel).
export default function PricingToggle({ monthlyLabel, annualLabel, children }: PricingToggleProps) {
  const [period, setPeriod] = useState<Period>('monthly');

  return (
    <PricingPeriodContext.Provider value={period}>
      <div className="flex justify-center">
        <div className="border-border bg-muted inline-flex items-center gap-1 rounded-full border p-1">
          <button
            type="button"
            onClick={() => setPeriod('monthly')}
            aria-pressed={period === 'monthly'}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              period === 'monthly'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground'
            )}
          >
            {monthlyLabel}
          </button>
          <button
            type="button"
            onClick={() => setPeriod('annual')}
            aria-pressed={period === 'annual'}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              period === 'annual'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground'
            )}
          >
            {annualLabel}
          </button>
        </div>
      </div>
      {children}
    </PricingPeriodContext.Provider>
  );
}

export function PricingPeriodLabel({
  monthlyLabel,
  annualLabel,
}: {
  monthlyLabel: string;
  annualLabel: string;
}) {
  const period = useContext(PricingPeriodContext);
  return <span>{period === 'monthly' ? monthlyLabel : annualLabel}</span>;
}
