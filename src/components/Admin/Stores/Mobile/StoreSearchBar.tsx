'use client';

import { type ChangeEvent, useMemo, useRef, useState } from 'react';
import { Filter, MapPin, ScanLine, Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { useStoreContext } from '@/context/StoreContext';
import { StoreActiveFiltersSheet } from './StoreActiveFiltersSheet';

interface StoreSearchBarProps {
  onScannerOpen: () => void;
}

type StorePallet = {
  id: string | number;
  boxes?: Array<{
    product?: { id?: string | number; name?: string };
    lot?: string;
  }>;
};

type SpeciesEntry = {
  products?: Array<{ name: string; quantity: number; boxes: number }>;
};

export function StoreSearchBar({ onScannerOpen }: StoreSearchBarProps) {
  const [query, setQuery] = useState('');
  const [filtersSheetOpen, setFiltersSheetOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { store, speciesSummary, productsOptions, openPalletDialog, onChangeFilters, filters } =
    useStoreContext();

  // Mapa de nombre de artículo → { kg, cajas } para mostrar en los resultados
  const productSummaryMap = useMemo(() => {
    const map = new Map<string, { kg: number; boxes: number }>();
    (speciesSummary as SpeciesEntry[]).forEach((species) => {
      species.products?.forEach((p) => {
        map.set(p.name, { kg: p.quantity, boxes: p.boxes });
      });
    });
    return map;
  }, [speciesSummary]);

  // Datos enriquecidos de cada palet: nombres de producto y lotes que contiene
  const palletSearchData = useMemo(() => {
    return ((store?.content?.pallets as StorePallet[] | undefined) ?? []).map((pallet) => {
      const productNamesLower: string[] = [];
      const productHints: string[] = [];
      const lots: string[] = [];

      (pallet.boxes ?? []).forEach((box) => {
        const name = box.product?.name;
        if (name && !productNamesLower.includes(name.toLowerCase())) {
          productNamesLower.push(name.toLowerCase());
          productHints.push(name);
        }
        const lot = box.lot;
        if (lot && !lots.includes(lot.toLowerCase())) {
          lots.push(lot.toLowerCase());
        }
      });

      return { id: pallet.id, productNamesLower, productHint: productHints[0] ?? '', lots };
    });
  }, [store?.content?.pallets]);

  // Todos los lotes únicos del almacén
  const allLots = useMemo(() => {
    const set = new Set<string>();
    ((store?.content?.pallets as StorePallet[] | undefined) ?? []).forEach((pallet) => {
      (pallet.boxes ?? []).forEach((box) => {
        if (box.lot) set.add(box.lot);
      });
    });
    return Array.from(set);
  }, [store?.content?.pallets]);

  const q = query.trim().toLowerCase();
  const showResults = q.length >= 1;

  // Palets por ID
  const palletsByIdMatch = showResults
    ? palletSearchData
        .filter((p) => String(p.id).includes(q))
        .slice(0, 3)
        .map((p) => ({ id: p.id, hint: '' }))
    : [];

  // Palets por nombre de producto (deduplicados)
  const palletsByProductMatch = showResults
    ? palletSearchData
        .filter(
          (p) =>
            p.productNamesLower.some((n) => n.includes(q)) &&
            !palletsByIdMatch.some((pm) => pm.id === p.id),
        )
        .slice(0, 4)
        .map((p) => ({ id: p.id, hint: p.productHint }))
    : [];

  // Palets por lote (deduplicados)
  const existingIds = new Set([
    ...palletsByIdMatch.map((p) => p.id),
    ...palletsByProductMatch.map((p) => p.id),
  ]);
  const palletsByLotMatch = showResults
    ? palletSearchData
        .filter((p) => p.lots.some((l) => l.includes(q)) && !existingIds.has(p.id))
        .slice(0, 3)
        .map((p) => ({
          id: p.id,
          hint: `Lote ${allLots.find((l) => l.toLowerCase().includes(q)) ?? ''}`,
        }))
    : [];

  const allMatchingPallets = [...palletsByIdMatch, ...palletsByProductMatch, ...palletsByLotMatch];

  // Artículos como filtro
  const filteredProducts = showResults
    ? productsOptions.filter((p) => String(p.label).toLowerCase().includes(q)).slice(0, 5)
    : [];

  // Lotes como filtro
  const filteredLots = showResults
    ? allLots.filter((lot) => lot.toLowerCase().includes(q)).slice(0, 4)
    : [];

  const hasResults =
    allMatchingPallets.length > 0 || filteredProducts.length > 0 || filteredLots.length > 0;

  const activeFilterCount =
    filters.products.length + filters.pallets.length + filters.lots.length;

  // Handlers
  const handleOpenPallet = (palletId: string | number) => {
    openPalletDialog(Number(palletId));
    setQuery('');
    inputRef.current?.blur();
  };

  const handleFilterPallet = (palletId: string | number) => {
    if (!filters.pallets.some((p) => p === palletId)) {
      onChangeFilters({ ...filters, pallets: [...filters.pallets, palletId] });
    }
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

  const handleSelectLot = (lot: string) => {
    if (!filters.lots.includes(lot)) {
      onChangeFilters({ ...filters, lots: [...filters.lots, lot] });
    }
    setQuery('');
    inputRef.current?.blur();
  };

  return (
    <div className="shrink-0 px-3 pb-2">
      <div className="flex items-center gap-2">
        {/* Input */}
        <div className="relative min-w-0 flex-1">
          <InputGroup className="h-10">
            <InputGroupAddon align="inline-start">
              <Search className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              ref={inputRef}
              value={query}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
              placeholder="Buscar palet, artículo, lote..."
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
                  {/* Palets — abrir o filtrar */}
                  {allMatchingPallets.length > 0 && (
                    <>
                      <p className="text-muted-foreground px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider">
                        Palets
                      </p>
                      {allMatchingPallets.map((p) => (
                        <div key={p.id} className="hover:bg-muted flex w-full items-center">
                          {/* Acción primaria: abrir ficha */}
                          <button
                            onClick={() => handleOpenPallet(p.id)}
                            className="flex min-w-0 flex-1 items-baseline gap-2 px-4 py-2.5 text-left"
                          >
                            <span className="shrink-0 text-sm">Palet #{p.id}</span>
                            {p.hint && (
                              <span className="text-muted-foreground truncate text-xs">
                                {p.hint}
                              </span>
                            )}
                          </button>
                          {/* Acción secundaria: filtrar en mapa */}
                          <button
                            onClick={() => handleFilterPallet(p.id)}
                            className="text-muted-foreground hover:text-foreground shrink-0 px-3 py-2.5"
                            aria-label={`Filtrar por palet ${p.id}`}
                            title="Resaltar en mapa"
                          >
                            <MapPin className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </>
                  )}

                  {/* Artículos — filtro con resumen */}
                  {filteredProducts.length > 0 && (
                    <>
                      <p className="text-muted-foreground px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider">
                        Artículos
                      </p>
                      {filteredProducts.map((p) => {
                        const summary = productSummaryMap.get(String(p.label));
                        return (
                          <button
                            key={p.value}
                            onClick={() => handleSelectProduct(p.value)}
                            className="hover:bg-muted flex w-full items-center gap-3 px-4 py-2.5 text-left"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm">{p.label}</p>
                              {summary && (
                                <p className="text-muted-foreground text-xs">
                                  {summary.boxes} cajas · {summary.kg % 1 === 0
                                    ? summary.kg.toFixed(0)
                                    : summary.kg.toFixed(1)}{' '}
                                  kg
                                </p>
                              )}
                            </div>
                            <span className="text-muted-foreground shrink-0 text-xs">Filtrar</span>
                          </button>
                        );
                      })}
                    </>
                  )}

                  {/* Lotes — filtro */}
                  {filteredLots.length > 0 && (
                    <>
                      <p className="text-muted-foreground px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider">
                        Lotes
                      </p>
                      {filteredLots.map((lot) => (
                        <button
                          key={lot}
                          onClick={() => handleSelectLot(lot)}
                          className="hover:bg-muted flex w-full items-center justify-between px-4 py-2.5 text-left text-sm"
                        >
                          {lot}
                          <span className="text-muted-foreground text-xs">Filtrar</span>
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

        {/* Botón filtros activos */}
        {activeFilterCount > 0 && (
          <Button
            variant="outline"
            size="icon"
            className="relative shrink-0"
            onClick={() => setFiltersSheetOpen(true)}
            aria-label={`${activeFilterCount} filtros activos`}
          >
            <Filter className="h-4 w-4" />
            <Badge className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center p-0 text-[10px]">
              {activeFilterCount}
            </Badge>
          </Button>
        )}
      </div>

      <StoreActiveFiltersSheet open={filtersSheetOpen} onOpenChange={setFiltersSheetOpen} />
    </div>
  );
}
