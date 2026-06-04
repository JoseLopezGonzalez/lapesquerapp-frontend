'use client';

import * as React from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePrintElement } from '@/hooks/usePrintElement';
import { cn } from '@/lib/utils';

const LABEL_GROUPS = [
  [
    { main: '+1', modifier: "'5" },
    { main: '+1', modifier: "'35" },
    { main: '+2' },
    { main: '+3' },
  ],
  [
    { main: '-1', modifier: "'5" },
    { main: '-1', modifier: "'35" },
    { main: '-1' },
    { main: '+1' },
  ],
  [
    { main: 'R' },
    { main: 'TR' },
    { main: 'TR', modifier: '+' },
    { main: 'TR', modifier: '-' },
  ],
  [
    { main: 'T2' },
    { main: 'T3' },
    { main: 'T4', modifier: '-' },
    { main: 'T4', modifier: '+' },
  ],
  [
    { main: 'T5' },
    { main: 'T6' },
    { main: 'T7' },
    { main: 'T7', modifier: '-' },
  ],
];

const PRINT_AREA_ID = 'numeric-label-print-area';
const PRINT_WIDTH_MM = 80;
const PRINT_HEIGHT_MM = 50;

function getLabelKey(label) {
  return label.modifier ? `${label.main}${label.modifier}` : label.main;
}

function LabelMark({ label, preview = false }) {
  return (
    <span
      className={cn(
        'relative inline-flex items-start justify-center font-black leading-none text-black',
        preview ? 'min-w-[4.5rem]' : 'min-w-[48mm]'
      )}
    >
      <span className={cn(label.modifier && (preview ? 'pr-7' : 'pr-[14mm]'))}>{label.main}</span>
      {label.modifier ? (
        <span
          className={cn(
            'absolute top-0 right-0 font-black leading-none',
            preview ? 'text-3xl' : 'text-[18mm]'
          )}
        >
          {label.modifier}
        </span>
      ) : null}
    </span>
  );
}

function LabelButton({ label, onPrint }) {
  return (
    <button
      type="button"
      onClick={() => onPrint(label)}
      className={cn(
        'flex h-24 w-full items-center justify-center rounded-lg border border-neutral-300 bg-white px-3 text-black shadow-sm',
        'transition-colors hover:bg-neutral-100 active:bg-neutral-200',
        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-amber-100 focus-visible:outline-none',
        'sm:h-28 lg:h-32'
      )}
      aria-label={`Imprimir etiqueta ${getLabelKey(label)}`}
    >
      <span className="text-5xl font-black leading-none sm:text-6xl lg:text-7xl">
        <LabelMark label={label} preview />
      </span>
    </button>
  );
}

function LabelStrip({ labels, groupIndex, onPrint }) {
  return (
    <section
      className="rounded-2xl bg-neutral-800 p-2 shadow-lg"
      aria-label={`Grupo de etiquetas ${groupIndex + 1}`}
    >
      <div className="flex min-h-full flex-col gap-3 rounded-xl bg-amber-100 px-3 py-4">
        <div className="h-12 rounded-b-xl border border-t-0 border-neutral-200 bg-white shadow-sm" />
        <div className="flex flex-1 flex-col gap-3">
          {labels.map((label) => (
            <LabelButton key={getLabelKey(label)} label={label} onPrint={onPrint} />
          ))}
        </div>
        <div className="h-12 rounded-t-xl border border-b-0 border-neutral-200 bg-white shadow-sm" />
      </div>
    </section>
  );
}

function QuantitySelector({ quantity, onDecrease, onIncrease }) {
  return (
    <div className="mx-auto flex w-44 items-center justify-center overflow-hidden rounded-lg border border-neutral-700 bg-neutral-900 shadow-lg">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onDecrease}
        disabled={quantity <= 1}
        className="h-12 rounded-none text-white hover:bg-neutral-800 hover:text-white disabled:opacity-40"
        aria-label="Restar copia"
      >
        <Minus />
      </Button>
      <div
        className="flex h-12 min-w-16 items-center justify-center border-x border-neutral-700 bg-white px-4 text-2xl font-bold text-black"
        aria-live="polite"
      >
        {quantity}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onIncrease}
        className="h-12 rounded-none text-white hover:bg-neutral-800 hover:text-white"
        aria-label="Sumar copia"
      >
        <Plus />
      </Button>
    </div>
  );
}

function PrintableLabels({ selectedLabel, quantity }) {
  const copies = selectedLabel ? Array.from({ length: quantity }, (_, index) => index) : [];

  return (
    <div id={PRINT_AREA_ID} className="hidden print:block">
      {copies.map((copy) => (
        <div
          key={copy}
          className="page flex items-center justify-center bg-white"
          style={{ width: `${PRINT_WIDTH_MM}mm`, height: `${PRINT_HEIGHT_MM}mm` }}
        >
          <div className="flex h-[44mm] w-[74mm] items-center justify-center rounded-[4mm] border-[0.6mm] border-black bg-white text-black">
            <span
              className={cn(
                'font-black leading-none',
                selectedLabel.modifier ? 'text-[30mm]' : 'text-[36mm]'
              )}
            >
              <LabelMark label={selectedLabel} />
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function NumericProductionLabels() {
  const [quantity, setQuantity] = React.useState(1);
  const [selectedLabel, setSelectedLabel] = React.useState(null);
  const { onPrint } = usePrintElement({
    id: PRINT_AREA_ID,
    width: PRINT_WIDTH_MM,
    height: PRINT_HEIGHT_MM,
  });

  const handlePrintLabel = React.useCallback(
    (label) => {
      setSelectedLabel(label);

      window.setTimeout(() => {
        onPrint();
        setQuantity(1);
      }, 0);
    },
    [onPrint]
  );

  return (
    <main className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl bg-neutral-950">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-full max-w-7xl flex-col justify-center gap-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {LABEL_GROUPS.map((group, index) => (
              <LabelStrip
                key={index}
                labels={group}
                groupIndex={index}
                onPrint={handlePrintLabel}
              />
            ))}
          </div>

          <QuantitySelector
            quantity={quantity}
            onDecrease={() => setQuantity((current) => Math.max(1, current - 1))}
            onIncrease={() => setQuantity((current) => current + 1)}
          />
        </div>
      </div>

      <PrintableLabels selectedLabel={selectedLabel} quantity={quantity} />
    </main>
  );
}
