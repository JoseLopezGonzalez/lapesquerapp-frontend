'use client';

import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useStoreContext } from '@/context/StoreContext';

interface StoreActiveFiltersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StoreActiveFiltersSheet({ open, onOpenChange }: StoreActiveFiltersSheetProps) {
  const { productsOptions, palletsOptions, onChangeFilters, resetFilters, filters } =
    useStoreContext();

  const lots = filters.lots ?? [];

  const selectedProducts = filters.products
    .map((v) => productsOptions.find((o) => o.value === v))
    .filter((p): p is { value: string | number; label: string } => Boolean(p));

  const selectedPallets = filters.pallets
    .map((v) => palletsOptions.find((o) => o.value === v))
    .filter((p): p is { value: string | number; label: string } => Boolean(p));

  const removeProduct = (value: string | number) =>
    onChangeFilters({ ...filters, products: filters.products.filter((p) => p !== value) });

  const removePallet = (value: string | number) =>
    onChangeFilters({ ...filters, pallets: filters.pallets.filter((p) => p !== value) });

  const removeLot = (lot: string) =>
    onChangeFilters({ ...filters, lots: lots.filter((l) => l !== lot) });

  const totalCount = selectedProducts.length + selectedPallets.length + lots.length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[70vh] overflow-y-auto rounded-t-3xl px-4 pb-10">
        <SheetHeader className="mb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base">
              {totalCount === 1 ? '1 filtro activo' : `${totalCount} filtros activos`}
            </SheetTitle>
            <Button variant="ghost" size="sm" onClick={() => { resetFilters(); onOpenChange(false); }}>
              Limpiar todo
            </Button>
          </div>
        </SheetHeader>

        <div className="space-y-4">
          {selectedProducts.length > 0 && (
            <div>
              <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wider">
                Artículos
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedProducts.map((p) => (
                  <Badge key={p.value} variant="secondary" className="flex items-center gap-1.5 py-1 pr-1.5 text-sm">
                    {p.label}
                    <button
                      onClick={() => removeProduct(p.value)}
                      className="hover:text-foreground text-muted-foreground rounded-full"
                      aria-label={`Quitar filtro ${p.label}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {selectedProducts.length > 0 && (selectedPallets.length > 0 || lots.length > 0) && (
            <Separator />
          )}

          {selectedPallets.length > 0 && (
            <div>
              <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wider">
                Palets
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedPallets.map((p) => (
                  <Badge key={p.value} variant="secondary" className="flex items-center gap-1.5 py-1 pr-1.5 text-sm">
                    Palet #{p.label}
                    <button
                      onClick={() => removePallet(p.value)}
                      className="hover:text-foreground text-muted-foreground rounded-full"
                      aria-label={`Quitar filtro palet ${p.label}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {selectedPallets.length > 0 && lots.length > 0 && <Separator />}

          {lots.length > 0 && (
            <div>
              <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wider">
                Lotes
              </p>
              <div className="flex flex-wrap gap-2">
                {lots.map((lot) => (
                  <Badge key={lot} variant="secondary" className="flex items-center gap-1.5 py-1 pr-1.5 text-sm">
                    {lot}
                    <button
                      onClick={() => removeLot(lot)}
                      className="hover:text-foreground text-muted-foreground rounded-full"
                      aria-label={`Quitar filtro lote ${lot}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
