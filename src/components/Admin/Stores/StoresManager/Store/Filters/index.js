'use client';

import { Box, Package, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Combobox } from '@/components/Shadcn/Combobox';
import { useStoreContext } from '@/context/StoreContext';
import { Badge } from '@/components/ui/badge';
import { PiMicrosoftExcelLogoFill } from 'react-icons/pi';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { ProductSummaryDialog } from '../ProductSummaryDialog';
import { PalletsListDialog } from '../PalletsListDialog';

const Filters = () => {
  const { productsOptions, onChangeFilters, filters, resetFilters, palletsOptions, loading } =
    useStoreContext();

  const selectedProducts = filters.products.map((product) =>
    productsOptions.find((option) => option.value === product)
  );

  const handleOnAddProduct = (value) => {
    if (!value || filters.products.some((product) => product === value)) return;
    onChangeFilters({
      ...filters,
      products: [...filters.products, value],
    });
  };

  const handleOnRemoveProduct = (value) => {
    onChangeFilters({
      ...filters,
      products: filters.products.filter((product) => product !== value),
    });
  };

  const selectedPallets = filters.pallets.map((pallet) =>
    palletsOptions.find((option) => option.value === pallet)
  );

  const handleOnAddPallet = (value) => {
    if (!value || filters.pallets.some((pallet) => pallet === value)) return;
    onChangeFilters({
      ...filters,
      pallets: [...filters.pallets, value],
    });
  };

  const handleOnRemovePallet = (value) => {
    onChangeFilters({
      ...filters,
      pallets: filters.pallets.filter((pallet) => pallet !== value),
    });
  };

  return (
    <Card className="bg-foreground-100 flex h-full w-full flex-col overflow-hidden">
      <CardHeader>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center text-lg font-medium">
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </h2>
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            Limpiar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto pb-5">
        <div className="h-full w-full">
          <div className="">
            <div className="space-y-6">
              <div>
                <h3 className="mb-3 text-sm font-medium">Nombre del producto</h3>
                <Combobox
                  options={productsOptions}
                  placeholder="Buscar producto"
                  searchPlaceholder="Buscar producto"
                  notFoundMessage="No se encontraron productos"
                  onChange={handleOnAddProduct}
                  loading={loading}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedProducts.map((product) => (
                  <Badge key={product.value} className="flex items-center gap-1 px-1">
                    {product.label}
                    <Button
                      variant="ghost"
                      size="xs"
                      className="rounded-full"
                      onClick={() => handleOnRemoveProduct(product.value)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>

              <Separator />

              <div>
                <h3 className="mb-3 text-sm font-medium">Id Palets</h3>
                <Combobox
                  options={palletsOptions}
                  placeholder="Buscar palet"
                  searchPlaceholder="Buscar palet"
                  notFoundMessage="No se encontraron palets"
                  onChange={handleOnAddPallet}
                  loading={loading}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedPallets.map((product) => (
                  <Badge key={product.value} className="flex items-center gap-1 px-1">
                    {product.label}
                    <Button
                      variant="ghost"
                      size="xs"
                      className="rounded-full"
                      onClick={() => handleOnRemovePallet(product.value)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>

              <Separator />

              {/* Filter by type */}
              <div>
                <h3 className="mb-3 text-sm font-medium">Tipo de producto</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="filter-pallet"
                      disabled={true}
                      /* checked={filters.types.pallet}
                                        onCheckedChange={(checked) =>
                                            setFilters({
                                                ...filters,
                                                types: { ...filters.types, pallet: checked === true },
                                            })
                                        } */
                    />
                    <label htmlFor="filter-pallet" className="flex items-center text-sm">
                      <Package className="mr-2 h-4 w-4" />
                      Pallets
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="filter-box"
                      disabled={true}
                      /* checked={filters.types.box}
                                        onCheckedChange={(checked) =>
                                            setFilters({
                                                ...filters,
                                                types: { ...filters.types, box: checked === true },
                                            })
                                        } */
                    />
                    <label htmlFor="filter-box" className="flex items-center text-sm">
                      <Box className="mr-2 h-4 w-4" />
                      Cajas
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="filter-tub"
                      disabled={true}
                      /* checked={filters.types.tub}
                                        onCheckedChange={(checked) =>
                                            setFilters({
                                                ...filters,
                                                types: { ...filters.types, tub: checked === true },
                                            })
                                        } */
                    />
                    <label htmlFor="filter-tub" className="flex items-center text-sm">
                      <Box className="mr-2 h-4 w-4 rotate-45" />
                      Tinas
                    </label>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex w-full flex-col gap-2">
                {/*  <Button variant="secondary" className="w-full">
                                    <PiMicrosoftExcelLogoFill className="h-5 w-5" />
                                    Exportar a Excel
                                </Button> */}
                <PalletsListDialog />
                <ProductSummaryDialog />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  );
};

export default Filters;
