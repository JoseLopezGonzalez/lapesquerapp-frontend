'use client';

import * as React from 'react';
import { AlertTriangle, Check, ChevronsUpDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { agendaStatusLabels, getStatusTone } from './utils';

const STATUS_OPTIONS = ['pending', 'reprogrammed', 'done', 'cancelled'];
const TARGET_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'prospect', label: 'Prospectos' },
  { value: 'customer', label: 'Clientes' },
];

const STATUS_DOT_COLORS = {
  pending: 'bg-blue-500',
  reprogrammed: 'bg-amber-500',
  done: 'bg-green-500',
  cancelled: 'bg-red-500',
};

function FilterSection({ label, children }) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      </div>
      {children}
    </div>
  );
}

export function AgendaFiltersDialog({
  open,
  onOpenChange,
  targetType,
  statuses,
  targetFilter,
  targetOptions = [],
  overdueOnly,
  onTargetTypeChange,
  onToggleStatus,
  onTargetFilterChange,
  onOverdueOnlyChange,
  onClearAll,
}) {
  const [comboOpen, setComboOpen] = React.useState(false);
  const selectedOption = targetOptions.find((o) => o.value === targetFilter) ?? null;

  const hasActiveFilters =
    targetType !== 'all' ||
    statuses.length < STATUS_OPTIONS.length ||
    targetFilter !== null ||
    overdueOnly;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Filtros</DialogTitle>
        </DialogHeader>

        <div className="grid gap-5">
          {/* Prospecto / Cliente */}
          <FilterSection label="Prospecto o cliente">
            <div className="flex gap-2">
              <Popover open={comboOpen} onOpenChange={setComboOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={comboOpen}
                    className="flex-1 justify-between font-normal"
                  >
                    <span className="truncate text-sm">
                      {selectedOption ? selectedOption.label : <span className="text-muted-foreground">Todos</span>}
                    </span>
                    <ChevronsUpDown className="size-4 shrink-0 opacity-40" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[340px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar..." />
                    <CommandList>
                      <CommandEmpty>Sin resultados para este mes</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="__all__"
                          onSelect={() => { onTargetFilterChange(null); setComboOpen(false); }}
                        >
                          <Check className={cn('size-4', targetFilter === null ? 'opacity-100' : 'opacity-0')} />
                          <span className="text-muted-foreground">Todos</span>
                        </CommandItem>
                        {targetOptions.map((option) => (
                          <CommandItem
                            key={option.value}
                            value={option.label}
                            onSelect={() => { onTargetFilterChange(option.value); setComboOpen(false); }}
                          >
                            <Check className={cn('size-4', targetFilter === option.value ? 'opacity-100' : 'opacity-0')} />
                            <span>{option.label}</span>
                            <span className="ml-auto text-xs text-muted-foreground">
                              {option.type === 'prospect' ? 'Prospecto' : 'Cliente'}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {targetFilter && (
                <Button variant="ghost" size="icon" onClick={() => onTargetFilterChange(null)} aria-label="Limpiar">
                  <X className="size-4" />
                </Button>
              )}
            </div>
          </FilterSection>

          <Separator />

          {/* Tipo */}
          <FilterSection label="Tipo">
            <div className="flex flex-wrap gap-2">
              {TARGET_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  size="sm"
                  disabled={Boolean(targetFilter)}
                  variant={targetType === option.value ? 'default' : 'outline'}
                  onClick={() => onTargetTypeChange(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </FilterSection>

          <Separator />

          {/* Estado */}
          <FilterSection label="Estado">
            <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
              {STATUS_OPTIONS.map((status) => (
                <label
                  key={status}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1 hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    checked={statuses.includes(status)}
                    onCheckedChange={() => onToggleStatus(status)}
                  />
                  <span className={`size-2 shrink-0 rounded-full ${STATUS_DOT_COLORS[status]}`} />
                  <span className="text-sm">{agendaStatusLabels[status]}</span>
                </label>
              ))}
            </div>
          </FilterSection>

          <Separator />

          {/* Solo vencidas */}
          <button
            type="button"
            onClick={() => onOverdueOnlyChange(!overdueOnly)}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all',
              overdueOnly
                ? 'border-red-300 bg-red-50/60 dark:border-red-800 dark:bg-red-950/20'
                : 'border-dashed border-muted-foreground/30 hover:border-muted-foreground/50 hover:bg-muted/30'
            )}
          >
            <div className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors',
              overdueOnly
                ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
                : 'bg-muted text-muted-foreground'
            )}>
              <AlertTriangle className="size-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn('text-sm font-medium', overdueOnly ? 'text-red-700 dark:text-red-400' : 'text-foreground')}>
                Solo vencidas
              </p>
              <p className="text-xs text-muted-foreground">Pendientes con fecha ya pasada</p>
            </div>
            <div className={cn(
              'size-4 rounded-full border-2 transition-colors',
              overdueOnly ? 'border-red-500 bg-red-500' : 'border-muted-foreground/40'
            )} />
          </button>
        </div>

        <DialogFooter className="gap-2">
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="mr-auto text-muted-foreground" onClick={onClearAll}>
              Limpiar filtros
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
