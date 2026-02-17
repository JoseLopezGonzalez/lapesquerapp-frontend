'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calculator, RotateCcw } from 'lucide-react';

const TARE_PER_BOX_OPTIONS = [
  { value: '1', label: '1 kg' },
  { value: '2', label: '2 kg' },
  { value: '2.7', label: '2,7 kg' },
  { value: '3', label: '3 kg' },
  { value: '4', label: '4 kg' },
  { value: '5', label: '5 kg' },
];

function calcNetWeight(gross, boxes, tarePerBox, tarePerPallet) {
  const g = parseFloat(gross) || 0;
  const b = Math.max(0, parseInt(boxes, 10) || 0);
  const tBox = parseFloat(tarePerBox) || 0;
  const tPallet = parseFloat(tarePerPallet) || 0;
  return Math.max(0, g - b * tBox - tPallet);
}

export default function NetWeightCalculatorDialog({ open, onOpenChange }) {
  const [grossWeight, setGrossWeight] = useState('');
  const [boxes, setBoxes] = useState(0);
  const [tarePerBox, setTarePerBox] = useState('2.7');
  const [tarePerPallet, setTarePerPallet] = useState('');

  const netWeight = useMemo(
    () => calcNetWeight(grossWeight, boxes, tarePerBox, tarePerPallet),
    [grossWeight, boxes, tarePerBox, tarePerPallet]
  );

  const handleReset = () => {
    setGrossWeight('');
    setBoxes(0);
    setTarePerBox('2.7');
    setTarePerPallet('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl w-[95vw] max-h-[90vh] overflow-y-auto gap-8 p-8">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Calculator className="h-7 w-7 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Calculadora</DialogTitle>
              <DialogDescription className="text-base">Calcular peso neto</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-6">
          <div className="grid gap-3">
            <Label htmlFor="calc-gross" className="text-lg">
              Peso bruto (kg)
            </Label>
            <Input
              id="calc-gross"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={grossWeight}
              onChange={(e) => setGrossWeight(e.target.value)}
              className="min-h-16 text-xl px-4 py-3 touch-manipulation"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="grid gap-3">
              <Label className="text-lg">Cajas</Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="min-h-16 min-w-16 shrink-0 text-3xl touch-manipulation active:scale-95"
                  onClick={() => setBoxes((b) => Math.max(0, b - 1))}
                  aria-label="Menos cajas"
                >
                  −
                </Button>
                <Input
                  type="number"
                  min="0"
                  className="min-h-16 text-xl text-center font-medium px-4 touch-manipulation"
                  value={boxes}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    setBoxes(Number.isNaN(v) ? 0 : Math.max(0, v));
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="min-h-16 min-w-16 shrink-0 text-3xl touch-manipulation active:scale-95"
                  onClick={() => setBoxes((b) => b + 1)}
                  aria-label="Más cajas"
                >
                  +
                </Button>
              </div>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="calc-tare-box" className="text-lg">
                Tara / caja (kg)
              </Label>
              <Select value={tarePerBox} onValueChange={setTarePerBox}>
                <SelectTrigger
                  id="calc-tare-box"
                  className="min-h-16 text-xl px-4 py-3 touch-manipulation [&>span]:text-xl"
                >
                  <SelectValue placeholder="Tara por caja" />
                </SelectTrigger>
                <SelectContent>
                  {TARE_PER_BOX_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-lg py-3">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3">
            <Label htmlFor="calc-tare-pallet" className="text-lg">
              Tara / palet (kg)
            </Label>
            <Input
              id="calc-tare-pallet"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={tarePerPallet}
              onChange={(e) => setTarePerPallet(e.target.value)}
              className="min-h-16 text-xl px-4 py-3 touch-manipulation"
            />
          </div>

          <div className="rounded-xl border-2 bg-muted/50 p-6 text-center">
            <p className="text-lg font-medium text-muted-foreground">Peso neto</p>
            <p className="text-4xl sm:text-5xl font-semibold tabular-nums tracking-tight mt-2">
              {netWeight.toFixed(2)} kg
            </p>
          </div>
        </div>

        <DialogFooter className="sm:justify-start pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            className="gap-2 min-h-14 px-6 text-lg touch-manipulation active:scale-[0.98]"
          >
            <RotateCcw className="h-5 w-5" />
            Resetear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
