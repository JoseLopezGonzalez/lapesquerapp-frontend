'use client';

import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, LayoutGrid, Search, X } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * Sheet inferior (mobile) con búsqueda, filtros por estado y acciones secundarias.
 * Plan: docs/mobile-app/implementacion/02-PLAN-LISTA-PEDIDOS-MOBILE.md (Fase 3)
 */
export default function OrdersListFiltersSheet({
  open,
  onOpenChange,
  searchText,
  onChangeSearch,
  categories,
  activeTab,
  onCategoryChange,
  onExport,
  onToggleViewMode,
  onClose,
}) {
  const handleCategorySelect = (value) => {
    onCategoryChange(value);
    onClose?.();
  };

  const handleClearFilters = () => {
    onChangeSearch?.('');
    onCategoryChange?.('all');
    onClose?.();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex max-h-[85vh] flex-col rounded-t-2xl pb-[env(safe-area-inset-bottom)]"
      >
        <SheetHeader className="border-b pb-4 text-left">
          <SheetTitle className="text-lg">Buscar y filtrar</SheetTitle>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto py-4">
          {/* Búsqueda */}
          <div className="space-y-2">
            <label className="text-foreground text-sm font-medium">Buscar</label>
            <div className="relative">
              <Input
                value={searchText}
                onChange={(e) => onChangeSearch(e.target.value)}
                placeholder="Por ID o nombre de cliente"
                className="h-12 rounded-xl pr-12 pl-4 text-base"
                autoFocus
              />
              <button
                type="button"
                className="absolute top-0 right-0 flex h-12 w-12 touch-manipulation items-center justify-center"
                onClick={() => searchText?.length > 0 && onChangeSearch('')}
                aria-label={searchText ? 'Limpiar búsqueda' : 'Buscar'}
              >
                {searchText ? (
                  <X className="text-muted-foreground h-5 w-5" />
                ) : (
                  <Search className="text-muted-foreground h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Filtro por estado — pill seleccionado con relleno fuerte */}
          <div className="space-y-2">
            <label className="text-foreground text-sm font-medium">Estado</label>
            <Tabs value={activeTab} onValueChange={handleCategorySelect}>
              <TabsList className="bg-muted grid h-12 w-full grid-cols-3 rounded-xl p-1">
                {categories.map((cat) => (
                  <TabsTrigger
                    key={cat.name}
                    value={cat.name}
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:hover:bg-muted/80 rounded-lg text-sm font-medium data-[state=active]:shadow-sm"
                  >
                    {cat.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Acciones avanzadas — visualmente secundarias */}
          <div className="bg-muted/40 space-y-2 rounded-xl p-3">
            <label className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Acciones avanzadas
            </label>
            <div className="flex flex-col gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground h-11 w-full justify-start gap-2.5 text-sm"
                onClick={() => {
                  onToggleViewMode?.();
                  onClose?.();
                }}
              >
                <LayoutGrid className="h-4 w-4 shrink-0" />
                Vista de Producción
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground h-11 w-full justify-start gap-2.5 text-sm"
                onClick={() => {
                  onExport?.();
                  onClose?.();
                }}
              >
                <Download className="h-4 w-4 shrink-0" />
                Exportar Excel
              </Button>
            </div>
          </div>

          <SheetFooter className="mt-auto flex-row gap-2 border-t pt-4 sm:gap-2">
            <Button variant="outline" className="h-12 flex-1" onClick={handleClearFilters}>
              Limpiar filtros
            </Button>
            <Button className="h-12 flex-1" onClick={() => onClose?.()}>
              Listo
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
