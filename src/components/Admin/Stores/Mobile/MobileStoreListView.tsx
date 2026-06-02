'use client';

import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';
import {
  ChevronRight,
  Loader2,
  Package,
  Plus,
  Sparkles,
  ThermometerSnowflake,
} from 'lucide-react';
import { TbTruckLoading } from 'react-icons/tb';
import { REGISTERED_PALLETS_STORE_ID } from '@/hooks/useStores';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { isExternalActor } from '@/lib/auth/actor';

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

function OccupancyBadge({ status }: { status: 'low' | 'medium' | 'high' }) {
  if (status === 'low') return <Badge className="bg-green-500 text-white text-[10px]">Libre</Badge>;
  if (status === 'medium')
    return <Badge className="bg-yellow-500 text-white text-[10px]">Medio</Badge>;
  return (
    <Badge className="animate-pulse bg-red-600 text-white text-[10px]">Lleno</Badge>
  );
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
  const fillPercentage =
    capacity > 0 ? ((store.totalNetWeight ?? 0) / capacity) * 100 : 0;
  const occupancyStatus =
    fillPercentage <= 50 ? 'low' : fillPercentage <= 80 ? 'medium' : 'high';

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
    <Card
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
        'flex w-full items-center gap-3 border-l-4 p-4 transition-colors active:bg-accent/60',
        borderClass,
        disabled && 'pointer-events-none opacity-60',
        !disabled && 'cursor-pointer'
      )}
    >
      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="truncate text-sm font-semibold">{store.name}</span>
          {!isGhostStore && <OccupancyBadge status={occupancyStatus} />}
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
          value={isGhostStore ? ((store.content?.pallets?.length ?? 0) > 0 ? 100 : 0) : Math.min(fillPercentage, 100)}
          className={cn('h-1.5', progressClass)}
        />
      </div>

      {/* Chevron */}
      <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
    </Card>
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
  const { data: session } = useSession();
  const router = useRouter();
  const externalActor = isExternalActor(session?.user);

  const realStores = stores.filter((s) => s.id !== REGISTERED_PALLETS_STORE_ID);

  if (!stores || stores.length === 0) {
    return (
      <div className="flex flex-col gap-3 p-4">
        {!externalActor && (
          <Card
            role="button"
            onClick={() => router.push('/admin/stores/create')}
            className="border-muted-foreground/25 hover:border-primary hover:bg-primary/5 flex w-full cursor-pointer items-center justify-center gap-3 border-2 border-dashed p-6 transition-colors"
          >
            <div className="border-primary/20 bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full border">
              <Plus className="text-primary h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Crear almacén</p>
              <p className="text-muted-foreground text-xs">Añade tu primer almacén</p>
            </div>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-3">
      {stores.map((store) => (
        <MobileStoreCard
          key={store.id}
          store={store}
          disabled={isStoreLoading}
          onClick={() => onSelectStore(store.id)}
        />
      ))}

      {/* Crear almacén — solo si no es externo y hay almacenes */}
      {realStores.length > 0 && !externalActor && (
        <Card
          role="button"
          onClick={() => router.push('/admin/stores/create')}
          className="border-muted-foreground/25 hover:border-primary hover:bg-primary/5 flex w-full cursor-pointer items-center gap-3 border-2 border-dashed p-4 transition-colors"
        >
          <div className="border-primary/20 bg-primary/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border">
            <Plus className="text-primary h-4 w-4" />
          </div>
          <span className="text-sm font-medium">Nuevo almacén</span>
        </Card>
      )}

      {/* Load more */}
      {hasMoreStores && (
        <Button
          variant="outline"
          className="mt-1 w-full"
          onClick={onLoadMore}
          disabled={loadingMore}
        >
          {loadingMore ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Cargando…
            </>
          ) : (
            'Ver más almacenes'
          )}
        </Button>
      )}
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
