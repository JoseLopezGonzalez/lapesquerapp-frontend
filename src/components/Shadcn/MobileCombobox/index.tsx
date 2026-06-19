'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Check, ChevronsUpDown, Loader2, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export interface MobileComboboxOption {
  value: string | number;
  label: string;
}

interface MobileComboboxProps {
  options: MobileComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  notFoundMessage?: string;
  className?: string;
  value?: string | number;
  onChange: (value: string | number) => void;
  loading?: boolean;
  disabled?: boolean;
  title?: string;
}

export function MobileCombobox({
  options,
  placeholder = 'Seleccionar...',
  searchPlaceholder = 'Buscar...',
  notFoundMessage = 'Sin resultados',
  className,
  value,
  onChange,
  loading = false,
  disabled = false,
  title,
}: MobileComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const isDisabled = disabled || loading;

  const selectedOption = useMemo(() => {
    if (!value) return null;
    return (options ?? []).find((o) => String(o.value) === String(value));
  }, [options, value]);

  const filtered = useMemo(() => {
    if (!search.trim()) return options ?? [];
    const q = search.toLowerCase();
    return (options ?? []).filter((o) => String(o.label).toLowerCase().includes(q));
  }, [options, search]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 200);
      return () => clearTimeout(t);
    } else {
      setSearch('');
    }
  }, [open]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        disabled={isDisabled}
        className={cn('w-full justify-between overflow-hidden', className)}
        onClick={() => !isDisabled && setOpen(true)}
      >
        <span className="truncate text-start text-base md:text-sm">
          {loading && !value ? (
            <span className="text-muted-foreground">Cargando opciones...</span>
          ) : selectedOption ? (
            selectedOption.label
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </span>
        {loading ? (
          <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
        ) : (
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        )}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="flex h-[75dvh] flex-col gap-0 rounded-t-2xl p-0"
        >
          <SheetHeader className="shrink-0 border-b px-4 pb-3 pt-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-base">{title ?? placeholder}</SheetTitle>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                className="h-8 w-8 shrink-0"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>

          <div className="shrink-0 border-b px-3 py-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-10 pl-9"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">{notFoundMessage}</p>
            ) : (
              <ul className="divide-y">
                {filtered.map((option) => {
                  const isSelected = String(option.value) === String(value ?? '');
                  return (
                    <li key={option.value}>
                      <button
                        type="button"
                        className={cn(
                          'flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm transition-colors active:bg-accent',
                          isSelected && 'bg-primary/5 font-medium'
                        )}
                        onClick={() => {
                          onChange(isSelected ? '' : option.value);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            'h-4 w-4 shrink-0 text-primary',
                            isSelected ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <span className="flex-1">{option.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="shrink-0" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} />
        </SheetContent>
      </Sheet>
    </>
  );
}
