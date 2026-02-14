'use client';

import { formatDateShort } from '@/helpers/formats/dates/formatDates';
import { formatDecimalCurrency, formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';

export default function ChartTooltip({ active, payload, isCurrency }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-popover border p-3 rounded-lg shadow">
      {payload.map((data, index) => (
        <div key={index}>
          <p className="text-sm text-foreground">
            {formatDateShort(data.payload.load_date || data.payload.month)}
          </p>
          <p className="text-sm font-semibold" style={{ color: data.color }}>
            {isCurrency
              ? `${formatDecimalCurrency(data.value)}/kg`
              : formatDecimalWeight(data.value)}
          </p>
        </div>
      ))}
    </div>
  );
}
