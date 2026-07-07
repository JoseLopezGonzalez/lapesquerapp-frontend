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
  Loader2,
  Package,
  ScanLine,
  Search,
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
import { EmptyState } from '@/components/Utilities/EmptyState';

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

const OCCUPANCY_AVATAR_CLASS: Record<'low' | 'medium' | 'high', string> = {
  low: 'bg-green-500',
  medium: 'bg-orange-500',
  high: 'bg-red-600',
};

const OCCUPANCY_TEXT_CLASS: Record<'low' | 'medium' | 'high', string> = {
  low: 'text-green-700 dark:text-green-400',
  medium: 'text-orange-700 dark:text-orange-400',
  high: 'text-red-700 dark:text-red-400',
};

const OCCUPANCY_BADGE_CLASS: Record<'low' | 'medium' | 'high', string> = {
  low: 'bg-green-500/15 text-green-700 dark:text-green-300',
  medium: 'bg-orange-500/15 text-orange-700 dark:text-orange-300',
  high: 'bg-red-500/15 text-red-700 dark:text-red-300',
};

const OCCUPANCY_LABEL: Record<'low' | 'medium' | 'high', string> = {
  low: 'Libre',
  medium: 'Ocupado',
  high: 'Lleno',
};

function storeInitials(name: string) {
  const cleaned = name.replace(/^Almacén\s*/i, '').trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return 'AL';
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
        !disabled && 'active:bg-accent/60 cursor-pointer'
      )}
    >
      <CardContent className="py-0">
        <div className="flex w-full min-w-0 grow items-center gap-3">
          <div
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] text-base font-extrabold text-white',
              isGhostStore ? 'bg-slate-500' : OCCUPANCY_AVATAR_CLASS[occupancyStatus]
            )}
            aria-hidden="true"
          >
            {isGhostStore ? <Package className="h-5 w-5" /> : storeInitials(store.name)}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-base leading-tight font-medium">{store.name}</p>
              {!isGhostStore && (
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                    OCCUPANCY_BADGE_CLASS[occupancyStatus]
                  )}
                >
                  {OCCUPANCY_LABEL[occupancyStatus]}
                </span>
              )}
            </div>

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
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Progress
            value={
              isGhostStore
                ? (store.content?.pallets?.length ?? 0) > 0
                  ? 100
                  : 0
                : Math.min(fillPercentage, 100)
            }
            className={cn('h-2.5 flex-1', progressClass)}
          />
          {!isGhostStore && (
            <span
              className={cn(
                'w-9 shrink-0 text-right text-[11px] font-bold tabular-nums',
                OCCUPANCY_TEXT_CLASS[occupancyStatus]
              )}
            >
              {Math.round(Math.min(fillPercentage, 100))}%
            </span>
          )}
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

  const getOccupancyStatus = (s: Store): 'low' | 'medium' | 'high' => {
    const cap = s.capacity || s.totalNetWeight || 1;
    const fill = cap > 0 ? ((s.totalNetWeight ?? 0) / cap) * 100 : 0;
    return fill <= 50 ? 'low' : fill <= 80 ? 'medium' : 'high';
  };

  const realStores = (stores ?? []).filter((s) => s.id !== REGISTERED_PALLETS_STORE_ID);

  const filteredStores = search.trim()
    ? (stores ?? []).filter((s) => s.name.toLowerCase().includes(search.trim().toLowerCase()))
    : (stores ?? []);

  const filteredByTab =
    activeTab === 'all'
      ? filteredStores
      : filteredStores.filter((s) => {
          if (s.id === REGISTERED_PALLETS_STORE_ID) return false;
          return getOccupancyStatus(s) === activeTab;
        });

  const isEmpty = !stores || stores.length === 0;

  const tabDefs: { key: TabId; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'low', label: 'Libres' },
    { key: 'medium', label: 'Ocupados' },
    { key: 'high', label: 'Llenos' },
  ];
  const countForTab = (key: TabId) =>
    key === 'all'
      ? filteredStores.length
      : filteredStores.filter(
          (s) => s.id !== REGISTERED_PALLETS_STORE_ID && getOccupancyStatus(s) === key
        ).length;

  const STATUS_CHIP_DEFS: { key: 'medium' | 'low' | 'high'; label: string; dotClass: string }[] = [
    { key: 'medium', label: 'Ocupado', dotClass: 'bg-orange-400' },
    { key: 'low', label: 'Libre', dotClass: 'bg-green-400' },
    { key: 'high', label: 'Lleno', dotClass: 'bg-red-400' },
  ];
  const statusCounts = {
    low: realStores.filter((s) => getOccupancyStatus(s) === 'low').length,
    medium: realStores.filter((s) => getOccupancyStatus(s) === 'medium').length,
    high: realStores.filter((s) => getOccupancyStatus(s) === 'high').length,
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-invert relative shrink-0 overflow-hidden rounded-br-[50%_42px] rounded-bl-[50%_42px] pt-5 pb-12">
        <div className="relative flex items-center justify-between gap-2 px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-invert-foreground h-11 min-h-11 w-11 min-w-11 shrink-0 rounded-full hover:bg-white/10 hover:text-white"
            aria-label="Volver"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-invert-foreground flex-1 truncate text-center text-base font-semibold">
            Almacenes
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setScannerOpen(true)}
            className="text-invert-foreground h-11 min-h-11 w-11 min-w-11 shrink-0 rounded-full bg-white/10 hover:bg-white/15 hover:text-white"
            aria-label="Escanear QR de palet"
          >
            <ScanLine className="h-5 w-5" />
          </Button>
        </div>

        <div className="relative mt-3 text-center">
          <p className="text-invert-foreground text-[40px] leading-none font-extrabold tracking-tight">
            {realStores.length}
          </p>
          <p className="text-invert-foreground/60 mt-1 text-[13px] font-medium">
            almacén{realStores.length !== 1 ? 'es' : ''}
          </p>
        </div>

        {!isEmpty && (
          <div className="relative mt-4 flex flex-wrap justify-center gap-1.5 px-4">
            {STATUS_CHIP_DEFS.map(({ key, label, dotClass }) =>
              statusCounts[key] > 0 ? (
                <span
                  key={key}
                  className="text-invert-foreground inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-semibold"
                >
                  <span className={cn('h-1.5 w-1.5 rounded-full', dotClass)} />
                  {label}
                  <span className="text-invert-foreground/60">{statusCounts[key]}</span>
                </span>
              ) : null
            )}
          </div>
        )}
      </div>

      {/* Contenido — estructura idéntica a gestor de pedidos */}
      <div className="flex min-h-0 flex-1 flex-col overflow-visible px-4">
        {/* Buscador + tabs */}
        <div className="relative z-10 -mt-8 mb-3 w-full flex-shrink-0 space-y-4">
          <InputGroup className="bg-background w-full rounded-2xl border-0 shadow-lg shadow-black/10">
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
                <TabsList className="h-auto w-max gap-1.5 bg-transparent p-0">
                  {tabDefs.map(({ key, label }) => (
                    <TabsTrigger
                      key={key}
                      value={key}
                      className="group bg-muted/60 text-foreground/70 data-active:bg-invert data-active:text-invert-foreground dark:data-active:bg-invert dark:data-active:text-invert-foreground gap-1.5 rounded-full border-none px-3 py-1.5 text-[13px] font-semibold whitespace-nowrap shadow-none data-active:shadow-none dark:data-active:border-transparent"
                    >
                      {label}
                      <span className="text-foreground/60 group-data-active:text-invert-foreground rounded-full bg-black/10 px-1.5 py-0.5 text-[11px] font-bold group-data-active:bg-white/20">
                        {countForTab(key)}
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </Tabs>
          )}
        </div>

        {/* Lista */}
        {isEmpty ? (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState
              icon={<Warehouse className="text-primary h-10 w-10" />}
              title="Sin almacenes"
              description="No hay almacenes disponibles."
            />
          </div>
        ) : filteredByTab.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState
              icon={<Search className="text-primary h-10 w-10" />}
              title="Sin resultados"
              description={
                search.trim()
                  ? `No hay almacenes que coincidan con «${search}».`
                  : 'No hay almacenes con este estado.'
              }
            />
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
