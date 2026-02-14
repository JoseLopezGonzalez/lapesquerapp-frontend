'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Link2, Search, Loader2 } from 'lucide-react';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { Combobox } from '@/components/Shadcn/Combobox';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext } from '@/components/ui/pagination';
import Masonry from 'react-masonry-css';
import SearchPalletCard from '../SearchPalletCard';
import Loader from '@/components/Utilities/Loader';
import { cn } from '@/lib/utils';

export default function LinkPalletsDialog({
  open,
  onClose,
  orderId,
  pallets,
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
  currentPage,
}) {
  const handleClose = () => {
    if (!isLinking) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={isMobile ? "max-w-full w-full h-full max-h-full m-0 rounded-none flex flex-col" : "sm:max-w-4xl max-h-[85vh] flex flex-col"}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Vincular Palets Existentes
          </DialogTitle>
        </DialogHeader>
        {isInitialLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader />
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <div className="flex-shrink-0 pb-3 space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="store-filter" className="text-xs text-muted-foreground">Filtrar por almacén</Label>
                  <Combobox
                    options={[
                      { value: 'all', label: 'Todos los almacenes' },
                      ...storeOptions
                    ]}
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
                  <Label htmlFor="pallet-id-input" className="text-xs text-muted-foreground">Buscar por ID de palet</Label>
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
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs text-muted-foreground">IDs:</span>
                  {palletIds.map((id) => (
                    <Badge key={id} className="flex items-center gap-1">
                      {id}
                      <button
                        onClick={() => onRemovePalletId(id)}
                        type="button"
                        className="group hover:bg-white/95 bg-foreground-700 rounded-full text-md font-bold text-black-500 p-0.5 shadow-sm"
                        disabled={isSearching || isInitialLoading}
                      >
                        <XMarkIcon className="h-3 w-3 group-hover:text-primary" aria-hidden="true" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {searchResults.length > 0 && (
              <div className="flex-1 overflow-hidden flex flex-col min-h-0 space-y-3">
                <div className="flex items-center justify-between flex-shrink-0">
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
                    {selectedPalletIds.length === searchResults.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto min-h-0 pr-2 pb-2">
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
                      const isLinkedToOtherOrder = pallet.orderId && pallet.orderId !== orderId;
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
              <div className="text-center py-8 text-muted-foreground">
                <p>
                  {palletIds.length === 0
                    ? 'No hay palets disponibles para vincular.'
                    : 'No se encontraron palets con los IDs especificados.'}
                </p>
              </div>
            )}
          </div>
        )}
        <DialogFooter className="flex flex-row flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 mr-auto">
            {paginationMeta && paginationMeta.last_page > 1 && (() => {
              const totalPages = paginationMeta.last_page;
              const page = paginationMeta.current_page;
              const prevDisabled = page === 1 || isSearching;
              const nextDisabled = page === totalPages || isSearching;
              const handlePrev = (e) => {
                e.preventDefault();
                if (!prevDisabled) onSearch(page - 1);
              };
              const handleNext = (e) => {
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
                          className={cn("rounded-none border-0", prevDisabled && "pointer-events-none opacity-50")}
                        />
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext
                          size="icon-sm"
                          href="#"
                          onClick={handleNext}
                          className={cn("rounded-none border-0", nextDisabled && "pointer-events-none opacity-50")}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                  <span className="whitespace-nowrap text-sm text-muted-foreground">
                    Página {page} de {totalPages}
                  </span>
                </>
              );
            })()}
          </div>
          <div className="flex flex-row gap-2 flex-1 sm:flex-initial justify-end">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLinking}
              className={isMobile ? "flex-1" : ""}
            >
              Cancelar
            </Button>
            <Button
              onClick={onLinkSelected}
              disabled={selectedPalletIds.length === 0 || isLinking}
              className={isMobile ? "flex-1" : ""}
            >
              {isLinking ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Vinculando...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-2" />
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
