'use client';

import { Box, Filter, Package, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Combobox } from '@/components/Shadcn/Combobox';
import { useStoreContext } from '@/context/StoreContext';
import { PalletsListDialog } from '../StoresManager/Store/PalletsListDialog';
import { ProductSummaryDialog } from '../StoresManager/Store/ProductSummaryDialog';

interface MobileFiltersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileFiltersSheet({ open, onOpenChange }: MobileFiltersSheetProps) {
  const { productsOptions, onChangeFilters, filters, resetFilters, palletsOptions, loading } =
    useStoreContext();

  const selectedProducts = filters.products
    .map((product: string) => productsOptions.find((opt: { value: string }) => opt.value === product))
    .filter(Boolean);

  const selectedPallets = filters.pallets
    .map((pallet: string) => palletsOptions.find((opt: { value: string }) => opt.value === pallet))
    .filter(Boolean);

  const handleAddProduct = (value: string | number) => {
    if (!value || filters.products.some((p: string) => p === value)) return;
    onChangeFilters({ ...filters, products: [...filters.products, value] });
  };

  const handleRemoveProduct = (value: string | number) => {
    onChangeFilters({ ...filters, products: filters.products.filter((p: string) => p !== value) });
  };

  const handleAddPallet = (value: string | number) => {
    if (!value || filters.pallets.some((p: string) => p === value)) return;
    onChangeFilters({ ...filters, pallets: [...filters.pallets, value] });
  };

  const handleRemovePallet = (value: string | number) => {
    onChangeFilters({ ...filters, pallets: filters.pallets.filter((p: string) => p !== value) });
  };

  const handleReset = () => {
    resetFilters();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-3xl px-4 pb-8">
        <SheetHeader className="mb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4" />
              Filtros
            </SheetTitle>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Limpiar todo
            </Button>
          </div>
        </SheetHeader>

        <div className="space-y-5">
          {/* Producto */}
          <div>
            <h3 className="mb-2 text-sm font-medium">Nombre del producto</h3>
            <Combobox
              options={productsOptions}
              placeholder="Buscar producto"
              searchPlaceholder="Buscar producto"
              notFoundMessage="No se encontraron productos"
              onChange={handleAddProduct}
              loading={loading}
            />
            {selectedProducts.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedProducts.map((product: { value: string; label: string }) => (
                  <Badge key={product.value} className="flex items-center gap-1 px-2">
                    {product.label}
                    <button
                      onClick={() => handleRemoveProduct(product.value)}
                      className="ml-1 rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Palés */}
          <div>
            <h3 className="mb-2 text-sm font-medium">Id Palés</h3>
            <Combobox
              options={palletsOptions}
              placeholder="Buscar palé"
              searchPlaceholder="Buscar palé"
              notFoundMessage="No se encontraron palés"
              onChange={handleAddPallet}
              loading={loading}
            />
            {selectedPallets.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedPallets.map((pallet: { value: string; label: string }) => (
                  <Badge key={pallet.value} className="flex items-center gap-1 px-2">
                    {pallet.label}
                    <button
                      onClick={() => handleRemovePallet(pallet.value)}
                      className="ml-1 rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Tipo — deshabilitado */}
          <div>
            <h3 className="mb-2 text-sm font-medium">Tipo de producto</h3>
            <div className="space-y-2">
              {[
                { id: 'pallet', icon: Package, label: 'Pallets' },
                { id: 'box', icon: Box, label: 'Cajas' },
                { id: 'tub', icon: Box, label: 'Tinas', rotate: true },
              ].map(({ id, icon: Icon, label, rotate }) => (
                <div key={id} className="flex items-center space-x-2">
                  <Checkbox id={`filter-${id}`} disabled />
                  <label htmlFor={`filter-${id}`} className="flex items-center text-sm">
                    <Icon className={`mr-2 h-4 w-4 ${rotate ? 'rotate-45' : ''}`} />
                    {label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Acciones de informes */}
          <div className="flex flex-col gap-2">
            <PalletsListDialog />
            <ProductSummaryDialog />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
