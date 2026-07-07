'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link2, Search, Loader2, X } from 'lucide-react';
import { Combobox } from '@/components/Shadcn/Combobox';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from '@/components/ui/pagination';
import Masonry from 'react-masonry-css';
import SearchPalletCard, { type SearchPalletCardData } from '../SearchPalletCard';
import { cn } from '@/lib/utils';

interface PaginationMeta {
  current_page: number;
  last_page: number;
  total?: number;
}

interface LinkPalletsDialogProps {
  open: boolean;
  onClose: () => void;
  orderId: number | string | null | undefined;
  pallets: unknown;
  storeOptions: Array<{ value: number | string; label: string }>;
  storesLoading?: boolean;
  isMobile?: boolean;
  onSearch: (page: number, storeId?: number | string | null) => void;
  onToggleSelection: (palletId: number | string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  selectedPalletIds: (number | string)[];
  searchResults: SearchPalletCardData[];
  paginationMeta?: PaginationMeta | null;
  isSearching?: boolean;
  isInitialLoading?: boolean;
  isLinking?: boolean;
  palletIds: number[];
  inputPalletId: string;
  setInputPalletId: (value: string) => void;
  filterStoreId: number | string | null;
  setFilterStoreId: (value: number | string | null) => void;
  onRemovePalletId: (id: number) => void;
  onPalletIdKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onLinkSelected: () => void;
  currentPage?: number;
}

export default function LinkPalletsDialog({
  open,
  onClose,
  orderId,
  storeOptions,
  storesLoading,
  isMobile,
  onSearch,
  onToggleSelection,
  onSelectAll,
  onDeselectAll,
  selectedPalletIds,
  searchResults,
  paginationMeta,
  isSearching,
  isInitialLoading,
  isLinking,
  palletIds,
  inputPalletId,
  setInputPalletId,
  filterStoreId,
  setFilterStoreId,
  onRemovePalletId,
  onPalletIdKeyDown,
  onLinkSelected,
}: LinkPalletsDialogProps) {
  const handleClose = () => {
    if (!isLinking) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={
          isMobile
            ? 'm-0 flex h-full max-h-full w-full max-w-full flex-col rounded-none'
            : 'flex max-h-[85vh] flex-col sm:max-w-4xl'
        }
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Vincular palets existentes
          </DialogTitle>
        </DialogHeader>
        {isInitialLoading ? (
          <div className="grid grid-cols-1 gap-3 py-2 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-md" />
            ))}
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex-shrink-0 space-y-2 pb-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="store-filter" className="text-muted-foreground text-xs">
                    Filtrar por almacén
                  </Label>
                  <Combobox
                    options={[{ value: 'all', label: 'Todos los almacenes' }, ...storeOptions]}
                    value={filterStoreId || 'all'}
                    onChange={(value) => {
                      const newStoreId = value === 'all' || value === '' ? null : value;
                      setFilterStoreId(newStoreId);
                      if (!palletIds.length) {
                        onSearch(1, newStoreId);
                      }
                    }}
                    placeholder="Todos los almacenes"
                    searchPlaceholder="Buscar almacén..."
                    notFoundMessage="No se encontraron almacenes"
                    loading={storesLoading}
                    disabled={isSearching || isInitialLoading}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pallet-id-input" className="text-muted-foreground text-xs">
                    Buscar por ID de palet
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      id="pallet-id-input"
                      value={inputPalletId}
                      onChange={(e) => setInputPalletId(e.target.value)}
                      onKeyDown={onPalletIdKeyDown}
                      placeholder="Ingresa el ID y presiona Enter"
                      disabled={isSearching || isInitialLoading}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => onSearch(1)}
                      disabled={isSearching || isInitialLoading}
                      size="default"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              {palletIds.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-muted-foreground text-xs">IDs:</span>
                  {palletIds.map((id) => (
                    <Badge key={id} className="flex items-center gap-1">
                      {id}
                      <button
                        onClick={() => onRemovePalletId(id)}
                        type="button"
                        className="group bg-foreground-700 text-md text-black-500 rounded-full p-0.5 font-bold shadow-sm hover:bg-white/95"
                        disabled={isSearching || isInitialLoading}
                      >
                        <X className="group-hover:text-primary h-3 w-3" aria-hidden="true" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {searchResults.length > 0 && (
              <div className="flex min-h-0 flex-1 flex-col space-y-3 overflow-hidden">
                <div className="flex flex-shrink-0 items-center justify-between">
                  <Label className="text-sm font-medium">
                    Palets encontrados ({paginationMeta?.total || searchResults.length})
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (selectedPalletIds.length === searchResults.length) {
                        onDeselectAll();
                      } else {
                        onSelectAll();
                      }
                    }}
                  >
                    {selectedPalletIds.length === searchResults.length
                      ? 'Deseleccionar todos'
                      : 'Seleccionar todos'}
                  </Button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto pr-2 pb-2">
                  <Masonry
                    breakpointCols={{
                      default: 2,
                      1280: 2,
                      768: 1,
                      640: 1,
                    }}
                    className="masonry-grid"
                    columnClassName="masonry-grid_column"
                  >
                    {searchResults.map((pallet) => {
                      const isSelected = selectedPalletIds.includes(pallet.id);
                      const isLinkedToOtherOrder = Boolean(
                        pallet.orderId && pallet.orderId !== orderId
                      );
                      return (
                        <div key={pallet.id} className="mb-4">
                          <SearchPalletCard
                            pallet={pallet}
                            isSelected={isSelected}
                            isLinkedToOtherOrder={isLinkedToOtherOrder}
                            onToggleSelection={() => onToggleSelection(pallet.id)}
                          />
                        </div>
                      );
                    })}
                  </Masonry>
                </div>
              </div>
            )}

            {searchResults.length === 0 && !isSearching && (
              <div className="text-muted-foreground py-8 text-center">
                <p>
                  {palletIds.length === 0
                    ? 'No hay palets disponibles para vincular.'
                    : 'No se encontraron palets con los IDs especificados.'}
                </p>
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          <div className="mr-auto flex items-center gap-2">
            {paginationMeta &&
              paginationMeta.last_page > 1 &&
              (() => {
                const totalPages = paginationMeta.last_page;
                const page = paginationMeta.current_page;
                const prevDisabled = page === 1 || isSearching;
                const nextDisabled = page === totalPages || isSearching;
                const handlePrev = (e: React.MouseEvent) => {
                  e.preventDefault();
                  if (!prevDisabled) onSearch(page - 1);
                };
                const handleNext = (e: React.MouseEvent) => {
                  e.preventDefault();
                  if (!nextDisabled) onSearch(page + 1);
                };
                return (
                  <>
                    <Pagination className="justify-start">
                      <PaginationContent className="gap-0 divide-x overflow-hidden rounded-lg border">
                        <PaginationItem>
                          <PaginationPrevious
                            size="icon-sm"
                            href="#"
                            onClick={handlePrev}
                            className={cn(
                              'rounded-none border-0',
                              prevDisabled && 'pointer-events-none opacity-50'
                            )}
                          />
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationNext
                            size="icon-sm"
                            href="#"
                            onClick={handleNext}
                            className={cn(
                              'rounded-none border-0',
                              nextDisabled && 'pointer-events-none opacity-50'
                            )}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                    <span className="text-muted-foreground text-sm whitespace-nowrap">
                      Página {page} de {totalPages}
                    </span>
                  </>
                );
              })()}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isLinking}>
              Cancelar
            </Button>
            <Button onClick={onLinkSelected} disabled={selectedPalletIds.length === 0 || isLinking}>
              {isLinking ? (
                <>
                  <Loader2 className="animate-spin" />
                  Vinculando...
                </>
              ) : (
                <>
                  <Link2 />
                  Vincular {selectedPalletIds.length > 0 ? `(${selectedPalletIds.length})` : ''}
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
