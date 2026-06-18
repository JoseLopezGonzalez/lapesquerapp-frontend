'use client';

import { useRef, useState } from 'react';
import { ScanLine, Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
      {/* Input container — relative so el dropdown queda anclado aquí */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="text-muted-foreground pointer-events-none absolute left-3 h-4 w-4" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar palé, artículo..."
            className="bg-muted focus:ring-primary h-10 w-full rounded-full border-0 pl-9 pr-20 text-sm outline-none focus:ring-2 focus:ring-offset-0"
          />
          {query ? (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-10 h-7 w-7 rounded-full"
              onClick={() => setQuery('')}
              aria-label="Limpiar búsqueda"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 h-8 w-8 rounded-full"
            onClick={onScannerOpen}
            aria-label="Escanear QR"
          >
            <ScanLine className="h-4 w-4" />
          </Button>
        </div>

        {/* Resultados inline */}
        {showResults && (
          <div className="border-border bg-background absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border shadow-lg">
            {!hasResults ? (
              <p className="text-muted-foreground px-4 py-3 text-sm">Sin resultados</p>
            ) : (
              <>
                {filteredPallets.length > 0 && (
                  <>
                    <p className="text-muted-foreground px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider">
                      Palés
                    </p>
                    {filteredPallets.map((p) => (
                      <button
                        key={p.value}
                        onClick={() => handleSelectPallet(p.value)}
                        className="hover:bg-muted w-full px-4 py-2.5 text-left text-sm"
                      >
                        Palé #{p.label}
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
              Palé #{p.label}
              <button
                onClick={() => handleRemovePallet(p.value)}
                className="ml-0.5 rounded-full"
                aria-label={`Quitar filtro palé ${p.label}`}
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
