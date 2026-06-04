'use client';

import * as React from 'react';
import { Minus, Plus } from 'lucide-react';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
} from '@/components/ui/input-group';
import { usePrintElement } from '@/hooks/usePrintElement';
import { cn } from '@/lib/utils';

const COLS = 5;
const ROWS = 4;

/** Sin T primero, luego serie T; reparto en 5×4 para lectura horizontal por filas */
const LABELS_ORDERED = [
  { main: '+1', modifier: "'5" },
  { main: '+2' },
  { main: '+3' },
  { main: '+1' },
  { main: '-1', modifier: ',5' },
  { main: '-1' },
  { main: 'R' },
  { main: 'T1' },
  { main: 'T2' },
  { main: 'T3' },
  { main: 'T4' },
  { main: 'T4', modifier: '+' },
  { main: 'T4', modifier: '-' },
  { main: 'T5' },
  { main: 'T6' },
  { main: 'T7' },
  { main: 'T7', modifier: '-' },
  { main: 'TR' },
  { main: 'TR', modifier: '+' },
  { main: 'TR', modifier: '-' },
];

const LABEL_GROUPS = Array.from({ length: COLS }, (_, col) =>
  Array.from({ length: ROWS }, (_, row) => LABELS_ORDERED[col + row * COLS])
);

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
        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-200 focus-visible:outline-none',
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
    <section className="px-2" aria-label={`Grupo de etiquetas ${groupIndex + 1}`}>
      <div className="flex min-h-full flex-col gap-3 bg-orange-200 px-3">
        <div className="h-12 rounded-b-xl border border-t-0 border-neutral-200 bg-white shadow-sm" />
        <div className="flex flex-1 flex-col gap-3">
          {labels.map((label, labelIndex) => (
            <LabelButton
              key={`${groupIndex}-${labelIndex}-${getLabelKey(label)}`}
              label={label}
              onPrint={onPrint}
            />
          ))}
        </div>
        <div className="h-12 rounded-t-xl border border-b-0 border-neutral-200 bg-white shadow-sm" />
      </div>
    </section>
  );
}

function QuantitySelector({ quantity, onDecrease, onIncrease }) {
  return (
    <InputGroup className="mx-auto h-12 w-44" aria-label="Cantidad de copias">
      <InputGroupAddon align="inline-start">
        <InputGroupButton
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onDecrease}
          disabled={quantity <= 1}
          aria-label="Restar copia"
        >
          <Minus />
        </InputGroupButton>
      </InputGroupAddon>
      <div
        className="flex min-w-16 flex-1 items-center justify-center border-x border-input px-4 text-2xl font-bold tabular-nums text-foreground"
        aria-live="polite"
      >
        {quantity}
      </div>
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onIncrease}
          aria-label="Sumar copia"
        >
          <Plus />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
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
    <main className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl">
      <div className="min-h-0 flex-1 overflow-y-auto bg-transparent px-4 py-5 sm:px-6 lg:px-8">
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
