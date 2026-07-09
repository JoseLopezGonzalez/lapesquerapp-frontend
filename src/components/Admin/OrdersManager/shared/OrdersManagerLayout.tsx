'use client';

import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import ProductionView from '@/components/Admin/OrdersManager/ProductionView';

interface OrdersManagerLayoutProps {
  loading?: boolean;
  viewMode?: string;
  isMobile?: boolean;
  hasDetail?: boolean;
  listContent: ReactNode;
  detailContent: ReactNode;
  onClickProductionOrder: (orderId: number | string) => void;
  onToggleViewMode?: () => void;
}

export default function OrdersManagerLayout({
  loading,
  viewMode,
  isMobile,
  hasDetail,
  listContent,
  detailContent,
  onClickProductionOrder,
  onToggleViewMode,
}: OrdersManagerLayoutProps) {
  if (loading) {
    if (isMobile && hasDetail) {
      return <div className="flex h-full min-h-0 flex-col overflow-hidden">{detailContent}</div>;
    }

    return (
      <div className="flex h-full flex-col">
        {isMobile ? (
          <MobileOrdersListSkeleton />
        ) : (
          <div className="flex h-full flex-col xl:flex-row">
            <div className="w-full overflow-hidden xl:h-full xl:w-[360px] xl:flex-shrink-0">
              <DesktopOrdersListSkeleton />
            </div>
            <div className="grow p-2 lg:pl-0" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {viewMode === 'production' ? (
        <div className="flex h-full flex-col overflow-hidden">
          <div className="h-full min-h-0 overflow-hidden">
            <ProductionView
              onClickOrder={onClickProductionOrder}
              onToggleViewMode={onToggleViewMode}
            />
          </div>
        </div>
      ) : isMobile ? (
        <div className="flex h-full min-h-0 flex-col">
          {hasDetail ? (
            <div className="h-full overflow-hidden">{detailContent}</div>
          ) : (
            <div className="flex h-full min-h-0 flex-col overflow-hidden">{listContent}</div>
          )}
        </div>
      ) : (
        <div className="flex h-full flex-col xl:flex-row">
          <div className="w-full xl:h-full xl:w-[360px] xl:flex-shrink-0">{listContent}</div>
          <div className="grow p-2 lg:pl-0">{detailContent}</div>
        </div>
      )}
    </div>
  );
}

// Silueta de OrdersList mobile: hero oscuro (back+título+crear, nº activos, chips estado) + búsqueda + tabs + tarjetas
function MobileOrdersListSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="bg-invert relative shrink-0 overflow-hidden rounded-br-[50%_42px] rounded-bl-[50%_42px] pt-5 pb-12">
        <div className="relative flex items-center justify-between gap-2 px-4">
          <Skeleton className="h-11 w-11 shrink-0 rounded-full bg-white/10" />
          <Skeleton className="h-4 w-32 bg-white/10" />
          <Skeleton className="h-11 w-11 shrink-0 rounded-lg bg-white/10" />
        </div>
        <div className="relative mt-3 flex flex-col items-center gap-2">
          <Skeleton className="h-10 w-16 bg-white/10" />
          <Skeleton className="h-3 w-24 bg-white/10" />
        </div>
        <div className="relative mt-4 flex flex-wrap justify-center gap-1.5 px-4">
          <Skeleton className="h-6 w-28 rounded-full bg-white/10" />
          <Skeleton className="h-6 w-24 rounded-full bg-white/10" />
          <Skeleton className="h-6 w-20 rounded-full bg-white/10" />
        </div>
      </div>
      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-visible px-4">
        <div className="-mt-8 mb-3 flex-shrink-0 space-y-4">
          <Skeleton className="h-12 w-full rounded-lg shadow-lg shadow-black/10" />
          <div className="flex gap-1.5 overflow-hidden">
            <Skeleton className="h-8 w-14 flex-shrink-0 rounded-full" />
            <Skeleton className="h-8 w-24 flex-shrink-0 rounded-full" />
            <Skeleton className="h-8 w-20 flex-shrink-0 rounded-full" />
            <Skeleton className="h-8 w-20 flex-shrink-0 rounded-full" />
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden pt-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <MobileOrderCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Silueta de OrderCard mobile: avatar redondeado + nombre + id·fecha·cajas + badge de estado + chevron
function MobileOrderCardSkeleton() {
  return (
    <div className="border-border bg-card rounded-xl border p-4">
      <div className="flex w-full min-w-0 items-center gap-3 pr-1">
        <Skeleton className="h-11 w-11 shrink-0 rounded-[13px]" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="h-3.5 w-3/5" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
        <Skeleton className="h-5 w-5 shrink-0 rounded-full" />
      </div>
    </div>
  );
}

// Silueta de OrdersList desktop: header (título+subtítulo+3 botones) + búsqueda + tabs + tarjetas ≈176px
function DesktopOrdersListSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex-shrink-0 px-4 pt-2 pb-3 sm:px-7 sm:pt-3">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md" />
          </div>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 sm:px-7">
        <div className="mb-5 flex-shrink-0 space-y-4 pt-2">
          <Skeleton className="h-9 w-full rounded-md" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-16 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden pt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <DesktopOrderCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Silueta de OrderCard desktop: estado+fecha, id+tags, nombre (2 líneas), fecha/cajas (4 sub-bloques)
function DesktopOrderCardSkeleton() {
  return (
    <div className="space-y-2 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-3 w-10" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-14 rounded-full" />
      </div>
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="flex items-center gap-4 pt-1">
        <div className="space-y-1">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-3.5 w-10" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3.5 w-6" />
        </div>
      </div>
    </div>
  );
}
