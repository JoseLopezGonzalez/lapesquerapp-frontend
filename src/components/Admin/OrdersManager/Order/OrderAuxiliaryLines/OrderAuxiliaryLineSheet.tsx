'use client';

import { useEffect, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/Shadcn/Combobox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, X } from 'lucide-react';
import type { AuxiliaryProductOption } from '@/types/catalog';
import { isRowValid, NO_CATALOG_VALUE, type AuxiliaryLineRow } from './types';

interface SelectOption {
  value: string | number;
  label: string;
}

const EMPTY_ROW: AuxiliaryLineRow = {
  auxiliaryProduct: null,
  description: '',
  quantity: '',
  unit: '',
  unitPrice: '',
  tax: { id: null, rate: null },
};

interface OrderAuxiliaryLineSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  row: AuxiliaryLineRow | null;
  catalogOptions: SelectOption[];
  catalogOptionsMap: Map<string, AuxiliaryProductOption>;
  taxOptions: SelectOption[];
  taxOptionsMap: Map<string, number | null>;
  optionsLoading?: boolean;
  onSave: (row: AuxiliaryLineRow) => Promise<void> | void;
}

export function OrderAuxiliaryLineSheet({
  open,
  onOpenChange,
  mode,
  row,
  catalogOptions,
  catalogOptionsMap,
  taxOptions,
  taxOptionsMap,
  optionsLoading,
  onSave,
}: OrderAuxiliaryLineSheetProps) {
  const [draft, setDraft] = useState<AuxiliaryLineRow>(EMPTY_ROW);
  const [isSaving, setIsSaving] = useState(false);

  // Reiniciar el borrador cada vez que se abre, con los datos de la línea a editar (o vacío al crear)
  useEffect(() => {
    if (open) {
      setDraft(row ?? EMPTY_ROW);
    }
  }, [open, row]);

  const handleProductChange = (value: string | number) => {
    const stringValue = String(value);
    setDraft((prev) => {
      if (stringValue === NO_CATALOG_VALUE || !stringValue) {
        return { ...prev, auxiliaryProduct: null };
      }
      const matched = catalogOptionsMap.get(stringValue);
      return {
        ...prev,
        auxiliaryProduct: { id: stringValue, name: matched?.name ?? '' },
        unit: matched?.unit ? matched.unit : prev.unit,
        unitPrice: matched?.defaultPrice != null ? String(matched.defaultPrice) : prev.unitPrice,
      };
    });
  };

  const handleTaxChange = (value: string) => {
    setDraft((prev) => ({ ...prev, tax: { id: value, rate: taxOptionsMap.get(value) ?? null } }));
  };

  const handleTextFieldChange = (field: 'description' | 'unit', value: string) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleNumberFieldChange = (field: 'quantity' | 'unitPrice', value: string) => {
    setDraft((prev) => ({ ...prev, [field]: value === '' ? '' : Number(value) }));
  };

  const handleSave = async () => {
    if (!isRowValid(draft)) return;
    setIsSaving(true);
    try {
      await onSave(draft);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(next) => !isSaving && onOpenChange(next)}>
      <SheetContent side="bottom" className="flex max-h-[90vh] flex-col">
        <SheetHeader>
          <SheetTitle>{mode === 'edit' ? 'Editar línea' : 'Añadir línea'}</SheetTitle>
          <SheetDescription>
            {mode === 'edit'
              ? 'Modifica los datos de la línea auxiliar.'
              : 'Añade nieve, envases, palets u otros artículos al pedido.'}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1 px-4">
          <div className="space-y-4 pb-4">
            <div className="space-y-1.5">
              <Label>Artículo del catálogo</Label>
              <Combobox
                options={catalogOptions}
                value={
                  draft.auxiliaryProduct ? String(draft.auxiliaryProduct.id) : NO_CATALOG_VALUE
                }
                onChange={handleProductChange}
                placeholder="Seleccionar artículo del catálogo..."
                searchPlaceholder="Buscar artículo..."
                notFoundMessage="No se encontraron artículos"
                className="h-11 w-full"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Descripción libre (opcional si hay artículo)</Label>
              <Input
                value={draft.description}
                onChange={(e) => handleTextFieldChange('description', e.target.value)}
                className="h-11"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={draft.quantity}
                  onChange={(e) => handleNumberFieldChange('quantity', e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Unidad</Label>
                <Input
                  value={draft.unit}
                  onChange={(e) => handleTextFieldChange('unit', e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Precio</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={draft.unitPrice}
                  onChange={(e) => handleNumberFieldChange('unitPrice', e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Impuesto (%)</Label>
                <Select
                  value={draft.tax?.id != null ? String(draft.tax.id) : ''}
                  onValueChange={handleTaxChange}
                >
                  <SelectTrigger loading={optionsLoading} className="h-11 w-full">
                    <SelectValue placeholder="IVA" />
                  </SelectTrigger>
                  <SelectContent loading={optionsLoading}>
                    {(taxOptions || []).map((tax) => (
                      <SelectItem key={tax.value} value={String(tax.value)}>
                        {tax.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="bg-background sticky bottom-0 flex-row gap-2 border-t pt-4">
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            className="min-h-[44px] flex-1"
            disabled={isSaving}
          >
            <X />
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isRowValid(draft) || isSaving}
            className="min-h-[44px] flex-1"
          >
            <Check />
            Guardar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
