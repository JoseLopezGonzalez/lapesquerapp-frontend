'use client';

import { useMemo, useState } from 'react';
import type { MouseEvent } from 'react';
import { Check, Filter } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface RangeFilterValue {
  min: string;
  max: string;
}

interface ListFilterProps {
  mode: 'list';
  options: string[];
  value: Set<string>;
  onChange: (value: Set<string>) => void;
}

interface TextFilterProps {
  mode: 'text';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface RangeFilterProps {
  mode: 'range';
  value: RangeFilterValue;
  onChange: (value: RangeFilterValue) => void;
  unit?: string;
}

type BoxTableColumnFilterProps = { label: string } & (
  | ListFilterProps
  | TextFilterProps
  | RangeFilterProps
);

// Filtro de cabecera estilo Excel (autofilter): lista de checkboxes de valores únicos,
// texto "contiene", o rango numérico según la columna. Solo filtra la fila (client-side),
// nunca muta las cajas reales del palet.
export function BoxTableColumnFilter(props: BoxTableColumnFilterProps) {
  const { label, mode } = props;
  const [open, setOpen] = useState(false);

  const isActive =
    mode === 'list'
      ? props.value.size > 0
      : mode === 'text'
        ? props.value.trim() !== ''
        : props.value.min.trim() !== '' || props.value.max.trim() !== '';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-5 w-5 shrink-0', isActive ? 'text-primary' : 'text-muted-foreground')}
          aria-label={`Filtrar por ${label}`}
          onClick={(e: MouseEvent<HTMLButtonElement>) => e.stopPropagation()}
        >
          <Filter className={cn('h-3.5 w-3.5', isActive && 'fill-current')} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-64 p-0"
        onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        {mode === 'list' ? (
          <ListFilterContent {...props} />
        ) : mode === 'text' ? (
          <TextFilterContent {...props} onClose={() => setOpen(false)} />
        ) : (
          <RangeFilterContent {...props} onClose={() => setOpen(false)} />
        )}
      </PopoverContent>
    </Popover>
  );
}

function ListFilterContent({ options, value, onChange }: ListFilterProps) {
  const [search, setSearch] = useState('');

  const uniqueOptions = useMemo(
    () => Array.from(new Set(options.filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [options]
  );
  const visibleOptions = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return uniqueOptions;
    return uniqueOptions.filter((option) => option.toLowerCase().includes(term));
  }, [uniqueOptions, search]);
  const allSelected = value.size === 0;

  const toggleValue = (option: string) => {
    const next = new Set(value);
    if (next.has(option)) {
      next.delete(option);
    } else {
      next.add(option);
    }
    onChange(next);
  };

  return (
    <div>
      <div className="border-b p-2">
        <Input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar..."
          className="h-8"
        />
      </div>
      <div className="max-h-64 overflow-y-auto p-1">
        <button
          type="button"
          onClick={() => onChange(new Set())}
          className="hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm"
        >
          <Check className={cn('h-4 w-4 shrink-0', allSelected ? 'opacity-100' : 'opacity-0')} />
          <span className="font-medium">Todos</span>
        </button>
        {visibleOptions.length === 0 ? (
          <p className="text-muted-foreground px-2 py-3 text-center text-sm">Sin resultados</p>
        ) : (
          visibleOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => toggleValue(option)}
              className="hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm"
            >
              <Check
                className={cn('h-4 w-4 shrink-0', value.has(option) ? 'opacity-100' : 'opacity-0')}
              />
              <span className="min-w-0 flex-1 truncate">{option}</span>
            </button>
          ))
        )}
      </div>
      {value.size > 0 && (
        <div className="border-t p-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-full text-xs"
            onClick={() => onChange(new Set())}
          >
            Quitar filtro
          </Button>
        </div>
      )}
    </div>
  );
}

function TextFilterContent({
  value,
  onChange,
  placeholder,
  onClose,
}: TextFilterProps & { onClose: () => void }) {
  return (
    <div className="space-y-2 p-3">
      <Input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'Contiene...'}
      />
      <div className="flex justify-end gap-2">
        {value !== '' && (
          <Button variant="ghost" size="sm" onClick={() => onChange('')}>
            Quitar filtro
          </Button>
        )}
        <Button size="sm" onClick={onClose}>
          Aplicar
        </Button>
      </div>
    </div>
  );
}

function RangeFilterContent({
  value,
  onChange,
  unit,
  onClose,
}: RangeFilterProps & { onClose: () => void }) {
  return (
    <div className="space-y-2 p-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-muted-foreground text-xs">Mín {unit}</label>
          <Input
            type="number"
            step="0.01"
            value={value.min}
            onChange={(e) => onChange({ ...value, min: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-muted-foreground text-xs">Máx {unit}</label>
          <Input
            type="number"
            step="0.01"
            value={value.max}
            onChange={(e) => onChange({ ...value, max: e.target.value })}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        {(value.min !== '' || value.max !== '') && (
          <Button variant="ghost" size="sm" onClick={() => onChange({ min: '', max: '' })}>
            Quitar filtro
          </Button>
        )}
        <Button size="sm" onClick={onClose}>
          Aplicar
        </Button>
      </div>
    </div>
  );
}
