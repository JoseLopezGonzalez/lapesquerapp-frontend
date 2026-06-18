'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';
import {
  ArrowLeft,
  ChevronRight,
  Loader2,
  Package,
  ScanLine,
  Search,
  Sparkles,
  ThermometerSnowflake,
  Warehouse,
} from 'lucide-react';
import PalletDialog from '@/components/Admin/Pallets/PalletDialog';
import dynamic from 'next/dynamic';
import { parseQrPayload } from '@/lib/qr/parseQrPayload';
import type { QrValidateResult } from '@/components/Shared/QrScannerWidget';

const QrScannerWidget = dynamic(
  () => import('@/components/Shared/QrScannerWidget').then((m) => ({ default: m.QrScannerWidget })),
  { ssr: false }
);
import { notify } from '@/lib/notifications';
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

  const iconBg = isGhostStore
    ? 'bg-slate-100 dark:bg-slate-800'
    : occupancyStatus === 'low'
      ? 'bg-green-50 dark:bg-green-950'
      : occupancyStatus === 'medium'
        ? 'bg-yellow-50 dark:bg-yellow-950'
        : 'bg-red-50 dark:bg-red-950';

  const iconColor = isGhostStore
    ? 'text-slate-500'
    : occupancyStatus === 'low'
      ? 'text-green-600'
      : occupancyStatus === 'medium'
        ? 'text-yellow-600'
        : 'text-red-600';

  const progressClass = isGhostStore
    ? '[&_[data-slot=progress-indicator]]:bg-slate-500/80'
    : occupancyStatus === 'low'
      ? '[&_[data-slot=progress-indicator]]:bg-green-500'
      : occupancyStatus === 'medium'
        ? '[&_[data-slot=progress-indicator]]:bg-orange-500'
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
        'transition-colors',
        disabled && 'pointer-events-none opacity-60',
        !disabled && 'cursor-pointer active:bg-accent/60'
      )}
    >
      <CardContent className="py-0">
        <div className="flex w-full min-w-0 grow items-center gap-3 pr-1">
          <div className="min-w-0 flex-1 space-y-1">
            <p className="truncate text-base leading-tight font-medium">{store.name}</p>

            {isGhostStore ? (
              <p className="text-muted-foreground text-sm tabular-nums">
                {store.content?.pallets?.length ?? 0} palets en espera
              </p>
            ) : (
              <div className="text-muted-foreground flex items-center gap-3 text-sm tabular-nums">
                {store.temperature != null && (
                  <span className="flex items-center gap-1.5">
                    <ThermometerSnowflake className="h-3.5 w-3.5 shrink-0" />
                    {store.temperature} ºC
                  </span>
                )}
                {(store.totalNetWeight ?? 0) > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5 shrink-0" />
                    {formatDecimalWeight(store.totalNetWeight ?? 0)}
                  </span>
                )}
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
              className={cn('h-2.5', progressClass)}
            />
          </div>

          <ChevronRight className="text-muted-foreground h-5 w-5 flex-shrink-0" aria-hidden />
        </div>
      </CardContent>
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
  type TabId = 'all' | 'low' | 'medium' | 'high';

  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [palletDialogId, setPalletDialogId] = useState<number | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const validatePalletQr = (rawValue: string): QrValidateResult => {
    const payload = parseQrPayload(rawValue);
    const palletId = payload.P || (/^\d+$/.test(rawValue) ? rawValue : null);
    if (!palletId || !/^\d+$/.test(String(palletId))) {
      return { ok: false, message: 'No se encontró un identificador de palet.' };
    }
    return { ok: true };
  };

  const handleScannedPalletQr = (rawValue: string) => {
    const payload = parseQrPayload(rawValue);
    const palletId = payload.P || (/^\d+$/.test(rawValue) ? rawValue : null);
    if (!palletId) return;
    setScannerOpen(false);
    setPalletDialogId(Number(palletId));
  };

  const handleScannerError = (message: string) => {
    notify.error({
      title: 'No se pudo abrir la cámara',
      description: message || 'Revisa permisos del navegador e inténtalo de nuevo.',
    });
    setScannerOpen(false);
  };

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

  const filteredByTab =
    activeTab === 'all'
      ? filteredStores
      : filteredStores.filter((s) => {
          if (s.id === REGISTERED_PALLETS_STORE_ID) return false;
          const cap = s.capacity || s.totalNetWeight || 1;
          const fill = cap > 0 ? ((s.totalNetWeight ?? 0) / cap) * 100 : 0;
          const status = fill <= 50 ? 'low' : fill <= 80 ? 'medium' : 'high';
          return status === activeTab;
        });

  const isEmpty = !stores || stores.length === 0;

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-background flex-shrink-0 px-0 pt-4 pb-3">
        <div className="flex items-center justify-between gap-2 px-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="hover:bg-muted h-12 min-h-12 w-12 min-w-12 shrink-0 rounded-full"
            aria-label="Volver"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h2 className="flex-1 truncate text-center text-xl font-normal dark:text-white">
            Almacenes
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setScannerOpen(true)}
            className="hover:bg-muted h-12 min-h-12 w-12 min-w-12 shrink-0 rounded-full"
            aria-label="Escanear QR de palet"
          >
            <ScanLine className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Contenido — estructura idéntica a gestor de pedidos */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4">
        {/* Buscador + tabs */}
        <div className="w-full flex-shrink-0 mb-3 space-y-4 pt-1">
          <InputGroup className="w-full">
            <InputGroupInput
              type="text"
              value={search}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              placeholder="Buscar almacén…"
            />
            <InputGroupAddon>
              <Search className="size-4" />
            </InputGroupAddon>
          </InputGroup>

          {!isEmpty && (
            <Tabs
              className=""
              value={activeTab}
              onValueChange={(v: string) => setActiveTab(v as TabId)}
            >
              <div className="scrollbar-hide overflow-x-auto">
                <TabsList className="w-max">
                  <TabsTrigger value="all">Todos</TabsTrigger>
                  <TabsTrigger value="low">Libres</TabsTrigger>
                  <TabsTrigger value="medium">Ocupados</TabsTrigger>
                  <TabsTrigger value="high">Llenos</TabsTrigger>
                </TabsList>
              </div>
            </Tabs>
          )}
        </div>

        {/* Lista */}
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
            <p className="text-sm font-medium">Sin almacenes</p>
            <p className="text-muted-foreground text-xs">No hay almacenes disponibles.</p>
          </div>
        ) : filteredByTab.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
            <p className="text-sm font-medium">Sin resultados</p>
            <p className="text-muted-foreground text-xs">
              {search.trim()
                ? `No hay almacenes que coincidan con «${search}».`
                : 'No hay almacenes con este estado.'}
            </p>
          </div>
        ) : (
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <div className="from-background pointer-events-none absolute top-0 right-0 left-0 z-10 h-8 bg-gradient-to-b to-transparent" />
            <div className="from-background pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-8 bg-gradient-to-t to-transparent" />
            <ScrollArea className="h-full w-full">
              <div className="flex flex-col gap-4 pt-2 pr-2 pb-6 pl-2">
                {filteredByTab.map((store) => (
                  <MobileStoreCard
                    key={store.id}
                    store={store}
                    disabled={isStoreLoading}
                    onClick={() => onSelectStore(store.id)}
                  />
                ))}
                <div ref={sentinelRef} className="flex h-2 items-center justify-center">
                  {loadingMore && (
                    <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
                  )}
                </div>
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Escáner QR global — sin contexto de almacén */}
      {scannerOpen && (
        <QrScannerWidget
          onScan={handleScannedPalletQr}
          onClose={() => setScannerOpen(false)}
          onError={handleScannerError}
          validate={validatePalletQr}
          statusText="Apunta al QR del palet"
          successText="Palet localizado"
        />
      )}

      {/* Editor de palet abierto directamente desde QR */}
      <PalletDialog
        palletId={palletDialogId}
        isOpen={palletDialogId !== null}
        onChange={() => {}}
        initialStoreId={null}
        onCloseDialog={() => setPalletDialogId(null)}
      />
    </div>
  );
}

export function MobileStoreListSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-[108px] w-full rounded-xl" />
      ))}
    </div>
  );
}
