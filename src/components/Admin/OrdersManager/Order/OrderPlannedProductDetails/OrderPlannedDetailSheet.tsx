'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ArrowLeft, Check, ChevronRight, Loader2, Search, X } from 'lucide-react';
import { parseTaxRate } from '@/hooks/orders/useOrderPlannedDetails';
import { isDetailValid, type PlannedDetail } from './types';

interface SelectOption {
  value: string | number;
  label: string;
}

type SelectionView = 'form' | 'product' | 'tax';

const EMPTY_DETAIL: PlannedDetail = {
  product: { name: '', id: null },
  boxes: '',
  quantity: '',
  unitPrice: '',
  tax: { rate: null },
};

interface OrderPlannedDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  detail: PlannedDetail | null;
  productOptions: SelectOption[];
  taxOptions: SelectOption[];
  optionsLoading?: boolean;
  onSave: (detail: PlannedDetail) => Promise<void> | void;
}

export function OrderPlannedDetailSheet({
  open,
  onOpenChange,
  mode,
  detail,
  productOptions,
  taxOptions,
  optionsLoading,
  onSave,
}: OrderPlannedDetailSheetProps) {
  const [draft, setDraft] = useState<PlannedDetail>(EMPTY_DETAIL);
  const [isSaving, setIsSaving] = useState(false);
  const [view, setView] = useState<SelectionView>('form');
  const [productSearch, setProductSearch] = useState('');

  // Reiniciar el borrador cada vez que se abre, con los datos de la línea a editar (o vacío al crear)
  useEffect(() => {
    if (open) {
      setDraft(detail ?? EMPTY_DETAIL);
      setView('form');
      setProductSearch('');
    }
  }, [open, detail]);

  const productOptionsMap = useMemo(() => {
    const map = new Map<string, string>();
    productOptions.forEach((option) => map.set(String(option.value), String(option.label)));
    return map;
  }, [productOptions]);

  const productLabel = draft.product?.id
    ? productOptionsMap.get(String(draft.product.id)) ||
      draft.product.name ||
      'Producto seleccionado'
    : 'Seleccionar producto';

  const filteredProductOptions = useMemo(() => {
    const normalizedSearch = productSearch.trim().toLowerCase();
    if (!normalizedSearch) return productOptions || [];

    return (productOptions || []).filter((option) =>
      String(option.label).toLowerCase().includes(normalizedSearch)
    );
  }, [productOptions, productSearch]);

  const taxOptionsMap = useMemo(() => {
    const map = new Map<number, number | null>();
    taxOptions.forEach((option) => map.set(Number(option.value), parseTaxRate(option.label)));
    return map;
  }, [taxOptions]);

  const taxLabel = useMemo(() => {
    if (draft.tax?.id == null || draft.tax.id === '') return 'IVA';
    return (
      (taxOptions || []).find((tax) => String(tax.value) === String(draft.tax?.id))?.label ||
      'IVA seleccionado'
    );
  }, [draft.tax?.id, taxOptions]);

  const handleProductChange = (value: string | number) => {
    const stringValue = String(value);
    setDraft((prev) => ({
      ...prev,
      product: { id: stringValue || null, name: productOptionsMap.get(stringValue) || '' },
    }));
    setView('form');
    setProductSearch('');
  };

  const handleTaxChange = (value: string) => {
    setDraft((prev) => ({
      ...prev,
      tax: { id: Number(value), rate: taxOptionsMap.get(Number(value)) ?? null },
    }));
    setView('form');
  };

  const handleFieldChange = (field: 'boxes' | 'quantity' | 'unitPrice', value: string) => {
    setDraft((prev) => ({ ...prev, [field]: value === '' ? '' : value }));
  };

  const handleSave = async () => {
    if (!isDetailValid(draft)) return;
    setIsSaving(true);
    try {
      await onSave(draft);
    } finally {
      setIsSaving(false);
    }
  };

  const renderSelectionRow = (
    option: SelectOption,
    selected: boolean,
    onSelect: (value: string | number) => void
  ) => (
    <button
      key={option.value}
      type="button"
      onClick={() => onSelect(option.value)}
      className={cn(
        'border-border flex min-h-[48px] w-full items-center gap-3 border-b px-4 py-3 text-left last:border-b-0',
        selected && 'bg-accent text-accent-foreground'
      )}
    >
      <Check className={cn('size-4 shrink-0', selected ? 'opacity-100' : 'opacity-0')} />
      <span className="min-w-0 flex-1 text-sm leading-snug">{option.label}</span>
    </button>
  );

  const renderSelectionView = () => {
    const isProductView = view === 'product';
    const title = isProductView ? 'Seleccionar producto' : 'Seleccionar IVA';
    const description = isProductView
      ? 'Busca y elige el producto previsto para esta línea.'
      : 'Elige el impuesto de la línea.';
    const options = isProductView ? filteredProductOptions : taxOptions || [];
    const emptyMessage = isProductView
      ? 'No se encontraron productos'
      : 'No hay impuestos disponibles';

    return (
      <>
        <SheetHeader className="border-b">
          <div className="flex items-start gap-2 pr-10">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="-ml-2 size-9 shrink-0"
              onClick={() => setView('form')}
              aria-label="Volver al formulario"
            >
              <ArrowLeft className="size-4" />
            </Button>
            <div className="min-w-0">
              <SheetTitle>{title}</SheetTitle>
              <SheetDescription>{description}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {isProductView && (
          <div className="border-b px-4 pb-3">
            <div className="relative">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                value={productSearch}
                onChange={(event) => setProductSearch(event.target.value)}
                placeholder="Buscar producto..."
                className="h-11 pl-9"
                autoFocus
              />
            </div>
          </div>
        )}

        <ScrollArea className="min-h-0 flex-1">
          {optionsLoading ? (
            <div className="text-muted-foreground flex min-h-[180px] items-center justify-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Cargando opciones...
            </div>
          ) : options.length > 0 ? (
            <div>
              {options.map((option) =>
                renderSelectionRow(
                  option,
                  isProductView
                    ? String(option.value) === String(draft.product?.id)
                    : String(option.value) === String(draft.tax?.id),
                  (value) =>
                    isProductView ? handleProductChange(value) : handleTaxChange(String(value))
                )
              )}
            </div>
          ) : (
            <div className="text-muted-foreground flex min-h-[180px] items-center justify-center px-6 text-center text-sm">
              {emptyMessage}
            </div>
          )}
        </ScrollArea>
      </>
    );
  };

  return (
    <Sheet open={open} onOpenChange={(next) => !isSaving && onOpenChange(next)}>
      <SheetContent side="bottom" className="flex max-h-[90vh] flex-col">
        {view === 'form' ? (
          <>
            <SheetHeader>
              <SheetTitle>{mode === 'edit' ? 'Editar línea' : 'Añadir línea'}</SheetTitle>
              <SheetDescription>
                {mode === 'edit'
                  ? 'Modifica los datos de la línea prevista.'
                  : 'Añade un nuevo producto a la previsión del pedido.'}
              </SheetDescription>
            </SheetHeader>

            <ScrollArea className="min-h-0 flex-1 px-4">
              <div className="space-y-4 pb-4">
                <div className="space-y-1.5">
                  <Label>Artículo</Label>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={optionsLoading}
                    onClick={() => setView('product')}
                    className="h-11 w-full justify-between gap-3 px-3 text-left font-normal"
                  >
                    <span
                      className={cn(
                        'min-w-0 flex-1 truncate',
                        !draft.product?.id && 'text-muted-foreground'
                      )}
                    >
                      {optionsLoading ? 'Cargando opciones...' : productLabel}
                    </span>
                    {optionsLoading ? (
                      <Loader2 className="text-muted-foreground size-4 shrink-0 animate-spin" />
                    ) : (
                      <ChevronRight className="text-muted-foreground size-4 shrink-0" />
                    )}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Cajas</Label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={draft.boxes}
                      onChange={(e) => handleFieldChange('boxes', e.target.value)}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Cantidad</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={draft.quantity}
                      onChange={(e) => handleFieldChange('quantity', e.target.value)}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Precio</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={draft.unitPrice}
                      onChange={(e) => handleFieldChange('unitPrice', e.target.value)}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Impuesto (%)</Label>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={optionsLoading}
                      onClick={() => setView('tax')}
                      className="h-11 w-full justify-between gap-3 px-3 text-left font-normal"
                    >
                      <span
                        className={cn(
                          'min-w-0 flex-1 truncate',
                          draft.tax?.id == null && 'text-muted-foreground'
                        )}
                      >
                        {optionsLoading ? 'Cargando...' : taxLabel}
                      </span>
                      {optionsLoading ? (
                        <Loader2 className="text-muted-foreground size-4 shrink-0 animate-spin" />
                      ) : (
                        <ChevronRight className="text-muted-foreground size-4 shrink-0" />
                      )}
                    </Button>
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
                disabled={!isDetailValid(draft) || isSaving}
                className="min-h-[44px] flex-1"
              >
                <Check />
                Guardar
              </Button>
            </SheetFooter>
          </>
        ) : (
          renderSelectionView()
        )}
      </SheetContent>
    </Sheet>
  );
}
