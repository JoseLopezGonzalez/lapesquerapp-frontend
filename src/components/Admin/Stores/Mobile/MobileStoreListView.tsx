'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';
import {
  ChevronRight,
  Loader2,
  Package,
  Search,
  Sparkles,
  ThermometerSnowflake,
} from 'lucide-react';
import { TbTruckLoading } from 'react-icons/tb';
import { REGISTERED_PALLETS_STORE_ID } from '@/hooks/useStores';
import { cn } from '@/lib/utils';

interface Store {
  id: string | number;
  name: string;
  temperature?: number | null;
  capacity?: number | null;
  totalNetWeight?: number;
  content?: { pallets?: unknown[] };
}

interface MobileStoreListViewProps {
  stores: Store[];
  isStoreLoading: boolean;
  hasMoreStores: boolean;
  loadingMore: boolean;
  onSelectStore: (id: string | number) => void;
  onLoadMore: () => void;
}

function MobileStoreCard({
  store,
  disabled,
  onClick,
}: {
  store: Store;
  disabled: boolean;
  onClick: () => void;
}) {
  const isGhostStore = store.id === REGISTERED_PALLETS_STORE_ID;
  const capacity = store.capacity || store.totalNetWeight || 1;
  const fillPercentage = capacity > 0 ? ((store.totalNetWeight ?? 0) / capacity) * 100 : 0;
  const occupancyStatus = fillPercentage <= 50 ? 'low' : fillPercentage <= 80 ? 'medium' : 'high';

  const borderClass = isGhostStore
    ? 'border-l-slate-400 dark:border-l-slate-600'
    : occupancyStatus === 'low'
      ? 'border-l-green-500'
      : occupancyStatus === 'medium'
        ? 'border-l-yellow-500'
        : 'border-l-red-600';

  const progressClass = isGhostStore
    ? '[&_[data-slot=progress-indicator]]:bg-slate-500/80'
    : occupancyStatus === 'low'
      ? '[&_[data-slot=progress-indicator]]:bg-green-500'
      : occupancyStatus === 'medium'
        ? '[&_[data-slot=progress-indicator]]:bg-yellow-500'
        : '[&_[data-slot=progress-indicator]]:animate-pulse [&_[data-slot=progress-indicator]]:bg-red-600';

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={store.name}
      onClick={disabled ? undefined : onClick}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        'bg-card text-card-foreground active:bg-accent/60 flex w-full items-center gap-3 rounded-xl border border-l-4 p-4 shadow-sm transition-colors',
        borderClass,
        disabled && 'pointer-events-none opacity-60',
        !disabled && 'cursor-pointer'
      )}
    >
      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="truncate text-sm font-semibold">{store.name}</span>
        </div>

        {isGhostStore ? (
          <p className="text-muted-foreground mb-2 flex items-center gap-1 text-xs">
            <Sparkles className="h-3 w-3" />
            {store.content?.pallets?.length ?? 0} palés en espera
          </p>
        ) : (
          <div className="text-muted-foreground mb-2 flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
            {store.temperature != null && (
              <span className="flex items-center gap-1">
                <ThermometerSnowflake className="h-3 w-3" />
                {store.temperature} ºC
              </span>
            )}
            {store.capacity != null && (
              <span className="flex items-center gap-1">
                <TbTruckLoading className="h-3 w-3" />
                {formatDecimalWeight(store.capacity)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Package className="h-3 w-3" />
              {formatDecimalWeight(store.totalNetWeight ?? 0)} cargado
            </span>
          </div>
        )}

        <Progress
          value={
            isGhostStore
              ? (store.content?.pallets?.length ?? 0) > 0
                ? 100
                : 0
              : Math.min(fillPercentage, 100)
          }
          className={cn('h-1.5', progressClass)}
        />
      </div>

      {/* Chevron */}
      <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
    </div>
  );
}

export function MobileStoreListView({
  stores,
  isStoreLoading,
  hasMoreStores,
  loadingMore,
  onSelectStore,
  onLoadMore,
}: MobileStoreListViewProps) {
  const [search, setSearch] = useState('');
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMoreStores || loadingMore) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onLoadMore();
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMoreStores, loadingMore, onLoadMore]);

  const realStores = (stores ?? []).filter((s) => s.id !== REGISTERED_PALLETS_STORE_ID);

  const filteredStores = search.trim()
    ? (stores ?? []).filter((s) => s.name.toLowerCase().includes(search.trim().toLowerCase()))
    : (stores ?? []);

  const isEmpty = !stores || stores.length === 0;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-5 pb-3">
        <h2 className="text-xl font-semibold">Almacenes</h2>
        {realStores.length > 0 && (
          <p className="text-muted-foreground text-sm">
            {realStores.length} almacén{realStores.length !== 1 ? 'es' : ''}
          </p>
        )}
      </div>

      {/* Buscador */}
      <div className="flex-shrink-0 px-3 pb-3">
        <InputGroup className="h-10 w-full">
          <InputGroupInput
            type="text"
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            placeholder="Buscar almacén…"
          />
          <InputGroupAddon align="inline-end">
            <Search className="size-4" />
          </InputGroupAddon>
        </InputGroup>
      </div>

      {/* Lista */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
            <p className="text-sm font-medium">Sin almacenes</p>
            <p className="text-muted-foreground text-xs">No hay almacenes disponibles.</p>
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
            <p className="text-sm font-medium">Sin resultados</p>
            <p className="text-muted-foreground text-xs">
              No hay almacenes que coincidan con «{search}».
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 px-3 pb-3">
            {filteredStores.map((store) => (
              <MobileStoreCard
                key={store.id}
                store={store}
                disabled={isStoreLoading}
                onClick={() => onSelectStore(store.id)}
              />
            ))}

            {/* Sentinel de infinite scroll */}
            <div ref={sentinelRef} className="flex h-10 items-center justify-center">
              {loadingMore && <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function MobileStoreListSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-xl" />
      ))}
    </div>
  );
}
