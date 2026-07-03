'use client';

import { formatDateShort } from '@/helpers/formats/dates/formatDates';
import {
  formatDecimalCurrency,
  formatDecimalWeight,
} from '@/helpers/formats/numbers/formatNumbers';

export default function ChartTooltip({ active, payload, isCurrency }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-popover rounded-lg border p-3 shadow">
      {payload.map((data, index) => (
        <div key={index}>
          <p className="text-foreground text-sm">
            {formatDateShort(data.payload.load_date || data.payload.month)}
          </p>
          <p className="text-sm font-medium" style={{ color: data.color }}>
            {isCurrency
              ? `${formatDecimalCurrency(data.value)}/kg`
              : formatDecimalWeight(data.value)}
          </p>
        </div>
      ))}
    </div>
  );
}
