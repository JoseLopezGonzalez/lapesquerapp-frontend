'use client';

import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/dateRangePicker';
import { useDebounce } from '@/hooks/useDebounce';
import type { MaquilaPalletFilters as Filters } from '@/types/pallet';

const STATE_OPTIONS = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'registered', label: 'Registrado' },
  { value: 'stored', label: 'Almacenado' },
  { value: 'shipped', label: 'Expedido' },
  { value: 'processed', label: 'Procesado' },
] as const;

const POSITION_OPTIONS = [
  { value: 'all', label: 'Ubicación (todas)' },
  { value: 'located', label: 'Ubicado' },
  { value: 'unlocated', label: 'Sin ubicar' },
] as const;

interface MaquilaPalletFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

export function MaquilaPalletFilters({ filters, onChange }: MaquilaPalletFiltersProps) {
  const [notesInput, setNotesInput] = useState(filters.notes ?? '');
  const debouncedNotes = useDebounce(notesInput, 400);

  useEffect(() => {
    if (debouncedNotes !== (filters.notes ?? '')) {
      onChange({ ...filters, notes: debouncedNotes || undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedNotes]);

  const dateRange = {
    from: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
    to: filters.dateTo ? new Date(filters.dateTo) : undefined,
  };

  const hasActiveFilters =
    !!filters.state || !!filters.position || !!filters.notes || !!filters.dateFrom;

  const handleClear = () => {
    setNotesInput('');
    onChange({});
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[180px] flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
        <Input
          value={notesInput}
          onChange={(e) => setNotesInput(e.target.value)}
          placeholder="Buscar en observaciones…"
          className="pl-8"
        />
      </div>

      <Select
        value={filters.state ?? 'all'}
        onValueChange={(value) =>
          onChange({ ...filters, state: value === 'all' ? undefined : (value as Filters['state']) })
        }
      >
        <SelectTrigger className="w-[170px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATE_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.position ?? 'all'}
        onValueChange={(value) =>
          onChange({
            ...filters,
            position: value === 'all' ? undefined : (value as Filters['position']),
          })
        }
      >
        <SelectTrigger className="w-[170px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {POSITION_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <DateRangePicker
        dateRange={dateRange}
        onChange={(range: { from?: Date; to?: Date }) =>
          onChange({
            ...filters,
            dateFrom: range.from ? range.from.toISOString().slice(0, 10) : undefined,
            dateTo: range.to ? range.to.toISOString().slice(0, 10) : undefined,
          })
        }
      />

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={handleClear} className="gap-1.5">
          <X className="h-3.5 w-3.5" />
          Limpiar
        </Button>
      )}
    </div>
  );
}
