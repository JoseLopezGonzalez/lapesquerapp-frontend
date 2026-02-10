'use client';

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
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
        className="rounded-t-2xl pb-[env(safe-area-inset-bottom)] max-h-[85vh] flex flex-col"
      >
        <SheetHeader className="text-left pb-4 border-b">
          <SheetTitle className="text-lg">Buscar y filtrar</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-5 py-4 overflow-y-auto flex-1 min-h-0">
          {/* Búsqueda */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Buscar</label>
            <div className="relative">
              <Input
                value={searchText}
                onChange={(e) => onChangeSearch(e.target.value)}
                placeholder="Por ID o nombre de cliente"
                className="h-12 text-base pl-4 pr-12 rounded-xl"
                autoFocus
              />
              <button
                type="button"
                className="absolute right-0 top-0 h-12 w-12 flex items-center justify-center touch-manipulation"
                onClick={() => searchText?.length > 0 && onChangeSearch('')}
                aria-label={searchText ? 'Limpiar búsqueda' : 'Buscar'}
              >
                {searchText ? (
                  <X className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Search className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>

          {/* Filtro por estado — pill seleccionado con relleno fuerte */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Estado</label>
            <Tabs value={activeTab} onValueChange={handleCategorySelect}>
              <TabsList className="w-full grid grid-cols-3 h-12 p-1 rounded-xl bg-muted">
                {categories.map((cat) => (
                  <TabsTrigger
                    key={cat.name}
                    value={cat.name}
                    className="rounded-lg text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=inactive]:hover:bg-muted/80"
                  >
                    {cat.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Acciones avanzadas — visualmente secundarias */}
          <div className="space-y-2 rounded-xl bg-muted/40 p-3">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Acciones avanzadas</label>
            <div className="flex flex-col gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-11 justify-start gap-2.5 text-sm text-muted-foreground hover:text-foreground"
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
                className="w-full h-11 justify-start gap-2.5 text-sm text-muted-foreground hover:text-foreground"
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

          <SheetFooter className="flex-row gap-2 sm:gap-2 pt-4 mt-auto border-t">
            <Button
              variant="outline"
              className="flex-1 h-12"
              onClick={handleClearFilters}
            >
              Limpiar filtros
            </Button>
            <Button
              className="flex-1 h-12"
              onClick={() => onClose?.()}
            >
              Listo
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
