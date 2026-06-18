'use client';

import { type ChangeEvent, useRef, useState } from 'react';
import { ScanLine, Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { useStoreContext } from '@/context/StoreContext';

interface StoreSearchBarProps {
  onScannerOpen: () => void;
}

export function StoreSearchBar({ onScannerOpen }: StoreSearchBarProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const { palletsOptions, productsOptions, openPalletDialog, onChangeFilters, filters } =
    useStoreContext();

  const q = query.trim().toLowerCase();
  const showResults = q.length >= 1;

  const filteredPallets = showResults
    ? palletsOptions
        .filter(
          (p) =>
            String(p.label).toLowerCase().includes(q) ||
            String(p.value).toLowerCase().includes(q),
        )
        .slice(0, 6)
    : [];

  const filteredProducts = showResults
    ? productsOptions.filter((p) => String(p.label).toLowerCase().includes(q)).slice(0, 6)
    : [];

  const hasResults = filteredPallets.length > 0 || filteredProducts.length > 0;

  const selectedProducts = filters.products
    .map((v) => productsOptions.find((o) => o.value === v))
    .filter((p): p is { value: string | number; label: string } => Boolean(p));

  const selectedPallets = filters.pallets
    .map((v) => palletsOptions.find((o) => o.value === v))
    .filter((p): p is { value: string | number; label: string } => Boolean(p));

  const hasActiveFilters = selectedProducts.length > 0 || selectedPallets.length > 0;

  const handleSelectPallet = (value: string | number) => {
    openPalletDialog(Number(value));
    setQuery('');
    inputRef.current?.blur();
  };

  const handleSelectProduct = (value: string | number) => {
    if (!filters.products.some((p) => p === value)) {
      onChangeFilters({ ...filters, products: [...filters.products, value] });
    }
    setQuery('');
    inputRef.current?.blur();
  };

  const handleRemoveProduct = (value: string | number) => {
    onChangeFilters({ ...filters, products: filters.products.filter((p) => p !== value) });
  };

  const handleRemovePallet = (value: string | number) => {
    onChangeFilters({ ...filters, pallets: filters.pallets.filter((p) => p !== value) });
  };

  const handleClearAll = () => {
    onChangeFilters({ ...filters, products: [], pallets: [] });
  };

  return (
    <div className="shrink-0 px-3 pb-2">
      <div className="relative">
        <InputGroup className="h-10">
          <InputGroupAddon align="inline-start">
            <Search className="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            ref={inputRef}
            value={query}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            placeholder="Buscar palet, artículo..."
          />
          <InputGroupAddon align="inline-end">
            {query ? (
              <InputGroupButton
                className=""
                size="icon-xs"
                onClick={() => setQuery('')}
                aria-label="Limpiar búsqueda"
              >
                <X className="size-3.5" />
              </InputGroupButton>
            ) : null}
            <InputGroupButton
              className=""
              size="icon-sm"
              onClick={onScannerOpen}
              aria-label="Escanear QR"
            >
              <ScanLine className="size-4" />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>

        {/* Resultados inline */}
        {showResults && (
          <div className="border-border bg-background absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border shadow-lg">
            {!hasResults ? (
              <p className="text-muted-foreground px-4 py-3 text-sm">Sin resultados</p>
            ) : (
              <>
                {filteredPallets.length > 0 && (
                  <>
                    <p className="text-muted-foreground px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider">
                      Palets
                    </p>
                    {filteredPallets.map((p) => (
                      <button
                        key={p.value}
                        onClick={() => handleSelectPallet(p.value)}
                        className="hover:bg-muted w-full px-4 py-2.5 text-left text-sm"
                      >
                        Palet #{p.label}
                      </button>
                    ))}
                  </>
                )}
                {filteredProducts.length > 0 && (
                  <>
                    <p className="text-muted-foreground px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider">
                      Artículos
                    </p>
                    {filteredProducts.map((p) => (
                      <button
                        key={p.value}
                        onClick={() => handleSelectProduct(p.value)}
                        className="hover:bg-muted w-full px-4 py-2.5 text-left text-sm"
                      >
                        {p.label}
                      </button>
                    ))}
                  </>
                )}
              </>
            )}
            <div className="h-2" />
          </div>
        )}
      </div>

      {/* Tags de filtros activos */}
      {hasActiveFilters && !showResults && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {selectedProducts.map((p) => (
            <Badge key={p.value} variant="secondary" className="flex items-center gap-1 pr-1">
              {p.label}
              <button
                onClick={() => handleRemoveProduct(p.value)}
                className="ml-0.5 rounded-full"
                aria-label={`Quitar filtro ${p.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {selectedPallets.map((p) => (
            <Badge key={p.value} variant="secondary" className="flex items-center gap-1 pr-1">
              Palet #{p.label}
              <button
                onClick={() => handleRemovePallet(p.value)}
                className="ml-0.5 rounded-full"
                aria-label={`Quitar filtro palet ${p.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <button
            onClick={handleClearAll}
            className="text-muted-foreground text-xs underline-offset-2 hover:underline"
          >
            Limpiar
          </button>
        </div>
      )}
    </div>
  );
}
